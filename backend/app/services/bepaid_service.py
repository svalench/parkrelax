"""Интеграция с bePaid Checkout API."""
from __future__ import annotations

import base64
import json
import logging
from typing import Any

import httpx

from app.booking_logging import booking_logger
from app.config import settings
from app.services.payment_settings import BepaidRuntimeConfig

logger = logging.getLogger(__name__)

BEPAID_CHECKOUT_API = "https://checkout.bepaid.by/ctp/api/checkouts"
BEPAID_STATUS_API = "https://checkout.bepaid.by/ctp/api/checkouts"


def bepaid_configured(config: BepaidRuntimeConfig | None = None) -> bool:
    """Проверка наличия учётных данных bePaid."""
    if config is not None:
        return bool(config.shop_id and config.secret_key)
    return bool(settings.bepaid_shop_id and settings.bepaid_secret_key)


def _auth_header(config: BepaidRuntimeConfig | None = None) -> str:
    shop_id = config.shop_id if config is not None else settings.bepaid_shop_id
    secret_key = config.secret_key if config is not None else settings.bepaid_secret_key
    credentials = f"{shop_id}:{secret_key}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


def _site_base_url(config: BepaidRuntimeConfig | None = None) -> str:
    site_url = config.site_url if config is not None else settings.site_url
    return site_url.rstrip("/")


def _extract_error_message(data: Any, status_code: int) -> str:
    """Собрать текст ошибки из разных форматов ответа bePaid."""
    if not isinstance(data, dict):
        return f"bePaid checkout failed (HTTP {status_code})"

    for key in ("message", "error", "error_message"):
        value = data.get(key)
        if value:
            return str(value)

    errors = data.get("errors")
    if isinstance(errors, dict):
        parts = [f"{field}: {msg}" for field, msg in errors.items()]
        if parts:
            return "; ".join(parts)
    if isinstance(errors, list) and errors:
        return "; ".join(str(item) for item in errors)

    checkout = data.get("checkout")
    if isinstance(checkout, dict):
        checkout_message = checkout.get("message")
        if checkout_message:
            return str(checkout_message)

    return f"bePaid checkout failed (HTTP {status_code})"


async def create_checkout(
    *,
    amount_minor: int,
    currency: str,
    description: str,
    tracking_id: str,
    customer_email: str | None,
    customer_name: str | None,
    booking_id: int,
    payment_id: int | None = None,
    config: BepaidRuntimeConfig | None = None,
) -> dict[str, Any]:
    """Создать платёжный токен bePaid и получить redirect_url."""
    base = _site_base_url(config)
    payment_query = f"&paymentId={payment_id}" if payment_id is not None else ""
    notification_url = (
        config.notification_url
        if config is not None and config.notification_url
        else f"{base}/api/payment/webhook"
    )
    payload = {
        "checkout": {
            "test": config.test_mode if config is not None else settings.bepaid_test_mode,
            "transaction_type": "payment",
            "attempts": 3,
            "settings": {
                "success_url": f"{base}/payment?bookingId={booking_id}&status=successful{payment_query}",
                "decline_url": f"{base}/payment?bookingId={booking_id}&status=declined{payment_query}",
                "fail_url": f"{base}/payment?bookingId={booking_id}&status=failed{payment_query}",
                "cancel_url": f"{base}/payment?bookingId={booking_id}&status=cancelled{payment_query}",
                "notification_url": notification_url,
                "language": "ru",
                "button_next_text": "Вернуться на сайт",
            },
            "order": {
                "currency": currency,
                "amount": amount_minor,
                "description": description,
                "tracking_id": tracking_id,
            },
        }
    }

    if customer_email or customer_name:
        customer: dict[str, str] = {}
        if customer_email:
            customer["email"] = customer_email
        if customer_name:
            parts = customer_name.strip().split(maxsplit=1)
            customer["first_name"] = parts[0]
            if len(parts) > 1:
                customer["last_name"] = parts[1]
        payload["checkout"]["customer"] = customer

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Version": "2",
        "Authorization": _auth_header(config),
    }

    booking_logger.info(
        "bePaid create_checkout: booking_id=%s payment_id=%s amount_minor=%s currency=%s tracking_id=%s notification_url=%s test=%s",
        booking_id,
        payment_id,
        amount_minor,
        currency,
        tracking_id,
        notification_url,
        payload["checkout"]["test"],
    )

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(BEPAID_CHECKOUT_API, json=payload, headers=headers)
        raw_text = response.text
        try:
            data = response.json()
        except json.JSONDecodeError:
            booking_logger.error(
                "bePaid create_checkout invalid JSON: status=%s body=%s",
                response.status_code,
                raw_text[:1000],
            )
            raise ValueError(f"bePaid checkout failed (HTTP {response.status_code})") from None

    if response.status_code >= 400:
        message = _extract_error_message(data, response.status_code)
        booking_logger.error(
            "bePaid create_checkout error: status=%s message=%s response=%s",
            response.status_code,
            message,
            json.dumps(data, ensure_ascii=False)[:2000],
        )
        logger.error("bePaid checkout error: %s %s", response.status_code, data)
        raise ValueError(message)

    checkout = data.get("checkout", {})
    token = checkout.get("token")
    redirect_url = checkout.get("redirect_url")
    if not token or not redirect_url:
        booking_logger.error(
            "bePaid create_checkout missing token/redirect: response=%s",
            json.dumps(data, ensure_ascii=False)[:2000],
        )
        raise ValueError("bePaid response missing token or redirect_url")

    booking_logger.info(
        "bePaid create_checkout success: booking_id=%s payment_id=%s token=%s",
        booking_id,
        payment_id,
        token,
    )
    return {"token": token, "redirect_url": redirect_url}


async def get_checkout_status(
    token: str,
    config: BepaidRuntimeConfig | None = None,
) -> dict[str, Any]:
    """Запросить статус платежа по токену."""
    headers = {
        "Accept": "application/json",
        "X-API-Version": "2",
        "Authorization": _auth_header(config),
    }
    url = f"{BEPAID_STATUS_API}/{token}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        data = response.json()

    if response.status_code >= 400:
        logger.error("bePaid status error: %s %s", response.status_code, data)
        raise ValueError("bePaid status query failed")

    return data


def is_successful_payment(payload: dict[str, Any]) -> bool:
    """Определить успешность оплаты из webhook или status response."""
    if payload.get("transaction"):
        tx = payload["transaction"]
        return tx.get("status") == "successful" or tx.get("payment", {}).get("status") == "successful"

    checkout = payload.get("checkout") or {}
    if checkout:
        return checkout.get("status") == "successful"

    status = str(payload.get("status", "")).lower()
    if status == "successful":
        return True

    if payload.get("finished") and not payload.get("expired"):
        return status in {"successful", "success"}

    return False


def extract_payment_status(payload: dict[str, Any]) -> str | None:
    """Извлечь человекочитаемый статус из ответа bePaid."""
    tx = payload.get("transaction") or {}
    payment = tx.get("payment") or {}
    checkout = payload.get("checkout") or {}
    for value in (
        tx.get("status"),
        payment.get("status"),
        checkout.get("status"),
        payload.get("status"),
    ):
        if value:
            return str(value).lower()
    return None


def extract_tracking_id(payload: dict[str, Any]) -> str | None:
    """Извлечь tracking_id из webhook/status payload."""
    order = payload.get("order") or {}
    tracking_id = order.get("tracking_id")
    if tracking_id:
        return str(tracking_id)

    tx = payload.get("transaction") or {}
    tracking_id = tx.get("tracking_id")
    if tracking_id:
        return str(tracking_id)

    return None


def extract_checkout_token(payload: dict[str, Any]) -> str | None:
    """Извлечь checkout token из webhook/status payload, если bePaid его прислал."""
    checkout = payload.get("checkout") or {}
    token = checkout.get("token")
    if token:
        return str(token)

    tx = payload.get("transaction") or {}
    checkout = tx.get("checkout") or {}
    token = checkout.get("token")
    if token:
        return str(token)

    token = payload.get("token")
    if token:
        return str(token)
    return None


def extract_transaction_id(payload: dict[str, Any]) -> str | None:
    """Извлечь идентификатор транзакции bePaid из разных вариантов payload."""
    tx = payload.get("transaction") or {}
    for key in ("uid", "id", "transaction_id"):
        value = tx.get(key)
        if value:
            return str(value)

    for key in ("transaction_uid", "transaction_id"):
        value = payload.get(key)
        if value:
            return str(value)
    return None
