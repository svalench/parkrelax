from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import AccommodationType
from app.schemas import AccommodationTypeResponse

router = APIRouter(prefix="/accommodation", tags=["accommodation"])


@router.get("", response_model=list[AccommodationTypeResponse])
async def list_active(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AccommodationType)
        .where(AccommodationType.isActive == True)
        .order_by(asc(AccommodationType.sortOrder))
    )
    return result.scalars().all()


# ── Admin Viewset ──────────────────────────────────────────────────

admin_accommodation_viewset = AsyncBaseViewset(
    endpoint="/admin/accommodationTypes",
    model=AccommodationType,
    response_model=AccommodationTypeResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-accommodation"],
)
admin_accommodation_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
