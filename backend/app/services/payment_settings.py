"""Единая точка чтения настроек bePaid из БД."""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import PaymentSettings


MANUAL_CONFIRMATION_MODE = "manual_confirmation"
AUTO_PAYMENT_MODE = "auto_payment"
BOOKING_PAYMENT_MODES = {MANUAL_CONFIRMATION_MODE, AUTO_PAYMENT_MODE}


@dataclass(frozen=True)
class BepaidRuntimeConfig:
    shop_id: str
    secret_key: str
    test_mode: bool
    site_url: str
    notification_url: str | None = None


def normalize_notification_url(url: str | None, site_url: str) -> str:
    """Привести webhook URL к абсолютному виду — bePaid не принимает относительные пути."""
    base = site_url.rstrip("/")
    default = f"{base}/api/payment/webhook"
    if not url or not url.strip():
        return default
    cleaned = url.strip()
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        return cleaned
    if cleaned.startswith("/"):
        return f"{base}{cleaned}"
    return f"{base}/{cleaned}"


async def get_or_create_payment_settings(db: AsyncSession) -> PaymentSettings:
    result = await db.execute(select(PaymentSettings).where(PaymentSettings.id == 1))
    row = result.scalar_one_or_none()
    if row:
        if not row.shopId and not row.secretKey and settings.bepaid_shop_id and settings.bepaid_secret_key:
            row.shopId = settings.bepaid_shop_id
            row.secretKey = settings.bepaid_secret_key
            row.testMode = settings.bepaid_test_mode
            row.isActive = True
            row.notificationUrl = normalize_notification_url(row.notificationUrl, settings.site_url)
            await db.commit()
            await db.refresh(row)
        else:
            normalized_url = normalize_notification_url(row.notificationUrl, settings.site_url)
            if row.notificationUrl != normalized_url:
                row.notificationUrl = normalized_url
                await db.commit()
                await db.refresh(row)
        return row

    row = PaymentSettings(
        id=1,
        shopId=settings.bepaid_shop_id or None,
        secretKey=settings.bepaid_secret_key or None,
        testMode=settings.bepaid_test_mode,
        isActive=bool(settings.bepaid_shop_id and settings.bepaid_secret_key),
        notificationUrl=normalize_notification_url(None, settings.site_url),
        bookingPaymentMode=MANUAL_CONFIRMATION_MODE,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


def normalize_booking_payment_mode(value: str | None) -> str:
    if value in BOOKING_PAYMENT_MODES:
        return value
    return MANUAL_CONFIRMATION_MODE


def is_bepaid_enabled(row: PaymentSettings) -> bool:
    return bool(row.isActive and row.shopId and row.secretKey)


def to_bepaid_runtime_config(row: PaymentSettings) -> BepaidRuntimeConfig | None:
    if not is_bepaid_enabled(row):
        return None
    return BepaidRuntimeConfig(
        shop_id=row.shopId or "",
        secret_key=row.secretKey or "",
        test_mode=bool(row.testMode),
        site_url=settings.site_url,
        notification_url=normalize_notification_url(row.notificationUrl, settings.site_url),
    )
