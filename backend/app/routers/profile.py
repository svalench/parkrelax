from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.dependencies import get_db, get_current_user
from app.models import User, Booking, Accommodation
from app.schemas import UserResponse, UserProfileUpdate, BookingResponse

router = APIRouter(prefix="/profile", tags=["profile"])


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
    stmt = (
        select(Booking)
        .options(joinedload(Booking.accommodation).joinedload(Accommodation.type))
        .where(
            or_(
                Booking.userId == user.id,
                Booking.customerEmail == user.email if user.email else False,
            )
        )
        .order_by(desc(Booking.createdAt))
    )
    result = await db.execute(stmt)
    return result.unique().scalars().all()
