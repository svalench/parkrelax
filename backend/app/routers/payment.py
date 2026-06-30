import json
import logging
import secrets
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.booking_logging import booking_logger
from app.config import settings
from app.dependencies import get_db
from app.email_service import send_email
from app.models import Accommodation, AdminEmail, Booking, Payment, PaymentEvent
from app.routers.site_settings import require_public_booking_enabled
from app.schemas import (
    PaymentConfirmRequest,
    PaymentConfirmResponse,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
)
from app.services import bepaid_service
from app.services.booking_availability import calculate_booking_total
from app.services.payment_settings import (
    AUTO_PAYMENT_MODE,
    get_or_create_payment_settings,
    normalize_booking_payment_mode,
    to_bepaid_runtime_config,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment", tags=["payment"])

_PENDING_PAYMENT_STATUSES = frozenset({"created", "pending"})
_BOOKING_PAYMENT_STATUSES = frozenset({"pending"})
_AUTO_PAYMENT_BOOKING_STATUSES = frozenset({"pending", "pending_confirmation", "payment_hold"})
_DECLINED_STATUSES = frozenset({"declined", "failed", "cancelled", "canceled", "expired"})
HOLD_EXPIRED_DETAIL = "Время резервирования истекло. Оформите бронирование заново."


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


@router.get("/public-settings")
async def payment_public_settings(db: AsyncSession = Depends(get_db)):
    """Публичные настройки оплаты без ключей bePaid."""
    payment_settings = await get_or_create_payment_settings(db)
    return {
        "bookingPaymentMode": normalize_booking_payment_mode(payment_settings.bookingPaymentMode),
        "bepaidActive": bool(payment_settings.isActive and payment_settings.shopId and payment_settings.secretKey),
        "testMode": bool(payment_settings.testMode),
    }


def _payment_load_options():
    return (
        joinedload(Payment.booking).joinedload(Booking.accommodation).joinedload(Accommodation.type),
        joinedload(Payment.booking).joinedload(Booking.user),
        selectinload(Payment.events),
    )


def _json_payload(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, default=str)


def _request_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def _request_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def _can_pay_booking(status: str, booking_payment_mode: str) -> bool:
    normalized = status.strip().lower()
    if booking_payment_mode == AUTO_PAYMENT_MODE:
        return normalized in _AUTO_PAYMENT_BOOKING_STATUSES
    return normalized in _BOOKING_PAYMENT_STATUSES


def _is_hold_expired(booking: Booking) -> bool:
    if booking.status != "payment_hold":
        return False
    if booking.holdExpiresAt is None:
        return True
    return booking.holdExpiresAt <= datetime.utcnow()


async def _cancel_expired_hold(db: AsyncSession, booking: Booking) -> None:
    booking.status = "cancelled"
    booking.holdExpiresAt = None
    await db.commit()


def _parse_ids_from_tracking(tracking_id: str | None) -> tuple[int | None, int | None]:
    if not tracking_id:
        return None, None
    if tracking_id.startswith("payment_"):
        parts = tracking_id.split("_")
        if len(parts) >= 4 and parts[0] == "payment" and parts[2] == "booking":
            try:
                return int(parts[1]), int(parts[3])
            except ValueError:
                return None, None
    if tracking_id.startswith("booking_"):
        try:
            return None, int(tracking_id.removeprefix("booking_"))
        except ValueError:
            return None, None
    return None, None


def _map_provider_status(provider_status: str | None, success: bool) -> str:
    if success:
        return "successful"
    if not provider_status:
        return "unknown"
    normalized = provider_status.strip().lower()
    if normalized in _DECLINED_STATUSES:
        return "cancelled" if normalized == "canceled" else normalized
    if normalized in {"successful", "success"}:
        return "successful"
    if normalized in {"pending", "incomplete"}:
        return "pending"
    return normalized


def _add_payment_event(
    db: AsyncSession,
    payment: Payment,
    *,
    event_type: str,
    provider_status: str | None = None,
    payload: Any = None,
) -> None:
    db.add(
        PaymentEvent(
            paymentId=payment.id,
            eventType=event_type,
            providerStatus=provider_status,
            payloadJson=_json_payload(payload) if payload is not None else None,
        )
    )


async def _load_booking(db: AsyncSession, booking_id: int) -> Booking | None:
    result = await db.execute(
        select(Booking)
        .options(
            joinedload(Booking.accommodation).joinedload(Accommodation.type),
            joinedload(Booking.user),
        )
        .where(Booking.id == booking_id)
    )
    return result.unique().scalar_one_or_none()


async def _load_payment_by_id(db: AsyncSession, payment_id: int) -> Payment | None:
    result = await db.execute(
        select(Payment)
        .options(*_payment_load_options())
        .where(Payment.id == payment_id)
    )
    return result.unique().scalar_one_or_none()


async def _find_reusable_payment(
    db: AsyncSession,
    *,
    booking_id: int,
    provider: str,
) -> Payment | None:
    result = await db.execute(
        select(Payment)
        .where(
            Payment.bookingId == booking_id,
            Payment.provider == provider,
            Payment.status.in_(tuple(_PENDING_PAYMENT_STATUSES)),
        )
        .order_by(desc(Payment.createdAt), desc(Payment.id))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _find_payment_from_payload(db: AsyncSession, payload: dict[str, Any]) -> Payment | None:
    tracking_id = bepaid_service.extract_tracking_id(payload)
    checkout_token = bepaid_service.extract_checkout_token(payload)
    payment_id, _booking_id = _parse_ids_from_tracking(tracking_id)

    if payment_id is not None:
        payment = await _load_payment_by_id(db, payment_id)
        if payment:
            return payment

    if checkout_token:
        result = await db.execute(
            select(Payment)
            .options(*_payment_load_options())
            .where(Payment.checkoutToken == checkout_token)
        )
        payment = result.unique().scalar_one_or_none()
        if payment:
            return payment

    if tracking_id:
        result = await db.execute(
            select(Payment)
            .options(*_payment_load_options())
            .where(Payment.trackingId == tracking_id)
        )
        return result.unique().scalar_one_or_none()

    return None


async def _create_payment_record(
    db: AsyncSession,
    *,
    booking: Booking,
    amount_minor: int,
    provider: str,
    booking_payment_mode: str,
    request: Request | None = None,
) -> Payment:
    payment = Payment(
        bookingId=booking.id,
        userId=booking.userId,
        customerName=booking.customerName,
        customerEmail=booking.customerEmail or (booking.user.email if booking.user else None),
        customerPhone=booking.customerPhone,
        amountMinor=amount_minor,
        currency="BYN",
        provider=provider,
        status="created",
        bookingPaymentMode=booking_payment_mode,
        createdByType="user" if booking.userId else "guest",
        createdByUserId=booking.userId,
        requestIp=_request_ip(request) if request is not None else None,
        userAgent=_request_user_agent(request) if request is not None else None,
    )
    db.add(payment)
    await db.flush()
    payment.trackingId = f"payment_{payment.id}_booking_{booking.id}"
    _add_payment_event(
        db,
        payment,
        event_type="created",
        payload={
            "bookingId": booking.id,
            "provider": provider,
            "bookingPaymentMode": booking_payment_mode,
        },
    )
    return payment


async def _load_legacy_booking_payment(
    db: AsyncSession,
    *,
    payload: dict[str, Any],
    booking_payment_mode: str,
) -> Payment | None:
    """Поддержка webhook для checkout, созданных до появления таблицы payments."""
    tracking_id = bepaid_service.extract_tracking_id(payload)
    _payment_id, booking_id = _parse_ids_from_tracking(tracking_id)
    if booking_id is None:
        return None

    booking = await _load_booking(db, booking_id)
    if not booking:
        return None

    payment = await _create_payment_record(
        db,
        booking=booking,
        amount_minor=_booking_amount(booking) * 100,
        provider="bepaid",
        booking_payment_mode=booking_payment_mode,
    )
    payment.status = "pending"
    payment.responsePayload = _json_payload(payload)
    payment.providerStatus = bepaid_service.extract_payment_status(payload)
    _add_payment_event(
        db,
        payment,
        event_type="legacy_webhook_imported",
        provider_status=payment.providerStatus,
        payload=payload,
    )
    return payment


async def _send_customer_payment_email(
    db: AsyncSession,
    payment: Payment,
    booking: Booking,
) -> None:
    if payment.customerEmailSentAt is not None:
        return

    email = None
    name = booking.customerName or "Гость"
    if booking.user and booking.user.email:
        email = booking.user.email
        name = booking.user.name or name
    elif booking.customerEmail:
        email = booking.customerEmail

    if not email:
        return

    amount = _booking_amount(booking)
    log = await send_email(
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
    if log.status == "sent":
        payment.customerEmailSentAt = datetime.utcnow()
        await db.commit()


async def _send_admin_payment_email(
    db: AsyncSession,
    payment: Payment,
    booking: Booking,
) -> None:
    if payment.adminEmailSentAt is not None:
        return

    result = await db.execute(
        select(AdminEmail).where(
            AdminEmail.isActive == True,
            AdminEmail.notifyOnPayments == True,
        )
    )
    admin_emails = list(result.scalars().all())
    if not admin_emails:
        return

    amount = f"{payment.amountMinor / 100:.2f}"
    paid_at = payment.paidAt.isoformat(sep=" ", timespec="seconds") if payment.paidAt else "—"
    created_at = payment.createdAt.isoformat(sep=" ", timespec="seconds") if payment.createdAt else "—"
    admin_url = f"{settings.site_url.rstrip('/')}/admin"
    sent_any = False

    for admin_email in admin_emails:
        log = await send_email(
            db,
            to_email=admin_email.email,
            template_type="payment_success_admin",
            variables={
                "paymentId": str(payment.id),
                "bookingId": str(booking.id),
                "customerName": booking.customerName or "—",
                "customerEmail": booking.customerEmail or payment.customerEmail or "—",
                "customerPhone": booking.customerPhone or payment.customerPhone or "—",
                "startDate": booking.startDate.isoformat(),
                "endDate": booking.endDate.isoformat(),
                "houseName": booking.accommodation.name if booking.accommodation else "—",
                "amount": amount,
                "currency": payment.currency,
                "status": payment.status,
                "createdAt": created_at,
                "paidAt": paid_at,
                "transactionId": payment.transactionId or "—",
                "adminUrl": admin_url,
            },
        )
        sent_any = sent_any or log.status == "sent"

    if sent_any:
        payment.adminEmailSentAt = datetime.utcnow()
        await db.commit()


async def _send_auto_payment_booking_emails(
    db: AsyncSession,
    booking: Booking,
) -> None:
    """Письма о бронировании после успешной оплаты в режиме auto_payment."""
    if booking.accommodation is None and booking.accommodationId is not None:
        booking = await _load_booking(db, booking.id)
    if booking.accommodation is None:
        return

    nights = max(1, (booking.endDate - booking.startDate).days)
    total_price = _booking_amount(booking)
    admin_url = f"{settings.site_url.rstrip('/')}/admin"

    admin_result = await db.execute(select(AdminEmail).where(AdminEmail.isActive == True))
    for admin_email in admin_result.scalars().all():
        await send_email(
            db,
            to_email=admin_email.email,
            template_type="new_booking_admin",
            variables={
                "bookingId": str(booking.id),
                "customerName": booking.customerName or "—",
                "customerPhone": booking.customerPhone or "—",
                "customerEmail": booking.customerEmail or "—",
                "houseName": booking.accommodation.name,
                "startDate": booking.startDate.isoformat(),
                "endDate": booking.endDate.isoformat(),
                "adults": str(booking.adults or 1),
                "children": str(booking.children or 0),
                "nights": str(nights),
                "totalPrice": str(total_price),
                "adminUrl": admin_url,
            },
        )

    customer_email = booking.customerEmail
    customer_name = booking.customerName or "Гость"
    if booking.user and booking.user.email:
        customer_email = booking.user.email
        customer_name = booking.user.name or customer_name
    if customer_email:
        await send_email(
            db,
            to_email=customer_email,
            template_type="booking_confirmation",
            variables={
                "name": customer_name,
                "houseName": booking.accommodation.name,
                "startDate": booking.startDate.isoformat(),
                "endDate": booking.endDate.isoformat(),
                "adults": str(booking.adults or 1),
                "children": str(booking.children or 0),
                "nights": str(nights),
            },
        )


async def _mark_payment_successful(
    db: AsyncSession,
    *,
    payment: Payment,
    payload: dict[str, Any],
    source: str,
) -> None:
    booking = payment.booking
    if booking is None and payment.bookingId is not None:
        booking = await _load_booking(db, payment.bookingId)
    if booking is None:
        payment.status = "successful"
        payment.providerStatus = bepaid_service.extract_payment_status(payload) or "successful"
        payment.transactionId = payment.transactionId or bepaid_service.extract_transaction_id(payload)
        payment.paidAt = payment.paidAt or datetime.utcnow()
        payment.lastWebhookAt = datetime.utcnow() if source == "webhook" else payment.lastWebhookAt
        _add_payment_event(db, payment, event_type=f"{source}_paid_without_booking", payload=payload)
        await db.commit()
        return

    was_successful = payment.status == "successful"
    was_payment_hold = booking.status == "payment_hold"
    payment.status = "successful"
    payment.providerStatus = bepaid_service.extract_payment_status(payload) or "successful"
    payment.transactionId = payment.transactionId or bepaid_service.extract_transaction_id(payload)
    payment.paidAt = payment.paidAt or datetime.utcnow()
    payment.responsePayload = _json_payload(payload)
    if source == "webhook":
        payment.lastWebhookAt = datetime.utcnow()
    booking.status = "paid"
    booking.holdExpiresAt = None
    _add_payment_event(
        db,
        payment,
        event_type=f"{source}_successful",
        provider_status=payment.providerStatus,
        payload=payload,
    )
    await db.commit()
    await db.refresh(payment)
    await db.refresh(booking)

    if not was_successful or payment.customerEmailSentAt is None:
        await _send_customer_payment_email(db, payment, booking)
    if not was_successful or payment.adminEmailSentAt is None:
        await _send_admin_payment_email(db, payment, booking)
    if payment.bookingPaymentMode == AUTO_PAYMENT_MODE or was_payment_hold:
        await _send_auto_payment_booking_emails(db, booking)


@router.post("/initiate", response_model=PaymentInitiateResponse)
async def initiate_payment(
    data: PaymentInitiateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await require_public_booking_enabled(db)
    payment_settings = await get_or_create_payment_settings(db)
    booking_payment_mode = normalize_booking_payment_mode(payment_settings.bookingPaymentMode)

    booking = await _load_booking(db, data.bookingId)
    if not booking:
        booking_logger.warning("payment initiate: booking not found booking_id=%s", data.bookingId)
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    booking_id = booking.id
    hold_expires_at = booking.holdExpiresAt
    if _is_hold_expired(booking):
        await _cancel_expired_hold(db, booking)
        booking_logger.warning("payment initiate: hold expired booking_id=%s", booking_id)
        raise HTTPException(status_code=400, detail=HOLD_EXPIRED_DETAIL)
    if not _can_pay_booking(booking.status, booking_payment_mode):
        booking_logger.warning(
            "payment initiate: booking not payable booking_id=%s status=%s mode=%s",
            booking_id,
            booking.status,
            booking_payment_mode,
        )
        raise HTTPException(status_code=400, detail="Бронирование недоступно для оплаты")

    amount = _booking_amount(booking)
    if amount <= 0:
        booking_logger.warning(
            "payment initiate: empty amount booking_id=%s accommodation_id=%s",
            booking_id,
            booking.accommodationId,
        )
        raise HTTPException(status_code=400, detail="Сумма бронирования пуста")
    amount_minor = amount * 100
    bepaid_config = to_bepaid_runtime_config(payment_settings)
    booking_logger.info(
        "payment initiate: booking_id=%s amount=%s provider=%s mode=%s",
        booking_id,
        amount,
        "bepaid" if bepaid_config is not None else "mock",
        booking_payment_mode,
    )

    if bepaid_config is not None:
        existing = await _find_reusable_payment(db, booking_id=booking_id, provider="bepaid")
        if existing and existing.checkoutToken and existing.redirectUrl:
            return PaymentInitiateResponse(
                paymentId=existing.id,
                bookingId=booking_id,
                amount=amount,
                currency=existing.currency,
                paymentMode="bepaid",
                status=existing.status,
                redirectUrl=existing.redirectUrl,
                paymentToken=existing.checkoutToken,
                holdExpiresAt=hold_expires_at,
            )

        payment = await _create_payment_record(
            db,
            booking=booking,
            amount_minor=amount_minor,
            provider="bepaid",
            booking_payment_mode=booking_payment_mode,
            request=request,
        )
        try:
            checkout = await bepaid_service.create_checkout(
                amount_minor=amount_minor,
                currency="BYN",
                description=f"Бронирование #{booking_id} — {booking.accommodation.name if booking.accommodation else 'Парк Relax'}",
                tracking_id=payment.trackingId,
                customer_email=booking.customerEmail or (booking.user.email if booking.user else None),
                customer_name=booking.customerName,
                booking_id=booking_id,
                payment_id=payment.id,
                config=bepaid_config,
            )
        except ValueError as exc:
            booking_logger.error(
                "payment initiate bePaid failed: booking_id=%s payment_id=%s error=%s",
                booking_id,
                payment.id,
                exc,
            )
            logger.exception("bePaid initiate failed for booking %s", booking_id)
            payment.status = "init_failed"
            payment.errorMessage = str(exc)
            _add_payment_event(db, payment, event_type="checkout_failed", payload={"error": str(exc)})
            await db.commit()
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        payment.checkoutToken = checkout["token"]
        payment.redirectUrl = checkout["redirect_url"]
        payment.status = "pending"
        payment.responsePayload = _json_payload(checkout)
        _add_payment_event(db, payment, event_type="checkout_created", provider_status="pending", payload=checkout)
        await db.commit()
        await db.refresh(payment)

        return PaymentInitiateResponse(
            paymentId=payment.id,
            bookingId=booking_id,
            amount=amount,
            currency="BYN",
            paymentMode="bepaid",
            status=payment.status,
            redirectUrl=checkout["redirect_url"],
            paymentToken=checkout["token"],
            holdExpiresAt=hold_expires_at,
        )

    existing = await _find_reusable_payment(db, booking_id=booking_id, provider="mock")
    if existing and existing.checkoutToken:
        return PaymentInitiateResponse(
            paymentId=existing.id,
            bookingId=booking_id,
            clientSecret=existing.checkoutToken,
            amount=amount,
            currency=existing.currency,
            paymentMode="mock",
            status=existing.status,
            holdExpiresAt=hold_expires_at,
        )

    client_secret = f"secret_{booking_id}_{secrets.token_urlsafe(16)}"
    payment = await _create_payment_record(
        db,
        booking=booking,
        amount_minor=amount_minor,
        provider="mock",
        booking_payment_mode=booking_payment_mode,
        request=request,
    )
    payment.status = "pending"
    payment.checkoutToken = client_secret
    _add_payment_event(
        db,
        payment,
        event_type="mock_checkout_created",
        provider_status="pending",
        payload={"clientSecret": client_secret},
    )
    await db.commit()
    await db.refresh(payment)

    return PaymentInitiateResponse(
        paymentId=payment.id,
        bookingId=booking_id,
        clientSecret=client_secret,
        amount=amount,
        currency="BYN",
        paymentMode="mock",
        status=payment.status,
        holdExpiresAt=hold_expires_at,
    )


@router.post("/confirm", response_model=PaymentConfirmResponse)
async def confirm_payment(
    data: PaymentConfirmRequest,
    db: AsyncSession = Depends(get_db),
):
    await require_public_booking_enabled(db)
    payment_settings = await get_or_create_payment_settings(db)
    bepaid_config = to_bepaid_runtime_config(payment_settings)

    booking = await _load_booking(db, data.bookingId)
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")

    payment = await _load_payment_by_id(db, data.paymentId) if data.paymentId else None
    if payment and payment.bookingId != booking.id:
        raise HTTPException(status_code=400, detail="Платёж не соответствует бронированию")

    if booking.status == "paid":
        return PaymentConfirmResponse(
            success=True,
            bookingId=booking.id,
            status=booking.status,
            paymentId=payment.id if payment else None,
        )

    if data.paymentToken and bepaid_config is not None:
        try:
            status_data = await bepaid_service.get_checkout_status(data.paymentToken, bepaid_config)
        except ValueError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        if payment is None:
            result = await db.execute(
                select(Payment)
                .options(*_payment_load_options())
                .where(Payment.checkoutToken == data.paymentToken)
            )
            payment = result.unique().scalar_one_or_none()
        if payment is None:
            payment = await _find_payment_from_payload(db, status_data)
        if payment is None or payment.bookingId != booking.id:
            raise HTTPException(status_code=400, detail="Платёжный токен не соответствует бронированию")

        provider_status = bepaid_service.extract_payment_status(status_data)
        _add_payment_event(db, payment, event_type="confirm_status", provider_status=provider_status, payload=status_data)
        if not bepaid_service.is_successful_payment(status_data):
            payment.providerStatus = provider_status
            payment.status = _map_provider_status(provider_status, False)
            payment.responsePayload = _json_payload(status_data)
            await db.commit()
            raise HTTPException(status_code=400, detail="Оплата не завершена")

        await _mark_payment_successful(db, payment=payment, payload=status_data, source="confirm")
        return PaymentConfirmResponse(success=True, bookingId=booking.id, status="paid", paymentId=payment.id)

    if payment and payment.provider == "bepaid":
        if payment.status == "successful":
            return PaymentConfirmResponse(
                success=True,
                bookingId=booking.id,
                status="paid" if booking.status == "paid" else booking.status,
                paymentId=payment.id,
            )
        if payment.checkoutToken and bepaid_config is not None:
            status_data = await bepaid_service.get_checkout_status(payment.checkoutToken, bepaid_config)
            if not bepaid_service.is_successful_payment(status_data):
                raise HTTPException(status_code=400, detail="Оплата не завершена")
            await _mark_payment_successful(db, payment=payment, payload=status_data, source="confirm")
            return PaymentConfirmResponse(success=True, bookingId=booking.id, status="paid", paymentId=payment.id)

    if not data.clientSecret or not data.clientSecret.startswith(f"secret_{booking.id}_"):
        raise HTTPException(status_code=400, detail="Неверные данные для подтверждения оплаты")

    if payment is None:
        result = await db.execute(
            select(Payment)
            .options(*_payment_load_options())
            .where(Payment.checkoutToken == data.clientSecret, Payment.bookingId == booking.id)
        )
        payment = result.unique().scalar_one_or_none()
    if payment is None:
        raise HTTPException(status_code=400, detail="Платёж не найден")

    await _mark_payment_successful(
        db,
        payment=payment,
        payload={"clientSecret": data.clientSecret, "status": "successful"},
        source="mock_confirm",
    )
    return PaymentConfirmResponse(success=True, bookingId=booking.id, status="paid", paymentId=payment.id)


@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook-уведомление bePaid (без CSRF)."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Некорректный JSON")

    payment_settings = await get_or_create_payment_settings(db)
    booking_payment_mode = normalize_booking_payment_mode(payment_settings.bookingPaymentMode)
    bepaid_config = to_bepaid_runtime_config(payment_settings)

    payment = await _find_payment_from_payload(db, payload)
    if payment is None:
        payment = await _load_legacy_booking_payment(db, payload=payload, booking_payment_mode=booking_payment_mode)
    if payment is None:
        logger.warning("bePaid webhook without known payment: %s", payload)
        return {"ok": True, "ignored": True}

    provider_status = bepaid_service.extract_payment_status(payload)
    payment.providerStatus = provider_status
    payment.transactionId = payment.transactionId or bepaid_service.extract_transaction_id(payload)
    payment.lastWebhookAt = datetime.utcnow()
    payment.responsePayload = _json_payload(payload)
    _add_payment_event(db, payment, event_type="webhook_received", provider_status=provider_status, payload=payload)

    if not bepaid_service.is_successful_payment(payload):
        payment.status = _map_provider_status(provider_status, False)
        await db.commit()
        return {"ok": True, "ignored": True}

    if bepaid_config is not None and payment.checkoutToken:
        try:
            status_data = await bepaid_service.get_checkout_status(payment.checkoutToken, bepaid_config)
        except ValueError as exc:
            payment.errorMessage = str(exc)
            _add_payment_event(
                db,
                payment,
                event_type="webhook_verify_failed",
                provider_status=provider_status,
                payload={"error": str(exc)},
            )
            await db.commit()
            raise HTTPException(status_code=502, detail="Не удалось проверить оплату") from exc
        if not bepaid_service.is_successful_payment(status_data):
            payment.status = _map_provider_status(bepaid_service.extract_payment_status(status_data), False)
            _add_payment_event(
                db,
                payment,
                event_type="webhook_verify_not_successful",
                provider_status=payment.status,
                payload=status_data,
            )
            await db.commit()
            return {"ok": True, "ignored": True}
        payload = status_data

    await _mark_payment_successful(db, payment=payment, payload=payload, source="webhook")
    return {"ok": True}
