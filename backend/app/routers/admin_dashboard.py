from datetime import date, datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy import select, func, and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.dependencies import get_db, get_current_admin
from app.models import Booking, Accommodation, AccommodationType, AccommodationImage, RentalItem, AdminEmail, User
from app.schemas import (
    BookingCreate, BookingUpdate, BookingResponse,
    RentalItemCreate, RentalItemUpdate, RentalItemResponse,
    AdminEmailCreate, AdminEmailUpdate, AdminEmailResponse,
)
from app.routers.booking import _check_accommodation_availability
from app.services.booking_availability import booking_occupies_dates_filter
from app.user_password_service import hash_password
from app.admin import _convert_to_webp, _delete_image_file
from app.email_service import send_email, get_active_smtp_settings, generate_temp_password

router = APIRouter(prefix="/admin/dashboard", tags=["admin-dashboard"])


def _booking_load_options():
    """Eager-load accommodation для BookingResponse (type + images)."""
    return (
        selectinload(Booking.accommodation).joinedload(Accommodation.type),
        selectinload(Booking.accommodation).selectinload(Accommodation.images),
    )


def _week_bounds(d: date):
    """Return Monday and Sunday for the week containing date d."""
    monday = d - timedelta(days=d.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _overlap_days(start1: date, end1: date, start2: date, end2: date) -> int:
    """Calculate inclusive overlapping days between two date intervals.
    Matches frontend isWithinInterval inclusive behaviour."""
    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)
    if overlap_start > overlap_end:
        return 0
    return (overlap_end - overlap_start).days + 1


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
                booking_occupies_dates_filter(),
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
    total_occupied_days = 0
    for a in accommodations:
        house_bookings = acc_bookings.get(a.id, [])
        house_occupied_days = 0
        hb = []
        for b in house_bookings:
            days_left = (b.endDate - date.today()).days
            house_occupied_days += _overlap_days(
                b.startDate, b.endDate, monday, sunday
            )
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
        total_occupied_days += house_occupied_days
        houses.append({
            "id": a.id,
            "name": a.name,
            "typeName": a.type.name if a.type else None,
            "bookings": hb,
            "isOccupied": len(hb) > 0,
            "occupiedDays": house_occupied_days,
        })

    total = len(houses)
    days_in_week = 7
    total_days = total * days_in_week
    free_days = total_days - total_occupied_days
    occupancy_rate = round((total_occupied_days / total_days) * 100, 1) if total_days else 0.0

    return {
        "weekStart": monday.isoformat(),
        "weekEnd": sunday.isoformat(),
        "totalHouses": total,
        "totalDays": total_days,
        "occupiedDays": total_occupied_days,
        "freeDays": free_days,
        "occupancyRate": occupancy_rate,
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
                booking_occupies_dates_filter(),
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
    total_nights = row.total_nights if row and row.total_nights is not None else 0
    avg_price = row.avg_price if row and row.avg_price is not None else 0
    estimated_revenue = int(total_nights * avg_price)

    # Active bookings count (currently ongoing)
    active_result = await db.execute(
        select(func.count())
        .select_from(Booking)
        .where(
            and_(
                booking_occupies_dates_filter(),
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

    # Fetch all overlapping bookings with accommodation info to calculate real occupied days
    bookings_result = await db.execute(
        select(Booking, Accommodation.typeId)
        .join(Accommodation, Booking.accommodationId == Accommodation.id)
        .where(
            and_(
                booking_occupies_dates_filter(),
                Booking.startDate <= end,
                Booking.endDate >= start,
            )
        )
    )
    bookings_rows = bookings_result.all()

    days_in_period = (end - start).days + 1
    occupied_days_by_type: dict[int, int] = {}
    for b, type_id in bookings_rows:
        overlap = _overlap_days(b.startDate, b.endDate, start, end)
        occupied_days_by_type[type_id] = occupied_days_by_type.get(type_id, 0) + overlap

    data = []
    for t in types:
        total_houses = houses_by_type.get(t.id, 0)
        occupied_days = occupied_days_by_type.get(t.id, 0)
        total_days = total_houses * days_in_period
        occupancy = round((occupied_days / max(total_days, 1)) * 100, 1)
        data.append({
            "typeId": t.id,
            "typeName": t.name,
            "totalHouses": total_houses,
            "totalDays": total_days,
            "occupiedDays": occupied_days,
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
    await db.flush()

    accommodation = None
    if data.accommodationId:
        acc_result = await db.execute(
            select(Accommodation).where(Accommodation.id == data.accommodationId)
        )
        accommodation = acc_result.scalar_one_or_none()

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
                    "houseName": accommodation.name if accommodation else "—",
                },
            )
        booking.userId = user.id

    await db.commit()
    await db.refresh(booking)

    # ── Send emails ──────────────────────────────────────────────────
    nights = max(1, (data.endDate - data.startDate).days) if accommodation else 0
    total_price = nights * (accommodation.pricePerNight or 0) if accommodation else 0
    admin_url = "https://parkrelax.by/admin"

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

    # 2. Client confirmation
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

    result = await db.execute(
        select(Booking)
        .options(*_booking_load_options())
        .where(Booking.id == booking.id)
    )
    return result.unique().scalar_one()


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def admin_get_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Booking)
        .options(*_booking_load_options())
        .where(Booking.id == booking_id)
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


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

    new_status = update_data.get("status", booking.status)

    if "accommodationId" in update_data or "startDate" in update_data or "endDate" in update_data:
        if new_acc:
            available = await _check_accommodation_availability(
                db, new_acc, new_start, new_end, exclude_booking_id=booking_id
            )
            if not available:
                raise HTTPException(status_code=409, detail="Данный дом занят на выбранный период")

    # Смена статуса на неотменённый — проверяем пересечение с другими бронями
    if "status" in update_data and new_status.strip().lower() not in ("cancelled", "canceled"):
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
        .options(*_booking_load_options())
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


# ── Accommodation Gallery Admin Endpoints ───────────────────────────

class AccommodationImageReorderItem(BaseModel):
    id: int
    sortOrder: int


@router.get("/accommodations")
async def admin_list_accommodations(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Accommodation)
        .options(joinedload(Accommodation.type))
        .order_by(asc(Accommodation.sortOrder))
    )
    return result.unique().scalars().all()


@router.get("/accommodations/{accommodation_id}/images")
async def admin_list_accommodation_images(
    accommodation_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(AccommodationImage)
        .where(AccommodationImage.accommodationId == accommodation_id)
        .order_by(asc(AccommodationImage.sortOrder))
    )
    return result.scalars().all()


@router.post("/accommodations/{accommodation_id}/images")
async def admin_upload_accommodation_images(
    accommodation_id: int,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    # Verify accommodation exists
    acc_result = await db.execute(
        select(Accommodation).where(Accommodation.id == accommodation_id)
    )
    accommodation = acc_result.scalar_one_or_none()
    if not accommodation:
        raise HTTPException(status_code=404, detail="Размещение не найдено")

    # Get current max sortOrder
    max_result = await db.execute(
        select(func.max(AccommodationImage.sortOrder))
        .where(AccommodationImage.accommodationId == accommodation_id)
    )
    max_sort = max_result.scalar() or 0

    created_images = []
    for idx, upload_file in enumerate(files):
        if upload_file.filename:
            new_url = _convert_to_webp(upload_file, "accommodation")
            image = AccommodationImage(
                accommodationId=accommodation_id,
                imageUrl=new_url,
                sortOrder=max_sort + idx + 1,
            )
            db.add(image)
            created_images.append(image)

    await db.commit()
    for img in created_images:
        await db.refresh(img)
    return created_images


@router.delete("/accommodations/{accommodation_id}/images/{image_id}", status_code=204)
async def admin_delete_accommodation_image(
    accommodation_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(AccommodationImage)
        .where(AccommodationImage.id == image_id)
        .where(AccommodationImage.accommodationId == accommodation_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Фото не найдено")
    _delete_image_file(image.imageUrl)
    await db.delete(image)
    await db.commit()
    return None


@router.patch("/accommodations/{accommodation_id}/images/reorder")
async def admin_reorder_accommodation_images(
    accommodation_id: int,
    items: list[AccommodationImageReorderItem],
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    for item in items:
        result = await db.execute(
            select(AccommodationImage)
            .where(AccommodationImage.id == item.id)
            .where(AccommodationImage.accommodationId == accommodation_id)
        )
        image = result.scalar_one_or_none()
        if image:
            image.sortOrder = item.sortOrder
    await db.commit()
    return {"ok": True}


# ── Rental Items CRUD ──────────────────────────────────────────────

@router.get("/rentalItems", response_model=list[RentalItemResponse])
async def admin_list_rental_items(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(RentalItem).order_by(asc(RentalItem.sortOrder))
    )
    return result.scalars().all()


@router.post("/rentalItems", response_model=RentalItemResponse)
async def admin_create_rental_item(
    data: RentalItemCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    item = RentalItem(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/rentalItems/{item_id}", response_model=RentalItemResponse)
async def admin_update_rental_item(
    item_id: int,
    data: RentalItemUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(RentalItem).where(RentalItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Не найдено")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/rentalItems/{item_id}", status_code=204)
async def admin_delete_rental_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(RentalItem).where(RentalItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Не найдено")
    await db.delete(item)
    await db.commit()
    return None


# ── Email / SMTP ───────────────────────────────────────────────────

@router.get("/smtp-status")
async def smtp_status(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    smtp = await get_active_smtp_settings(db)
    if not smtp:
        return {"configured": False}
    return {
        "configured": True,
        "host": smtp.host,
        "port": smtp.port,
        "username": smtp.username,
        "fromEmail": smtp.fromEmail,
        "fromName": smtp.fromName,
        "useTls": smtp.useTls,
        "isActive": smtp.isActive,
    }


@router.get("/smtp-test-connection")
async def test_smtp_connection(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Test raw TCP connectivity to the SMTP server."""
    import asyncio
    smtp = await get_active_smtp_settings(db)
    if not smtp:
        raise HTTPException(status_code=400, detail="SMTP not configured or inactive")
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(smtp.host, smtp.port),
            timeout=10,
        )
        writer.close()
        await writer.wait_closed()
        return {"reachable": True, "host": smtp.host, "port": smtp.port}
    except asyncio.TimeoutError:
        return {
            "reachable": False,
            "host": smtp.host,
            "port": smtp.port,
            "error": "Connection timed out. Firewall may be blocking outgoing SMTP ports (25, 465, 587). Contact your hosting provider to unblock them.",
        }
    except Exception as exc:
        return {"reachable": False, "host": smtp.host, "port": smtp.port, "error": str(exc)}


# ── Admin Emails CRUD ──────────────────────────────────────────────

@router.get("/admin-emails", response_model=list[AdminEmailResponse])
async def list_admin_emails(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(AdminEmail).order_by(AdminEmail.createdAt))
    return result.scalars().all()


@router.post("/admin-emails", response_model=AdminEmailResponse, status_code=201)
async def create_admin_email(
    data: AdminEmailCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    item = AdminEmail(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/admin-emails/{item_id}", response_model=AdminEmailResponse)
async def update_admin_email(
    item_id: int,
    data: AdminEmailUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(AdminEmail).where(AdminEmail.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Email not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/admin-emails/{item_id}", status_code=204)
async def delete_admin_email(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    result = await db.execute(select(AdminEmail).where(AdminEmail.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Email not found")
    await db.delete(item)
    await db.commit()
    return None


import traceback as _traceback

@router.post("/test-email")
async def send_test_email(
    to: str,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Send a test email. Does not depend on the 'welcome' template existing."""
    try:
        log = await send_email(
            db,
            to_email=to,
            template_type="welcome",
            variables={"name": "Тест"},
            subject_override="Тестовое письмо — Комплекс отдыха Парк Relax",
            body_override="<h2>Тестовое письмо</h2><p>Если вы видите это сообщение, значит SMTP настроен корректно.</p><hr><p>Комплекс отдыха Парк Relax</p>",
            raise_on_error=True,
        )
        return {
            "status": log.status,
            "error": log.errorMessage,
            "traceback": None,
            "logId": log.id,
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": str(exc),
            "traceback": _traceback.format_exc(),
            "logId": None,
        }
