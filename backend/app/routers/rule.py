from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Rule
from app.schemas import RuleResponse

router = APIRouter(prefix="/rule", tags=["rule"])


@router.get("", response_model=list[RuleResponse])
async def list_active_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Rule).where(Rule.isActive == True).order_by(asc(Rule.id))
    )
    return result.scalars().all()


@router.get("/{rule_id}", response_model=RuleResponse)
async def get_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rule).where(Rule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


# ── Admin Viewset ──────────────────────────────────────────────────

admin_rule_viewset = AsyncBaseViewset(
    endpoint="/admin/rules",
    model=Rule,
    response_model=RuleResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-rule"],
)
admin_rule_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
