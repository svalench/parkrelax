from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_admin
from app.models import SiteSettings
from app.schemas import (
    SiteSettingsResponse,
    SiteSettingsUpdate,
    SiteSettingsBookingUpdate,
)

router = APIRouter(prefix="/site-settings", tags=["site-settings"])

BOOKING_DISABLED_DETAIL = "Онлайн-бронирование временно недоступно"


async def is_public_booking_enabled(db: AsyncSession) -> bool:
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        return False
    return bool(settings.bookingPublicEnabled)


async def require_public_booking_enabled(db: AsyncSession) -> None:
    if not await is_public_booking_enabled(db):
        raise HTTPException(status_code=403, detail=BOOKING_DISABLED_DETAIL)


def _settings_to_response(settings: SiteSettings | None) -> dict:
    if not settings:
        return {
            "id": 1,
            "heroBackgroundUrl": None,
            "bookingPublicEnabled": False,
            "updatedAt": None,
        }
    return {
        "id": settings.id,
        "heroBackgroundUrl": settings.heroBackgroundUrl,
        "bookingPublicEnabled": bool(settings.bookingPublicEnabled),
        "updatedAt": settings.updatedAt,
    }


@router.get("", response_model=SiteSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    return _settings_to_response(settings)


@router.put("/admin/hero-background", response_model=SiteSettingsResponse)
async def update_hero_background(
    data: SiteSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SiteSettings(
            id=1,
            heroBackgroundUrl=data.heroBackgroundUrl,
            bookingPublicEnabled=False,
        )
        db.add(settings)
    else:
        settings.heroBackgroundUrl = data.heroBackgroundUrl
    await db.commit()
    await db.refresh(settings)
    return settings


@router.put("/admin/booking-public", response_model=SiteSettingsResponse)
async def update_booking_public(
    data: SiteSettingsBookingUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SiteSettings(
            id=1,
            heroBackgroundUrl=None,
            bookingPublicEnabled=data.bookingPublicEnabled,
        )
        db.add(settings)
    else:
        settings.bookingPublicEnabled = data.bookingPublicEnabled
    await db.commit()
    await db.refresh(settings)
    return settings
