from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, asc, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Accommodation, AccommodationType, Booking, AccommodationImage
from app.schemas import (
    AccommodationResponse,
    AccommodationCreate,
    AccommodationUpdate,
    AccommodationTypeResponse,
)

router = APIRouter(prefix="/accommodation", tags=["accommodation"])


@router.get("/types", response_model=list[AccommodationTypeResponse])
async def list_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AccommodationType)
        .where(AccommodationType.isActive == True)
        .order_by(asc(AccommodationType.sortOrder))
    )
    return result.scalars().all()


@router.get("/types/{type_id}", response_model=AccommodationTypeResponse)
async def get_type(type_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AccommodationType).where(AccommodationType.id == type_id)
    )
    type_obj = result.scalar_one_or_none()
    if not type_obj:
        raise HTTPException(status_code=404, detail="Тип размещения не найден")
    return type_obj


@router.get("/objects", response_model=list[AccommodationResponse])
async def list_objects(
    type_id: Optional[int] = Query(None, alias="typeId"),
    active_only: bool = Query(True, alias="activeOnly"),
    show_on_main: Optional[bool] = Query(None, alias="showOnMain"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Accommodation).options(joinedload(Accommodation.type), selectinload(Accommodation.images))
    if active_only:
        stmt = stmt.where(Accommodation.isActive == True)
    if type_id:
        stmt = stmt.where(Accommodation.typeId == type_id)
    if show_on_main is not None:
        stmt = stmt.where(Accommodation.showOnMain == show_on_main)
    stmt = stmt.order_by(asc(Accommodation.sortOrder))
    result = await db.execute(stmt)
    return result.unique().scalars().all()


@router.get("/availability", response_model=list[AccommodationResponse])
async def check_availability(
    type_id: Optional[int] = Query(None, alias="typeId"),
    check_in: Optional[date] = Query(None, alias="checkIn"),
    check_out: Optional[date] = Query(None, alias="checkOut"),
    adults: Optional[int] = Query(None, ge=1),
    children: Optional[int] = Query(None, ge=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Accommodation)
        .options(joinedload(Accommodation.type), selectinload(Accommodation.images))
        .where(Accommodation.isActive == True)
    )
    if type_id:
        stmt = stmt.where(Accommodation.typeId == type_id)

    total_guests = (adults or 0) + (children or 0)
    if total_guests > 0:
        stmt = stmt.where(Accommodation.capacity >= total_guests)

    if check_in and check_out:
        if check_out <= check_in:
            raise HTTPException(status_code=400, detail="checkOut must be after checkIn")

        # Find bookings that overlap with the requested range
        overlap_stmt = select(Booking.accommodationId).where(
            and_(
                Booking.accommodationId.isnot(None),
                Booking.status.in_(["pending", "confirmed", "pending_confirmation"]),
                Booking.startDate < check_out,
                Booking.endDate > check_in,
            )
        )
        overlap_result = await db.execute(overlap_stmt)
        booked_ids = {row for row in overlap_result.scalars().all()}
        if booked_ids:
            stmt = stmt.where(Accommodation.id.notin_(booked_ids))

    stmt = stmt.order_by(asc(Accommodation.sortOrder))

    # Pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.unique().scalars().all()

    # Attach pagination metadata via headers (or we could use a wrapper schema)
    # For simplicity we'll return just the list; frontend can infer has-more by length
    return items


@router.get("/booked-dates")
async def get_booked_dates(
    typeId: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    acc_ids_stmt = select(Accommodation.id)
    if typeId is not None:
        acc_ids_stmt = acc_ids_stmt.where(Accommodation.typeId == typeId)
    acc_result = await db.execute(acc_ids_stmt)
    acc_ids = list(acc_result.scalars().all())

    if not acc_ids:
        return []

    stmt = select(Booking).where(
        and_(
            Booking.accommodationId.in_(acc_ids),
            Booking.status.in_(["pending", "confirmed", "pending_confirmation"]),
        )
    ).order_by(asc(Booking.startDate))
    result = await db.execute(stmt)
    bookings = result.scalars().all()
    return [
        {"startDate": b.startDate.isoformat(), "endDate": b.endDate.isoformat()}
        for b in bookings
    ]


@router.get("/objects/{object_id}/booked-dates")
async def get_object_booked_dates(
    object_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Booking).where(
        and_(
            Booking.accommodationId == object_id,
            Booking.status.in_(["pending", "confirmed", "pending_confirmation"]),
        )
    ).order_by(asc(Booking.startDate))
    result = await db.execute(stmt)
    bookings = result.scalars().all()
    return [
        {"startDate": b.startDate.isoformat(), "endDate": b.endDate.isoformat()}
        for b in bookings
    ]


# ── Admin Viewsets ─────────────────────────────────────────────────

admin_accommodation_type_viewset = AsyncBaseViewset(
    endpoint="/admin/accommodationTypes",
    model=AccommodationType,
    response_model=AccommodationTypeResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-accommodation"],
)
admin_accommodation_type_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])

admin_accommodation_viewset = AsyncBaseViewset(
    endpoint="/admin/accommodations",
    model=Accommodation,
    response_model=AccommodationResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-accommodation"],
)
admin_accommodation_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
