import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc, and_, or_, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from fastapi_viewsets import AsyncBaseViewset

from app.booking_logging import booking_logger
from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_user
from app.models import Booking, Accommodation, User, AdminEmail
from app.schemas import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    BookingPublicResponse,
)
from app.email_service import generate_temp_password, send_email
from app.user_password_service import hash_password
from app.routers.site_settings import require_public_booking_enabled
from app.services.payment_settings import (
    AUTO_PAYMENT_MODE,
    get_or_create_payment_settings,
    normalize_booking_payment_mode,
)

logger = logging.getLogger(__name__)

BOOKING_HOLD_MINUTES = 60

router = APIRouter(prefix="/booking", tags=["booking"])


async def _check_accommodation_availability(
    db: AsyncSession,
    accommodation_id: int,
    start_date,
    end_date,
    *,
    adults: int = 1,
    children: int = 0,
    exclude_booking_id: int | None = None,
) -> bool:
    from app.services.booking_availability import is_accommodation_available

    available = await is_accommodation_available(
        db,
        accommodation_id,
        start_date,
        end_date,
        adults=adults,
        children=children,
        exclude_booking_id=exclude_booking_id,
    )
    if not available:
        logger.warning(
            "Availability conflict: accommodation_id=%s, requested=%s..%s",
            accommodation_id,
            start_date,
            end_date,
        )
    return available


@router.post("", response_model=BookingPublicResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    await require_public_booking_enabled(db)
    if data.endDate <= data.startDate:
        raise HTTPException(status_code=400, detail="endDate must be after startDate")

    payment_settings = await get_or_create_payment_settings(db)
    booking_payment_mode = normalize_booking_payment_mode(payment_settings.bookingPaymentMode)
    auto_payment = booking_payment_mode == AUTO_PAYMENT_MODE

    accommodation = None
    if data.accommodationId:
        if auto_payment:
            await db.execute(
                update(Booking)
                .where(
                    Booking.accommodationId == data.accommodationId,
                    Booking.status == "payment_hold",
                    Booking.holdExpiresAt < datetime.utcnow(),
                )
                .values(status="cancelled")
            )

        # Verify accommodation exists and is active
        acc_result = await db.execute(
            select(Accommodation)
            .options(joinedload(Accommodation.type))
            .where(Accommodation.id == data.accommodationId, Accommodation.isActive == True)
        )
        accommodation = acc_result.unique().scalar_one_or_none()
        if not accommodation:
            raise HTTPException(status_code=404, detail="Accommodation not found or inactive")

        available = await _check_accommodation_availability(
            db,
            data.accommodationId,
            data.startDate,
            data.endDate,
            adults=data.adults or 1,
            children=data.children or 0,
        )
        if not available:
            from app.services.booking_availability import is_per_person_type

            if accommodation.type and is_per_person_type(accommodation.type):
                raise HTTPException(
                    status_code=409,
                    detail="На выбранные даты достигнут лимит гостей кемпинга",
                )
            raise HTTPException(status_code=409, detail="Данный дом занят на выбранный период")

    booking = Booking(**data.model_dump())
    if auto_payment:
        booking.status = "payment_hold"
        booking.holdExpiresAt = datetime.utcnow() + timedelta(minutes=BOOKING_HOLD_MINUTES)
    else:
        booking.status = "pending_confirmation"
    if data.customerEmail:
        booking.customerEmail = data.customerEmail.strip().lower()
    db.add(booking)
    await db.flush()

    booking_logger.info(
        "booking created: id=%s accommodation_id=%s dates=%s..%s adults=%s children=%s email=%s phone=%s status=%s hold_until=%s",
        booking.id,
        data.accommodationId,
        data.startDate,
        data.endDate,
        data.adults or 1,
        data.children or 0,
        data.customerEmail or "—",
        data.customerPhone or "—",
        booking.status,
        booking.holdExpiresAt.isoformat() if booking.holdExpiresAt else "—",
    )

    is_new_user = False
    temp_password = None

    if data.customerEmail:
        email = booking.customerEmail
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            is_new_user = True
            temp_password = generate_temp_password()
            user = User(
                unionId=f"email:{email}",
                email=email,
                name=data.customerName,
                passwordHash=hash_password(temp_password),
                emailVerified=False,
            )
            db.add(user)
            await db.flush()
            await send_email(
                db,
                to_email=email,
                template_type="temp_password",
                variables={
                    "name": data.customerName or "Гость",
                    "password": temp_password,
                    "startDate": data.startDate.isoformat(),
                    "endDate": data.endDate.isoformat(),
                    "houseName": accommodation.name if data.accommodationId else "—",
                },
            )
        booking.userId = user.id

    await db.commit()
    await db.refresh(booking)

    # ── Send emails ──────────────────────────────────────────────────
    from app.services.booking_availability import calculate_booking_total

    nights = max(1, (data.endDate - data.startDate).days) if accommodation else 0
    total_price = (
        calculate_booking_total(
            accommodation,
            adults=data.adults or 1,
            children=data.children or 0,
            nights=nights,
        )
        if accommodation
        else 0
    )
    admin_url = "https://parkrelax.by/admin"

    if not auto_payment:
        # 1. Admin notification
        admin_emails_result = await db.execute(select(AdminEmail).where(AdminEmail.isActive == True))
        admin_emails = [ae.email for ae in admin_emails_result.scalars().all()]
        if admin_emails and accommodation:
            for admin_email in admin_emails:
                await send_email(
                    db,
                    to_email=admin_email,
                    template_type="new_booking_admin",
                    variables={
                        "bookingId": str(booking.id),
                        "customerName": data.customerName or "—",
                        "customerPhone": data.customerPhone or "—",
                        "customerEmail": data.customerEmail or "—",
                        "houseName": accommodation.name,
                        "startDate": data.startDate.isoformat(),
                        "endDate": data.endDate.isoformat(),
                        "adults": str(data.adults or 1),
                        "children": str(data.children or 0),
                        "nights": str(nights),
                        "totalPrice": str(total_price),
                        "adminUrl": admin_url,
                    },
                )

        # 2. Client confirmation (always send if email provided)
        if data.customerEmail and accommodation:
            await send_email(
                db,
                to_email=data.customerEmail,
                template_type="booking_confirmation",
                variables={
                    "name": data.customerName or "Гость",
                    "houseName": accommodation.name,
                    "startDate": data.startDate.isoformat(),
                    "endDate": data.endDate.isoformat(),
                    "adults": str(data.adults or 1),
                    "children": str(data.children or 0),
                    "nights": str(nights),
                },
            )

    # Reload with relationships for serialization
    result = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.accommodation).joinedload(Accommodation.type),
            selectinload(Booking.accommodation).selectinload(Accommodation.images),
            selectinload(Booking.accommodation).selectinload(Accommodation.features),
        )
        .where(Booking.id == booking.id)
    )
    booking = result.unique().scalar_one()

    response_data = BookingPublicResponse.model_validate(booking)
    response_data.isNewUser = is_new_user
    response_data.tempPassword = temp_password
    return response_data


@router.get("/my-bookings", response_model=list[BookingResponse])
async def list_bookings(
    phone: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.accommodation).joinedload(Accommodation.type),
            selectinload(Booking.accommodation).selectinload(Accommodation.images),
            selectinload(Booking.accommodation).selectinload(Accommodation.features),
        )
        .order_by(desc(Booking.createdAt))
    )
    if phone:
        stmt = stmt.where(Booking.customerPhone == phone)
    result = await db.execute(stmt)
    return result.unique().scalars().all()


@router.get("/my", response_model=list[BookingResponse])
async def my_bookings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = [Booking.userId == user.id]
    if user.email:
        filters.append(func.lower(Booking.customerEmail) == user.email.lower())

    logger.info(
        "my_bookings called: user_id=%s user_email=%s filters_count=%s",
        user.id,
        user.email,
        len(filters),
    )

    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.accommodation).joinedload(Accommodation.type),
            selectinload(Booking.accommodation).selectinload(Accommodation.images),
            selectinload(Booking.accommodation).selectinload(Accommodation.features),
        )
        .where(or_(*filters))
        .order_by(desc(Booking.createdAt))
    )
    result = await db.execute(stmt)
    bookings = result.unique().scalars().all()
    logger.info("my_bookings result: count=%s", len(bookings))
    return bookings


# ── Admin Viewset ──────────────────────────────────────────────────

admin_booking_viewset = AsyncBaseViewset(
    endpoint="/admin/bookings",
    model=Booking,
    response_model=BookingResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-booking"],
)
admin_booking_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])

# Admin CRUD is handled by admin_booking_viewset in main.py
