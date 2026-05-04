from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.auth import verify_session_token, verify_admin_token
from app import models
from sqlalchemy import select


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> models.User:
    token = request.cookies.get("kimi_sid")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    payload = verify_session_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
    result = await db.execute(select(models.User).where(models.User.unionId == payload["unionId"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_admin(request: Request, db: AsyncSession = Depends(get_db)) -> models.Admin:
    token = request.cookies.get("admin_sid")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authentication required")
    payload = verify_admin_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
    result = await db.execute(select(models.Admin).where(models.Admin.id == payload["admin_id"]))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
    return admin


class CookieSettings:
    def __init__(self, request: Request):
        host = request.headers.get("host", "")
        self.localhost = host.startswith("localhost:") or host.startswith("127.0.0.1:")

    @property
    def settings(self):
        return {
            "httponly": True,
            "path": "/",
            "samesite": "lax" if self.localhost else "none",
            "secure": not self.localhost,
        }
