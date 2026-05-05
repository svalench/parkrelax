from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db
from app.models import RentalItem
from app.schemas import RentalItemResponse

router = APIRouter(prefix="/rental", tags=["rental"])


@router.get("/items", response_model=list[RentalItemResponse])
async def list_rental_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RentalItem)
        .where(RentalItem.isActive == True)
        .order_by(asc(RentalItem.sortOrder))
    )
    return result.scalars().all()


# ── Admin Viewsets ─────────────────────────────────────────────────

admin_rental_viewset = AsyncBaseViewset(
    endpoint="/admin/rentalItems",
    model=RentalItem,
    response_model=RentalItemResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-rental"],
)
admin_rental_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
