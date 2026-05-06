from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.dependencies import get_db, get_current_admin
from app.models import Booking, Accommodation, AccommodationType
from app.schemas import BookingCreate, BookingUpdate, BookingResponse
from app.routers.booking import _check_accommodation_availability

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])


def _week_bounds(d: date):
    """Return Monday and Sunday for the week containing date d."""
    monday = d - timedelta(days=d.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


@router.get("/week")
async def week_dashboard(
    week_date: Optional[date] = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    target = week_date or date.today()
    monday, sunday = _week_bounds(target)

    # All accommodations with types
    acc_result = await db.execute(
        select(Accommodation)
        .options(joinedload(Accommodation.type))
        .where(Accommodation.isActive == True)
        .order_by(Accommodation.sortOrder)
    )
    accommodations = acc_result.unique().scalars().all()

    # Bookings overlapping the week
    booking_result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation))
        .where(
            and_(
                Booking.status.in_(["pending", "confirmed", "paid"]),
                Booking.startDate <= sunday,
                Booking.endDate >= monday,
            )
        )
        .order_by(Booking.startDate)
    )
    bookings = booking_result.unique().scalars().all()

    # Group bookings by accommodation
    acc_bookings: dict[int, list] = {a.id: [] for a in accommodations}
    for b in bookings:
        if b.accommodationId and b.accommodationId in acc_bookings:
            acc_bookings[b.accommodationId].append(b)

    # Build house list
    houses = []
    occupied_count = 0
    for a in accommodations:
        house_bookings = acc_bookings.get(a.id, [])
        if house_bookings:
            occupied_count += 1
        hb = []
        for b in house_bookings:
            days_left = (b.endDate - date.today()).days
            hb.append({
                "id": b.id,
                "customerName": b.customerName,
                "customerPhone": b.customerPhone,
                "customerEmail": b.customerEmail,
                "startDate": b.startDate.isoformat(),
                "endDate": b.endDate.isoformat(),
                "adults": b.adults,
                "children": b.children,
                "status": b.status,
                "daysLeft": days_left,
            })
        houses.append({
            "id": a.id,
            "name": a.name,
            "typeName": a.type.name if a.type else None,
            "bookings": hb,
            "isOccupied": len(hb) > 0,
        })

    total = len(houses)
    free = total - occupied_count
    free_percentage = round((free / total) * 100, 1) if total else 0.0

    return {
        "weekStart": monday.isoformat(),
        "weekEnd": sunday.isoformat(),
        "totalHouses": total,
        "occupiedHouses": occupied_count,
        "freeHouses": free,
        "freePercentage": free_percentage,
        "houses": houses,
    }


@router.get("/month")
async def month_dashboard(
    month_date: Optional[date] = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    target = month_date or date.today()
    month_start = target.replace(day=1)
    # Calculate month end
    if month_start.month == 12:
        month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)

    # All accommodations with types
    acc_result = await db.execute(
        select(Accommodation)
        .options(joinedload(Accommodation.type))
        .where(Accommodation.isActive == True)
        .order_by(Accommodation.sortOrder)
    )
    accommodations = acc_result.unique().scalars().all()

    # Bookings overlapping the month
    booking_result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation))
        .where(
            and_(
                Booking.status.in_(["pending", "confirmed", "paid"]),
                Booking.startDate <= month_end,
                Booking.endDate >= month_start,
            )
        )
        .order_by(Booking.startDate)
    )
    bookings = booking_result.unique().scalars().all()

    # Group bookings by accommodation
    acc_bookings: dict[int, list] = {a.id: [] for a in accommodations}
    for b in bookings:
        if b.accommodationId and b.accommodationId in acc_bookings:
            acc_bookings[b.accommodationId].append(b)

    houses = []
    for a in accommodations:
        house_bookings = acc_bookings.get(a.id, [])
        hb = []
        for b in house_bookings:
            days_left = (b.endDate - date.today()).days
            hb.append({
                "id": b.id,
                "customerName": b.customerName,
                "customerPhone": b.customerPhone,
                "customerEmail": b.customerEmail,
                "startDate": b.startDate.isoformat(),
                "endDate": b.endDate.isoformat(),
                "adults": b.adults,
                "children": b.children,
                "status": b.status,
                "daysLeft": days_left,
            })
        houses.append({
            "id": a.id,
            "name": a.name,
            "typeName": a.type.name if a.type else None,
            "bookings": hb,
        })

    return {
        "monthStart": month_start.isoformat(),
        "monthEnd": month_end.isoformat(),
        "days": [
            (month_start + timedelta(days=i)).isoformat()
            for i in range((month_end - month_start).days + 1)
        ],
        "houses": houses,
    }


@router.get("/history")
async def booking_history(
    accommodation_id: Optional[int] = Query(None, alias="accommodationId"),
    type_id: Optional[int] = Query(None, alias="typeId"),
    start_from: Optional[date] = Query(None, alias="startFrom"),
    start_to: Optional[date] = Query(None, alias="startTo"),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    stmt = (
        select(Booking)
        .options(joinedload(Booking.accommodation).joinedload(Accommodation.type))
        .order_by(desc(Booking.startDate))
    )

    filters = []
    if accommodation_id:
        filters.append(Booking.accommodationId == accommodation_id)
    if type_id:
        # join accommodation to filter by type
        stmt = stmt.join(Accommodation, Booking.accommodationId == Accommodation.id)
        filters.append(Accommodation.typeId == type_id)
    if start_from:
        filters.append(Booking.startDate >= start_from)
    if start_to:
        filters.append(Booking.startDate <= start_to)
    if status:
        filters.append(Booking.status == status)

    if filters:
        stmt = stmt.where(and_(*filters))

    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    bookings = result.unique().scalars().all()

    items = []
    for b in bookings:
        items.append({
            "id": b.id,
            "customerName": b.customerName,
            "customerPhone": b.customerPhone,
            "customerEmail": b.customerEmail,
            "startDate": b.startDate.isoformat(),
            "endDate": b.endDate.isoformat(),
            "adults": b.adults,
            "children": b.children,
            "status": b.status,
            "accommodation": {
                "id": b.accommodation.id if b.accommodation else None,
                "name": b.accommodation.name if b.accommodation else None,
                "typeName": b.accommodation.type.name if b.accommodation and b.accommodation.type else None,
            } if b.accommodation else None,
            "createdAt": b.createdAt.isoformat() if b.createdAt else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size,
    }


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    today = date.today()
    start_of_month = today.replace(day=1)

    # Total bookings
    total_result = await db.execute(select(func.count()).select_from(Booking))
    total_bookings = total_result.scalar() or 0

    # This month bookings
    month_result = await db.execute(
        select(func.count())
        .select_from(Booking)
        .where(
            and_(
                Booking.startDate >= start_of_month,
                Booking.startDate <= today,
            )
        )
    )
    month_bookings = month_result.scalar() or 0

    # Today bookings (starting today)
    today_result = await db.execute(
        select(func.count())
        .select_from(Booking)
        .where(Booking.startDate == today)
    )
    today_bookings = today_result.scalar() or 0

    # Status counts
    status_result = await db.execute(
        select(Booking.status, func.count())
        .group_by(Booking.status)
    )
    status_counts = {row[0]: row[1] for row in status_result.all()}

    # Revenue estimate: sum of nights * pricePerNight where accommodation is set
    revenue_result = await db.execute(
        select(
            func.sum(
                func.julianday(Booking.endDate) - func.julianday(Booking.startDate)
            ).label("total_nights"),
            func.avg(Accommodation.pricePerNight).label("avg_price"),
        )
        .select_from(Booking)
        .join(Accommodation, Booking.accommodationId == Accommodation.id)
        .where(Booking.status.in_(["confirmed", "paid"]))
    )
    row = revenue_result.one_or_none()
    total_nights = row.total_nights if row else 0
    avg_price = row.avg_price if row else 0
    estimated_revenue = int(total_nights * avg_price)

    # Active bookings count (currently ongoing)
    active_result = await db.execute(
        select(func.count())
        .select_from(Booking)
        .where(
            and_(
                Booking.status.in_(["pending", "confirmed", "paid"]),
                Booking.startDate <= today,
                Booking.endDate >= today,
            )
        )
    )
    active_bookings = active_result.scalar() or 0

    return {
        "totalBookings": total_bookings,
        "monthBookings": month_bookings,
        "todayBookings": today_bookings,
        "activeBookings": active_bookings,
        "estimatedRevenue": estimated_revenue,
        "statusCounts": status_counts,
    }


@router.get("/occupancy")
async def occupancy_by_type(
    period_start: Optional[date] = Query(None, alias="periodStart"),
    period_end: Optional[date] = Query(None, alias="periodEnd"),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    today = date.today()
    start = period_start or today.replace(day=1)
    end = period_end or (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    # All types
    types_result = await db.execute(
        select(AccommodationType).order_by(AccommodationType.sortOrder)
    )
    types = types_result.scalars().all()

    # Houses per type
    houses_result = await db.execute(
        select(Accommodation.typeId, func.count())
        .where(Accommodation.isActive == True)
        .group_by(Accommodation.typeId)
    )
    houses_by_type = {row[0]: row[1] for row in houses_result.all()}

    # Bookings per type in period
    bookings_result = await db.execute(
        select(Accommodation.typeId, func.count())
        .select_from(Booking)
        .join(Accommodation, Booking.accommodationId == Accommodation.id)
        .where(
            and_(
                Booking.status.in_(["pending", "confirmed", "paid"]),
                Booking.startDate <= end,
                Booking.endDate >= start,
            )
        )
        .group_by(Accommodation.typeId)
    )
    bookings_by_type = {row[0]: row[1] for row in bookings_result.all()}

    # Calculate occupancy: simple ratio of bookings to houses
    # For a better metric we could calculate nights, but bookings count is a good proxy
    days_in_period = (end - start).days + 1
    data = []
    for t in types:
        total_houses = houses_by_type.get(t.id, 0)
        total_bookings = bookings_by_type.get(t.id, 0)
        # occupancy rate: (bookings / houses) as percentage
        # If 1 house and 1 booking in period = 100%
        occupancy = round((total_bookings / max(total_houses, 1)) * 100, 1)
        # Cap at 100 for display
        occupancy = min(occupancy, 100.0)
        data.append({
            "typeId": t.id,
            "typeName": t.name,
            "totalHouses": total_houses,
            "bookingsCount": total_bookings,
            "occupancyRate": occupancy,
        })

    return {
        "periodStart": start.isoformat(),
        "periodEnd": end.isoformat(),
        "types": data,
    }


@router.post("/bookings", response_model=BookingResponse, status_code=201)
async def admin_create_booking(
    data: BookingCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    if data.endDate <= data.startDate:
        raise HTTPException(status_code=400, detail="endDate must be after startDate")

    if data.accommodationId:
        acc_result = await db.execute(
            select(Accommodation).where(
                Accommodation.id == data.accommodationId,
                Accommodation.isActive == True,
            )
        )
        if not acc_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Accommodation not found or inactive")

        available = await _check_accommodation_availability(
            db, data.accommodationId, data.startDate, data.endDate
        )
        if not available:
            raise HTTPException(status_code=409, detail="Данный дом занят на выбранный период")

    booking = Booking(**data.model_dump(exclude_unset=True))
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation).joinedload(Accommodation.type))
        .where(Booking.id == booking.id)
    )
    return result.unique().scalar_one()


@router.patch("/bookings/{booking_id}", response_model=BookingResponse)
async def admin_update_booking(
    booking_id: int,
    data: BookingUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    update_data = data.model_dump(exclude_unset=True)

    # Check availability if dates or accommodation changed
    new_acc = update_data.get("accommodationId", booking.accommodationId)
    new_start = update_data.get("startDate", booking.startDate)
    new_end = update_data.get("endDate", booking.endDate)

    if "accommodationId" in update_data or "startDate" in update_data or "endDate" in update_data:
        if new_acc:
            available = await _check_accommodation_availability(
                db, new_acc, new_start, new_end, exclude_booking_id=booking_id
            )
            if not available:
                raise HTTPException(status_code=409, detail="Данный дом занят на выбранный период")

    for field, value in update_data.items():
        setattr(booking, field, value)

    await db.commit()
    await db.refresh(booking)

    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation).joinedload(Accommodation.type))
        .where(Booking.id == booking.id)
    )
    return result.unique().scalar_one()


@router.delete("/bookings/{booking_id}", status_code=204)
async def admin_delete_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    await db.delete(booking)
    await db.commit()
    return None
