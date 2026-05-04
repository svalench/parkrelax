from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_admin
from app.models import SiteSettings
from app.schemas import SiteSettingsResponse, SiteSettingsUpdate

router = APIRouter(prefix="/site-settings", tags=["site-settings"])


@router.get("", response_model=SiteSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        # Return default
        return {"id": 1, "heroBackgroundUrl": None, "updatedAt": None}
    return settings


@router.put("/admin/hero-background", response_model=SiteSettingsResponse)
async def update_hero_background(
    data: SiteSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SiteSettings(id=1, heroBackgroundUrl=data.heroBackgroundUrl)
        db.add(settings)
    else:
        settings.heroBackgroundUrl = data.heroBackgroundUrl
    await db.commit()
    await db.refresh(settings)
    return settings
