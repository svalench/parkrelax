from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Translation
from app.schemas import TranslationResponse

router = APIRouter(prefix="/translation", tags=["translation"])


@router.get("/{key}")
async def get_translation(key: str, lang: str = "ru", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Translation).where(Translation.key == key))
    row = result.scalar_one_or_none()
    if not row:
        return {key: None}
    return {key: getattr(row, lang, None) or row.ru}


@router.get("")
async def get_all_translations(lang: str = "ru", db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Translation).order_by(asc(Translation.key)))
    rows = result.scalars().all()
    return {row.key: getattr(row, lang, None) or row.ru for row in rows}


# ── Admin Viewset ──────────────────────────────────────────────────

admin_translation_viewset = AsyncBaseViewset(
    endpoint="/admin/translations",
    model=Translation,
    response_model=TranslationResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-translation"],
)
admin_translation_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
