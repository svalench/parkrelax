from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Review
from app.schemas import ReviewResponse

router = APIRouter(prefix="/review", tags=["review"])


@router.get("", response_model=list[ReviewResponse])
async def list_active_reviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(Review.isActive == True).order_by(desc(Review.createdAt))
    )
    return result.scalars().all()


# ── Admin Viewset ──────────────────────────────────────────────────

admin_review_viewset = AsyncBaseViewset(
    endpoint="/admin/reviews",
    model=Review,
    response_model=ReviewResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-review"],
)
admin_review_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
