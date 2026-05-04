from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import GalleryItem
from app.schemas import GalleryItemResponse

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("", response_model=list[GalleryItemResponse])
async def list_active_gallery(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GalleryItem)
        .where(GalleryItem.isActive == True)
        .order_by(asc(GalleryItem.sortOrder))
    )
    return result.scalars().all()


@router.get("/category/{category}", response_model=list[GalleryItemResponse])
async def list_by_category(category: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GalleryItem)
        .where(GalleryItem.category == category)
        .order_by(asc(GalleryItem.sortOrder))
    )
    return result.scalars().all()


# ── Admin Viewset ──────────────────────────────────────────────────

admin_gallery_viewset = AsyncBaseViewset(
    endpoint="/admin/gallery",
    model=GalleryItem,
    response_model=GalleryItemResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-gallery"],
)
admin_gallery_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
