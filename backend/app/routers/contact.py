from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Contact
from app.schemas import ContactResponse

router = APIRouter(prefix="/contact", tags=["contact"])


@router.get("", response_model=list[ContactResponse])
async def list_contacts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Contact))
    return result.scalars().all()


# ── Admin Viewset ──────────────────────────────────────────────────

admin_contact_viewset = AsyncBaseViewset(
    endpoint="/admin/contacts",
    model=Contact,
    response_model=ContactResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-contact"],
)
admin_contact_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
