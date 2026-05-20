import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.dependencies import get_db, get_current_user
from app.models import User, Booking, Accommodation
from app.schemas import UserResponse, UserProfileUpdate, BookingResponse

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
