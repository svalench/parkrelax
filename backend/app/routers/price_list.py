import json

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import PriceListData
from app.price_parser import parse_price_excel, generate_template_excel
from app.schemas import PriceListDataResponse

router = APIRouter(prefix="/price-list", tags=["price-list"])


@router.get("", response_model=PriceListDataResponse)
async def get_price_list(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PriceListData).where(PriceListData.id == 1))
    data = result.scalar_one_or_none()
    if not data:
        return {"id": 1, "data": [], "updatedAt": None}
    return {
        "id": data.id,
        "data": json.loads(data.data) if data.data else [],
        "updatedAt": data.updatedAt,
    }


@router.post("/admin/upload")
async def upload_price_list(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")

    content = await file.read()
    try:
        parsed = parse_price_excel(content)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel: {exc}")

    result = await db.execute(select(PriceListData).where(PriceListData.id == 1))
    record = result.scalar_one_or_none()
    if not record:
        record = PriceListData(id=1, data=json.dumps(parsed, ensure_ascii=False))
        db.add(record)
    else:
        record.data = json.dumps(parsed, ensure_ascii=False)

    await db.commit()
    await db.refresh(record)
    return {"ok": True, "count": len(parsed)}


@router.get("/admin/template")
async def download_template(admin=Depends(get_current_admin)):
    content = generate_template_excel()
    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="price_list_template.xlsx"'},
    )
