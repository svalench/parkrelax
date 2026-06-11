import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.dependencies import get_db, get_current_user
from app.security import csrf_dependency
from app.models import User, Booking, Accommodation
from app.schemas import UserResponse, UserProfileUpdate, BookingResponse
from app.email_service import send_email
from app.routers.site_settings import require_public_booking_enabled

router = APIRouter(prefix="/profile", tags=["profile"])
logger = logging.getLogger(__name__)


@router.get("", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("", response_model=UserResponse)
async def update_profile(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email.strip().lower()
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/bookings", response_model=list[BookingResponse])
async def get_my_bookings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        filters = [Booking.userId == user.id]
        if user.email:
            filters.append(func.lower(Booking.customerEmail) == user.email.lower())

        logger.info(
            "get_my_bookings called: user_id=%s user_email=%s filters_count=%s",
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
        logger.info("get_my_bookings result: count=%s", len(bookings))
        return bookings
    except Exception as e:
        logger.exception("Error in get_my_bookings")
        raise HTTPException(status_code=500, detail=str(e))


_CANCELABLE_STATUSES = frozenset({"pending_confirmation", "pending", "paid", "confirmed"})


@router.post(
    "/bookings/{booking_id}/cancel",
    response_model=BookingResponse,
    dependencies=[Depends(csrf_dependency)],
)
async def cancel_my_booking(
    booking_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Отмена бронирования пользователем."""
    await require_public_booking_enabled(db)

    filters = [Booking.userId == user.id]
    if user.email:
        filters.append(func.lower(Booking.customerEmail) == user.email.lower())

    result = await db.execute(
        select(Booking)
        .options(
            selectinload(Booking.accommodation).joinedload(Accommodation.type),
            selectinload(Booking.accommodation).selectinload(Accommodation.images),
            selectinload(Booking.accommodation).selectinload(Accommodation.features),
        )
        .where(Booking.id == booking_id, or_(*filters))
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    if booking.status not in _CANCELABLE_STATUSES:
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")

    if booking.startDate <= date.today():
        raise HTTPException(status_code=400, detail="Cannot cancel booking after check-in date")

    booking.status = "cancelled"
    await db.commit()
    await db.refresh(booking)

    email = booking.customerEmail or user.email
    if email:
        await send_email(
            db,
            to_email=email,
            template_type="booking_cancelled",
            variables={
                "name": booking.customerName or user.name or "Гость",
                "houseName": booking.accommodation.name if booking.accommodation else "—",
                "startDate": booking.startDate.isoformat(),
                "endDate": booking.endDate.isoformat(),
                "bookingId": str(booking.id),
            },
        )

    return booking
