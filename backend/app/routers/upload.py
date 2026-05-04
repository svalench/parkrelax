import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.dependencies import get_current_admin

router = APIRouter(prefix="/admin/upload", tags=["upload"])

UPLOAD_MAX = 8 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
UPLOAD_CATEGORIES = {"hero", "gallery", "accommodation"}


def _get_public_root() -> Path:
    env = os.getenv("NODE_ENV", "development")
    if env == "production":
        return Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "dist"
    return Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "public"


async def _handle_upload(category: str, file: UploadFile, admin) -> dict:
    if not file.content_type or file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    ext = ALLOWED_IMAGE_TYPES[file.content_type]

    contents = await file.read()
    if len(contents) > UPLOAD_MAX:
        raise HTTPException(status_code=413, detail="File too large")

    public_root = _get_public_root()
    upload_dir = public_root / "uploads" / category
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / file_name
    with open(file_path, "wb") as f:
        f.write(contents)

    return {"url": f"/uploads/{category}/{file_name}"}


@router.post("-hero")
async def upload_hero(
    file: UploadFile = File(...),
    admin=Depends(get_current_admin),
):
    return await _handle_upload("hero", file, admin)


@router.post("/{category}")
async def upload_category(
    category: str,
    file: UploadFile = File(...),
    admin=Depends(get_current_admin),
):
    if category not in UPLOAD_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    return await _handle_upload(category, file, admin)
