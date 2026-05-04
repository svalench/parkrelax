from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt

from app.dependencies import get_db, CookieSettings
from app.auth import sign_admin_token, verify_admin_token
from app.models import Admin
from app.schemas import AdminLogin

router = APIRouter(prefix="/admin-auth", tags=["admin-auth"])


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


@router.post("/login")
async def login(
    request: Request,
    response: Response,
    data: AdminLogin,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Admin).where(Admin.username == data.username))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(data.password, admin.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = sign_admin_token(admin.id)
    cookie_settings = CookieSettings(request)
    opts = cookie_settings.settings
    response.set_cookie(
        "admin_sid",
        token,
        max_age=7 * 24 * 60 * 60,
        httponly=opts["httponly"],
        path=opts["path"],
        samesite=opts["samesite"],
        secure=opts["secure"],
    )
    return {"id": admin.id, "username": admin.username, "name": admin.name}


@router.get("/me")
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get("admin_sid")
    if not token:
        return None
    payload = verify_admin_token(token)
    if not payload:
        return None
    result = await db.execute(select(Admin).where(Admin.id == payload["admin_id"]))
    admin = result.scalar_one_or_none()
    if not admin:
        return None
    return {"id": admin.id, "username": admin.username, "name": admin.name}


@router.post("/logout")
async def logout(request: Request, response: Response):
    cookie_settings = CookieSettings(request)
    opts = cookie_settings.settings
    response.set_cookie(
        "admin_sid",
        "",
        max_age=0,
        httponly=opts["httponly"],
        path=opts["path"],
        samesite=opts["samesite"],
        secure=opts["secure"],
    )
    return {"success": True}
