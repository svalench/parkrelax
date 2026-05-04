from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Booking
from app.schemas import BookingCreate, BookingResponse, BookingUpdate

router = APIRouter(prefix="/booking", tags=["booking"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    if data.endDate <= data.startDate:
        raise HTTPException(status_code=400, detail="endDate must be after startDate")
    booking = Booking(**data.model_dump())
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


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
