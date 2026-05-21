from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, asc, and_, or_, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Accommodation, AccommodationType, Booking, AccommodationImage
from app.schemas import (
    AccommodationResponse,
    AccommodationAvailabilityResponse,
    AccommodationBookingCheckResponse,
    AccommodationCreate,
    AccommodationUpdate,
    AccommodationTypeResponse,
)
from app.services.booking_availability import (
    booking_occupies_dates_filter,
    get_booked_accommodation_ids,
    is_accommodation_available,
)

router = APIRouter(prefix="/accommodation", tags=["accommodation"])


@router.get("/types", response_model=list[AccommodationTypeResponse])
async def list_types(
    include_all: bool = Query(False, alias="includeAll"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AccommodationType).where(AccommodationType.isActive == True)
    if not include_all:
        stmt = stmt.where(AccommodationType.showInListing == True)
    stmt = stmt.order_by(asc(AccommodationType.sortOrder))
    result = await db.execute(stmt)
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
    people: Optional[int] = Query(None, ge=1, alias="people"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Accommodation).options(joinedload(Accommodation.type), selectinload(Accommodation.images))
    if active_only:
        stmt = stmt.where(Accommodation.isActive == True)
    if type_id:
        stmt = stmt.where(Accommodation.typeId == type_id)
    if show_on_main is not None:
        stmt = stmt.where(Accommodation.showOnMain == show_on_main)
    if people is not None and people > 0:
        effective_capacity = case(
            (Accommodation.capacity > 0, Accommodation.capacity),
            else_=AccommodationType.capacity,
        )
        stmt = stmt.join(AccommodationType).where(effective_capacity >= people)
    stmt = stmt.order_by(asc(Accommodation.sortOrder))
    result = await db.execute(stmt)
    return result.unique().scalars().all()


@router.get("/availability", response_model=list[AccommodationAvailabilityResponse])
async def check_availability(
    type_id: Optional[int] = Query(None, alias="typeId"),
    check_in: Optional[date] = Query(None, alias="checkIn"),
    check_out: Optional[date] = Query(None, alias="checkOut"),
    adults: Optional[int] = Query(None, ge=1),
    children: Optional[int] = Query(None, ge=0),
    people: Optional[int] = Query(None, ge=1, alias="people"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Accommodation)
        .options(joinedload(Accommodation.type), selectinload(Accommodation.images))
        .join(AccommodationType)
        .where(Accommodation.isActive == True)
    )
    if type_id:
        stmt = stmt.where(Accommodation.typeId == type_id)

    total_guests = people if people is not None else ((adults or 0) + (children or 0))
    if total_guests > 0:
        effective_capacity = case(
            (Accommodation.capacity > 0, Accommodation.capacity),
            else_=AccommodationType.capacity,
        )
        stmt = stmt.where(effective_capacity >= total_guests)

    booked_ids: set[int] = set()
    if check_in and check_out:
        if check_out <= check_in:
            raise HTTPException(status_code=400, detail="checkOut must be after checkIn")

        booked_ids = await get_booked_accommodation_ids(db, check_in, check_out)

    if booked_ids:
        stmt = stmt.order_by(
            case((Accommodation.id.in_(booked_ids), 1), else_=0),
            asc(Accommodation.sortOrder),
        )
    else:
        stmt = stmt.order_by(asc(Accommodation.sortOrder))

    # Pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    items = result.unique().scalars().all()

    return [
        AccommodationAvailabilityResponse(
            **AccommodationResponse.model_validate(item).model_dump(),
            isBookedForDates=item.id in booked_ids,
        )
        for item in items
    ]


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
            booking_occupies_dates_filter(),
        )
    ).order_by(asc(Booking.startDate))
    result = await db.execute(stmt)
    bookings = result.scalars().all()
    return [
        {"startDate": b.startDate.isoformat(), "endDate": b.endDate.isoformat()}
        for b in bookings
    ]


@router.get(
    "/objects/{object_id}/availability-check",
    response_model=AccommodationBookingCheckResponse,
)
async def check_object_availability_for_booking(
    object_id: int,
    check_in: date = Query(..., alias="checkIn"),
    check_out: date = Query(..., alias="checkOut"),
    people: Optional[int] = Query(None, ge=1),
    db: AsyncSession = Depends(get_db),
):
    """Проверка перед формой бронирования (в т.ч. после обновления страницы)."""
    if check_out <= check_in:
        raise HTTPException(status_code=400, detail="checkOut must be after checkIn")

    result = await db.execute(
        select(Accommodation)
        .options(joinedload(Accommodation.type), selectinload(Accommodation.images))
        .join(AccommodationType)
        .where(Accommodation.id == object_id, Accommodation.isActive == True)
    )
    item = result.unique().scalar_one_or_none()
    if not item:
        return AccommodationBookingCheckResponse(available=False, accommodation=None)

    if people is not None and people > 0:
        effective_capacity = item.capacity if item.capacity > 0 else (item.type.capacity if item.type else 0)
        if effective_capacity < people:
            return AccommodationBookingCheckResponse(available=False, accommodation=None)

    dates_free = await is_accommodation_available(db, object_id, check_in, check_out)
    acc_response = AccommodationAvailabilityResponse(
        **AccommodationResponse.model_validate(item).model_dump(),
        isBookedForDates=not dates_free,
    )
    return AccommodationBookingCheckResponse(
        available=dates_free,
        accommodation=acc_response if dates_free else None,
    )


@router.get("/objects/{object_id}/booked-dates")
async def get_object_booked_dates(
    object_id: int,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Booking).where(
        and_(
            Booking.accommodationId == object_id,
            booking_occupies_dates_filter(),
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
