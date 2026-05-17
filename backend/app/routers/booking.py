from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_user
from app.models import Booking, Accommodation, User, EmailAddress, SmtpSettings
from app.schemas import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    BookingPublicResponse,
)
from app.email_service import generate_temp_password, send_email
from app.routers.user_auth import _hash_password

router = APIRouter(prefix="/booking", tags=["booking"])


async def _check_accommodation_availability(
    db: AsyncSession,
    accommodation_id: int,
    start_date,
    end_date,
    exclude_booking_id: int | None = None,
) -> bool:
    stmt = select(Booking).where(
        and_(
            Booking.accommodationId == accommodation_id,
            Booking.status.in_(["pending", "confirmed", "paid", "pending_confirmation"]),
            Booking.startDate < end_date,
            Booking.endDate > start_date,
        )
    )
    if exclude_booking_id:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is None


@router.post("", response_model=BookingPublicResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    if data.endDate <= data.startDate:
        raise HTTPException(status_code=400, detail="endDate must be after startDate")

    if data.accommodationId:
        # Verify accommodation exists and is active
        acc_result = await db.execute(
            select(Accommodation).where(Accommodation.id == data.accommodationId, Accommodation.isActive == True)
        )
        accommodation = acc_result.scalar_one_or_none()
        if not accommodation:
            raise HTTPException(status_code=404, detail="Accommodation not found or inactive")

        available = await _check_accommodation_availability(
            db, data.accommodationId, data.startDate, data.endDate
        )
        if not available:
            raise HTTPException(status_code=409, detail="Данный дом занят на выбранный период")

    booking = Booking(**data.model_dump())
    # New public bookings always start as pending_confirmation
    booking.status = "pending_confirmation"
    db.add(booking)
    await db.flush()

    is_new_user = False
    temp_password = None

    if data.customerEmail:
        email = data.customerEmail.strip().lower()
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            is_new_user = True
            temp_password = generate_temp_password()
            user = User(
                unionId=f"email:{email}",
                email=email,
                name=data.customerName,
                passwordHash=_hash_password(temp_password),
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

    # Send notification to admin
    admin_emails = []
    email_addrs_result = await db.execute(
        select(EmailAddress).order_by(EmailAddress.sortOrder)
    )
    email_addrs = email_addrs_result.scalars().all()
    if email_addrs:
        admin_emails = [ea.email for ea in email_addrs]
    else:
        smtp_result = await db.execute(select(SmtpSettings).where(SmtpSettings.isActive == True))
        smtp = smtp_result.scalar_one_or_none()
        if smtp and smtp.fromEmail:
            admin_emails = [smtp.fromEmail]

    if admin_emails and accommodation:
        nights = max(1, (data.endDate - data.startDate).days)
        total_price = nights * (accommodation.pricePerNight or 0)
        admin_url = "https://parkrelax.by/admin"  # production url
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
                    "houseName": accommodation.name if accommodation else "—",
                    "startDate": data.startDate.isoformat(),
                    "endDate": data.endDate.isoformat(),
                    "adults": str(data.adults or 1),
                    "children": str(data.children or 0),
                    "nights": str(nights),
                    "totalPrice": str(total_price),
                    "adminUrl": admin_url,
                },
            )

    # Reload with relationships for serialization
    result = await db.execute(
        select(Booking)
        .options(
            joinedload(Booking.accommodation).joinedload(Accommodation.type),
            selectinload(Booking.accommodation).selectinload(Accommodation.images),
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
            joinedload(Booking.accommodation).joinedload(Accommodation.type),
            selectinload(Booking.accommodation).selectinload(Accommodation.images),
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
    stmt = (
        select(Booking)
        .options(
            joinedload(Booking.accommodation).joinedload(Accommodation.type),
            selectinload(Booking.accommodation).selectinload(Accommodation.images),
        )
        .where(Booking.userId == user.id)
        .order_by(desc(Booking.createdAt))
    )
    result = await db.execute(stmt)
    return result.unique().scalars().all()


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
