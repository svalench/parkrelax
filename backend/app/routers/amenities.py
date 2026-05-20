from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.dependencies import get_db
from app.models import AmenitySection, AmenityQuickTag, AmenityCategory, AmenityItem

router = APIRouter(prefix="/amenities", tags=["amenities"])


@router.get("")
async def get_amenities(db: AsyncSession = Depends(get_db)):
    """Return full amenities section data: section config, quick tags and categories with items."""
    # Section
    section_result = await db.execute(select(AmenitySection).order_by(AmenitySection.id))
    section = section_result.scalar_one_or_none()

    # Quick tags
    quick_tags_result = await db.execute(
        select(AmenityQuickTag)
        .where(AmenityQuickTag.isActive == True)
        .order_by(asc(AmenityQuickTag.sortOrder))
    )
    quick_tags = quick_tags_result.scalars().all()

    # Categories with items
    categories_result = await db.execute(
        select(AmenityCategory)
        .where(AmenityCategory.isActive == True)
        .order_by(asc(AmenityCategory.sortOrder))
        .options(joinedload(AmenityCategory.items))
    )
    categories = categories_result.unique().scalars().all()

    category_data = []
    for cat in categories:
        items = [
            {"id": item.id, "title": item.title, "link": item.link}
            for item in cat.items
            if item.isActive
        ]
        items.sort(key=lambda x: x["id"])  # fallback; ideally sorted by relationship order_by
        category_data.append({
            "id": cat.id,
            "iconName": cat.iconName,
            "title": cat.title,
            "items": items,
        })

    return {
        "section": {
            "id": section.id if section else None,
            "label": section.label if section else "УДОБСТВА",
            "title": section.title if section else "",
            "description": section.description if section else "",
        },
        "quickTags": [
            {"id": qt.id, "iconName": qt.iconName, "label": qt.label, "link": qt.link}
            for qt in quick_tags
        ],
        "categories": category_data,
    }
