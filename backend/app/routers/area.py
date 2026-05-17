from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models import AreaItem
from app.schemas import AreaItemResponse

router = APIRouter(prefix="/area-items", tags=["Area Items"])


@router.get("", response_model=List[AreaItemResponse])
async def list_area_items():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AreaItem)
            .where(AreaItem.isActive == True)
            .order_by(AreaItem.sortOrder)
        )
        items = result.scalars().all()
        return items
