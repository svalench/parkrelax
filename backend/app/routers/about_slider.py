from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import AboutSliderItem
from app.schemas import AboutSliderItemResponse

router = APIRouter(prefix="/about-slider", tags=["about-slider"])


@router.get("", response_model=list[AboutSliderItemResponse])
async def list_active_about_slider(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AboutSliderItem)
        .where(AboutSliderItem.isActive == True)
        .order_by(asc(AboutSliderItem.sortOrder))
    )
    return result.scalars().all()


# ── Admin Viewset ──────────────────────────────────────────────────

admin_about_slider_viewset = AsyncBaseViewset(
    endpoint="/admin/about-slider",
    model=AboutSliderItem,
    response_model=AboutSliderItemResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-about-slider"],
)
admin_about_slider_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
