from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Review
from app.schemas import ReviewResponse, ReviewUpdate
from app.services.yandex_reviews import sync_yandex_reviews

router = APIRouter(prefix="/review", tags=["review"])


@router.get("", response_model=list[ReviewResponse])
async def list_active_reviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review).where(Review.isActive == True).order_by(desc(Review.createdAt))
    )
    return result.scalars().all()


@router.post("/sync-yandex")
async def sync_reviews(
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Sync 5-star reviews from Yandex Maps (admin only)."""
    result = await sync_yandex_reviews(db)
    return result


# ── Admin endpoints ────────────────────────────────────────────────

@router.get("/admin/all", response_model=list[ReviewResponse])
async def list_all_reviews(
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).order_by(desc(Review.createdAt)))
    return result.scalars().all()


@router.patch("/admin/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    data: ReviewUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/admin/{review_id}")
async def delete_review(
    review_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    await db.delete(review)
    await db.commit()
    return {"status": True}


# ── Admin Viewset ──────────────────────────────────────────────────

admin_review_viewset = AsyncBaseViewset(
    endpoint="/admin/reviews",
    model=Review,
    response_model=ReviewResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-review"],
)
admin_review_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
