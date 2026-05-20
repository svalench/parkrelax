"""Проверка занятости размещения по датам (единая логика для API и админки)."""

from datetime import date

from sqlalchemy import and_, exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Booking

# Свободно только если нет брони или бронь отменена
_CANCELLED_STATUSES = frozenset({"cancelled", "canceled"})


def booking_occupies_dates_filter():
    """Условие: бронь занимает даты (все статусы, кроме отменённых)."""
    return func.lower(Booking.status).notin_(tuple(_CANCELLED_STATUSES))


async def has_booking_date_conflict(
    db: AsyncSession,
    accommodation_id: int,
    start_date: date,
    end_date: date,
    *,
    exclude_booking_id: int | None = None,
) -> bool:
    """True, если на период уже есть неотменённая бронь."""
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
    exclude_booking_id: int | None = None,
) -> bool:
    """Размещение свободно на период [start_date, end_date) для заезда/выезда."""
    if end_date <= start_date:
        return False
    conflict = await has_booking_date_conflict(
        db,
        accommodation_id,
        start_date,
        end_date,
        exclude_booking_id=exclude_booking_id,
    )
    return not conflict


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
    return {row for row in result.scalars().all() if row is not None}
