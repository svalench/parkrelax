import json

from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.models import BanyaPageSettings, BanyaSliderItem, BanyaSection
from app.schemas import (
    BanyaPagePublicResponse,
    BanyaPageSettingsResponse,
    BanyaSliderItemResponse,
    BanyaSectionResponse,
)

router = APIRouter(prefix="/banya", tags=["banya"])


def _parse_chips(raw: str | None) -> list[str] | None:
    if not raw:
        return None
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(x) for x in data]
    except json.JSONDecodeError:
        pass
    return None


def _section_to_response(section: BanyaSection) -> BanyaSectionResponse:
    return BanyaSectionResponse(
        id=section.id,
        eyebrow=section.eyebrow,
        title=section.title,
        description=section.description,
        imageUrl=section.imageUrl,
        chips=_parse_chips(section.chips),
        isActive=section.isActive,
        sortOrder=section.sortOrder,
        createdAt=section.createdAt,
        updatedAt=section.updatedAt,
    )


async def _get_or_create_settings(db: AsyncSession) -> BanyaPageSettings:
    result = await db.execute(select(BanyaPageSettings).where(BanyaPageSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = BanyaPageSettings(id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/page", response_model=BanyaPagePublicResponse)
async def get_banya_page(db: AsyncSession = Depends(get_db)):
    settings = await _get_or_create_settings(db)

    slider_result = await db.execute(
        select(BanyaSliderItem)
        .where(BanyaSliderItem.isActive == True)
        .order_by(asc(BanyaSliderItem.sortOrder))
    )
    slider = slider_result.scalars().all()

    sections_result = await db.execute(
        select(BanyaSection)
        .where(BanyaSection.isActive == True)
        .order_by(asc(BanyaSection.sortOrder))
    )
    sections = sections_result.scalars().all()

    return BanyaPagePublicResponse(
        settings=BanyaPageSettingsResponse.model_validate(settings),
        slider=[BanyaSliderItemResponse.model_validate(s) for s in slider],
        sections=[_section_to_response(s) for s in sections],
    )
