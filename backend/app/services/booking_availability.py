"""Проверка занятости размещения по датам (единая логика для API и админки)."""

from datetime import date, timedelta

from sqlalchemy import and_, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Accommodation, AccommodationType, Booking

# Свободно только если нет брони или бронь отменена
_CANCELLED_STATUSES = frozenset({"cancelled", "canceled"})


def booking_occupies_dates_filter():
    """Условие: бронь занимает даты (все статусы, кроме отменённых)."""
    return func.lower(Booking.status).notin_(tuple(_CANCELLED_STATUSES))


def is_per_person_type(acc_type: AccommodationType | None) -> bool:
    return acc_type is not None and acc_type.pricingModel == "per_person"


def _effective_max_capacity(accommodation: Accommodation) -> int:
    if accommodation.capacity > 0:
        return accommodation.capacity
    if accommodation.type and accommodation.type.capacity > 0:
        return accommodation.type.capacity
    return 0


async def _get_guests_on_date(
    db: AsyncSession,
    accommodation_id: int,
    day: date,
    *,
    exclude_booking_id: int | None = None,
) -> int:
    """Сумма гостей (взрослые+дети) по активным броням на конкретный день."""
    conditions = [
        Booking.accommodationId == accommodation_id,
        booking_occupies_dates_filter(),
        Booking.startDate <= day,
        Booking.endDate > day,
    ]
    if exclude_booking_id is not None:
        conditions.append(Booking.id != exclude_booking_id)

    stmt = select(Booking.adults, Booking.children).where(and_(*conditions))
    result = await db.execute(stmt)
    total = 0
    for adults, children in result.all():
        total += (adults or 0) + (children or 0)
    return total


async def _is_per_person_available(
    db: AsyncSession,
    accommodation: Accommodation,
    start_date: date,
    end_date: date,
    adults: int,
    children: int,
    *,
    exclude_booking_id: int | None = None,
) -> bool:
    """Кемпинг: проверка суточного лимита гостей на каждый день периода."""
    if end_date <= start_date:
        return False

    new_guests = max(0, adults) + max(0, children)
    if new_guests <= 0:
        return False

    max_capacity = _effective_max_capacity(accommodation)
    if max_capacity <= 0:
        return False

    day = start_date
    while day < end_date:
        occupied = await _get_guests_on_date(
            db,
            accommodation.id,
            day,
            exclude_booking_id=exclude_booking_id,
        )
        if occupied + new_guests > max_capacity:
            return False
        day += timedelta(days=1)
    return True


async def has_booking_date_conflict(
    db: AsyncSession,
    accommodation_id: int,
    start_date: date,
    end_date: date,
    *,
    exclude_booking_id: int | None = None,
) -> bool:
    """True, если на период уже есть неотменённая бронь (только per_night)."""
    conditions = [
        Booking.accommodationId == accommodation_id,
        booking_occupies_dates_filter(),
        Booking.startDate < end_date,
        Booking.endDate > start_date,
    ]
    if exclude_booking_id is not None:
        conditions.append(Booking.id != exclude_booking_id)

    stmt = select(exists().where(and_(*conditions)))
    result = await db.execute(stmt)
    return bool(result.scalar())


async def is_accommodation_available(
    db: AsyncSession,
    accommodation_id: int,
    start_date: date,
    end_date: date,
    *,
    adults: int = 1,
    children: int = 0,
    exclude_booking_id: int | None = None,
) -> bool:
    """Размещение свободно на период [start_date, end_date) для заезда/выезда."""
    if end_date <= start_date:
        return False

    acc_result = await db.execute(
        select(Accommodation)
        .options(joinedload(Accommodation.type))
        .where(Accommodation.id == accommodation_id)
    )
    accommodation = acc_result.unique().scalar_one_or_none()
    if not accommodation or not accommodation.isActive:
        return False

    if is_per_person_type(accommodation.type):
        return await _is_per_person_available(
            db,
            accommodation,
            start_date,
            end_date,
            adults,
            children,
            exclude_booking_id=exclude_booking_id,
        )

    conflict = await has_booking_date_conflict(
        db,
        accommodation_id,
        start_date,
        end_date,
        exclude_booking_id=exclude_booking_id,
    )
    return not conflict


async def get_per_person_accommodation_ids(db: AsyncSession) -> set[int]:
    stmt = (
        select(Accommodation.id)
        .join(AccommodationType)
        .where(AccommodationType.pricingModel == "per_person")
    )
    result = await db.execute(stmt)
    return {row for row in result.scalars().all()}


async def get_booked_accommodation_ids(
    db: AsyncSession,
    check_in: date,
    check_out: date,
) -> set[int]:
    """ID размещений с неотменённой бронью, пересекающейся с периодом."""
    if check_out <= check_in:
        return set()

    stmt = select(Booking.accommodationId).where(
        and_(
            Booking.accommodationId.isnot(None),
            booking_occupies_dates_filter(),
            Booking.startDate < check_out,
            Booking.endDate > check_in,
        )
    )
    result = await db.execute(stmt)
    booked = {row for row in result.scalars().all() if row is not None}
    per_person_ids = await get_per_person_accommodation_ids(db)
    return booked - per_person_ids


def calculate_booking_total(
    accommodation: Accommodation,
    *,
    adults: int,
    children: int,
    nights: int,
) -> int:
    """Расчёт стоимости бронирования с учётом модели ценообразования."""
    acc_type = accommodation.type
    if acc_type and is_per_person_type(acc_type):
        adult_price = accommodation.pricePerNight or acc_type.pricePerNight
        child_price = acc_type.childPricePerNight if acc_type.childPricePerNight is not None else adult_price
        return nights * (max(0, adults) * adult_price + max(0, children) * child_price)

    price = accommodation.pricePerNight or (acc_type.pricePerNight if acc_type else 0)
    return nights * price
