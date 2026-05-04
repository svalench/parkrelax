from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db
from app.models import LegalPage
from app.schemas import LegalPageResponse

router = APIRouter(prefix="/legal-pages", tags=["legal-pages"])


@router.get("", response_model=list[LegalPageResponse])
async def list_active_legal_pages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LegalPage).where(LegalPage.isActive == True).order_by(asc(LegalPage.id))
    )
    return result.scalars().all()


@router.get("/{slug}", response_model=LegalPageResponse)
async def get_legal_page(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LegalPage).where(LegalPage.slug == slug, LegalPage.isActive == True)
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Legal page not found")
    return page


# ── Admin Viewset ──────────────────────────────────────────────────

admin_legal_page_viewset = AsyncBaseViewset(
    endpoint="/admin/legal-pages",
    model=LegalPage,
    response_model=LegalPageResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-legal-page"],
)
admin_legal_page_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
