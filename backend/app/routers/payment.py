import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.dependencies import get_db
from app.models import Booking
from app.schemas import (
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentConfirmRequest,
    PaymentConfirmResponse,
)
from app.email_service import send_email
from app.routers.site_settings import require_public_booking_enabled
from app.services.booking_availability import calculate_booking_total
from app.services import bepaid_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment", tags=["payment"])

_CANCELLABLE_FOR_PAYMENT = frozenset({"pending"})


def _booking_amount(booking: Booking) -> int:
    nights = max(1, (booking.endDate - booking.startDate).days)
    if booking.accommodation:
        return calculate_booking_total(
            booking.accommodation,
            adults=booking.adults or 1,
            children=booking.children or 0,
            nights=nights,
        )
    return 0


async def _mark_booking_paid(db: AsyncSession, booking: Booking) -> None:
    """Подтвердить оплату бронирования и отправить уведомление."""
    if booking.status == "paid":
        return

    booking.status = "paid"
    await db.commit()
    await db.refresh(booking)

    email = None
    name = booking.customerName or "Гость"
    if booking.user and booking.user.email:
        email = booking.user.email
        name = booking.user.name or name
    elif booking.customerEmail:
        email = booking.customerEmail

    if email:
        amount = _booking_amount(booking)
        await send_email(
            db,
            to_email=email,
            template_type="payment_success",
            variables={
                "name": name,
                "startDate": booking.startDate.isoformat(),
                "endDate": booking.endDate.isoformat(),
                "houseName": booking.accommodation.name if booking.accommodation else "—",
                "amount": str(amount),
            },
        )


def _parse_booking_id_from_tracking(tracking_id: str | None) -> int | None:
    if not tracking_id:
        return None
    if tracking_id.startswith("booking_"):
        try:
            return int(tracking_id.removeprefix("booking_"))
        except ValueError:
            return None
    return None


@router.post("/initiate", response_model=PaymentInitiateResponse)
async def initiate_payment(
    data: PaymentInitiateRequest,
    db: AsyncSession = Depends(get_db),
):
    await require_public_booking_enabled(db)
    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation), joinedload(Booking.user))
        .where(Booking.id == data.bookingId)
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in _CANCELLABLE_FOR_PAYMENT:
        raise HTTPException(status_code=400, detail="Booking is not available for payment")

    amount = _booking_amount(booking)

    if bepaid_service.bepaid_configured():
        try:
            checkout = await bepaid_service.create_checkout(
                amount_minor=amount * 100,
                currency="BYN",
                description=f"Бронирование #{booking.id} — {booking.accommodation.name if booking.accommodation else 'Парк Relax'}",
                tracking_id=f"booking_{booking.id}",
                customer_email=booking.customerEmail or (booking.user.email if booking.user else None),
                customer_name=booking.customerName,
                booking_id=booking.id,
            )
        except ValueError as exc:
            logger.exception("bePaid initiate failed for booking %s", booking.id)
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        return PaymentInitiateResponse(
            bookingId=booking.id,
            amount=amount,
            currency="BYN",
            paymentMode="bepaid",
            redirectUrl=checkout["redirect_url"],
            paymentToken=checkout["token"],
        )

    client_secret = f"secret_{booking.id}_{secrets.token_urlsafe(16)}"
    return PaymentInitiateResponse(
        bookingId=booking.id,
        clientSecret=client_secret,
        amount=amount,
        currency="BYN",
        paymentMode="mock",
    )


@router.post("/confirm", response_model=PaymentConfirmResponse)
async def confirm_payment(
    data: PaymentConfirmRequest,
    db: AsyncSession = Depends(get_db),
):
    await require_public_booking_enabled(db)
    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation), joinedload(Booking.user))
        .where(Booking.id == data.bookingId)
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == "paid":
        return PaymentConfirmResponse(success=True, bookingId=booking.id, status=booking.status)

    if data.paymentToken and bepaid_service.bepaid_configured():
        try:
            status_data = await bepaid_service.get_checkout_status(data.paymentToken)
        except ValueError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        if not bepaid_service.is_successful_payment(status_data):
            raise HTTPException(status_code=400, detail="Payment not completed")

        tracking_id = bepaid_service.extract_tracking_id(status_data)
        parsed_id = _parse_booking_id_from_tracking(tracking_id)
        if parsed_id is not None and parsed_id != booking.id:
            raise HTTPException(status_code=400, detail="Payment token mismatch")

        await _mark_booking_paid(db, booking)
        return PaymentConfirmResponse(success=True, bookingId=booking.id, status=booking.status)

    if not data.clientSecret or not data.clientSecret.startswith(f"secret_{booking.id}_"):
        raise HTTPException(status_code=400, detail="Invalid payment confirmation data")

    await _mark_booking_paid(db, booking)
    return PaymentConfirmResponse(success=True, bookingId=booking.id, status=booking.status)


@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook-уведомление bePaid (без CSRF)."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    if not bepaid_service.is_successful_payment(payload):
        return {"ok": True, "ignored": True}

    tracking_id = bepaid_service.extract_tracking_id(payload)
    booking_id = _parse_booking_id_from_tracking(tracking_id)
    if booking_id is None:
        logger.warning("bePaid webhook without booking tracking_id: %s", payload)
        return {"ok": True, "ignored": True}

    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation), joinedload(Booking.user))
        .where(Booking.id == booking_id)
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        return {"ok": True, "ignored": True}

    await _mark_booking_paid(db, booking)
    return {"ok": True}
