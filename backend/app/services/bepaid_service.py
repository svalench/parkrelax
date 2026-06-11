"""Интеграция с bePaid Checkout API."""
from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

BEPAID_CHECKOUT_API = "https://checkout.bepaid.by/ctp/api/checkouts"
BEPAID_STATUS_API = "https://checkout.bepaid.by/ctp/api/checkouts"


def bepaid_configured() -> bool:
    """Проверка наличия учётных данных bePaid."""
    return bool(settings.bepaid_shop_id and settings.bepaid_secret_key)


def _auth_header() -> str:
    credentials = f"{settings.bepaid_shop_id}:{settings.bepaid_secret_key}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


def _site_base_url() -> str:
    return settings.site_url.rstrip("/")


async def create_checkout(
    *,
    amount_minor: int,
    currency: str,
    description: str,
    tracking_id: str,
    customer_email: str | None,
    customer_name: str | None,
    booking_id: int,
) -> dict[str, Any]:
    """Создать платёжный токен bePaid и получить redirect_url."""
    base = _site_base_url()
    payload = {
        "checkout": {
            "test": settings.bepaid_test_mode,
            "transaction_type": "payment",
            "attempts": 3,
            "settings": {
                "success_url": f"{base}/payment?bookingId={booking_id}&status=successful",
                "decline_url": f"{base}/payment?bookingId={booking_id}&status=declined",
                "fail_url": f"{base}/payment?bookingId={booking_id}&status=failed",
                "cancel_url": f"{base}/payment?bookingId={booking_id}&status=cancelled",
                "notification_url": f"{base}/api/payment/webhook",
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
        "Authorization": _auth_header(),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(BEPAID_CHECKOUT_API, json=payload, headers=headers)
        data = response.json()

    if response.status_code >= 400:
        logger.error("bePaid checkout error: %s %s", response.status_code, data)
        message = data.get("message") if isinstance(data, dict) else str(data)
        raise ValueError(message or "bePaid checkout failed")

    checkout = data.get("checkout", {})
    token = checkout.get("token")
    redirect_url = checkout.get("redirect_url")
    if not token or not redirect_url:
        raise ValueError("bePaid response missing token or redirect_url")

    return {"token": token, "redirect_url": redirect_url}


async def get_checkout_status(token: str) -> dict[str, Any]:
    """Запросить статус платежа по токену."""
    headers = {
        "Accept": "application/json",
        "X-API-Version": "2",
        "Authorization": _auth_header(),
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

    status = str(payload.get("status", "")).lower()
    if status == "successful":
        return True

    if payload.get("finished") and not payload.get("expired"):
        return status in {"successful", "success"}

    return False


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
