from fastapi import APIRouter, Request, Depends, HTTPException, status, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, CookieSettings, get_current_user
from app.auth import sign_session_token, SESSION_COOKIE_NAME, SESSION_MAX_AGE
from app.models import User
from app.schemas import UserResponse, EmailLoginRequest, RequestPasswordRequest
from app.user_password_service import reset_user_password_and_email, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, request: Request, payload: dict) -> None:
    token = sign_session_token(payload)
    cookie_settings = CookieSettings(request)
    opts = cookie_settings.settings
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=SESSION_MAX_AGE,
        httponly=opts["httponly"],
        path=opts["path"],
        samesite=opts["samesite"],
        secure=opts["secure"],
    )


@router.post("/email/login")
async def email_login(
    request: Request,
    response: Response,
    data: EmailLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email.strip().lower()))
    user = result.scalar_one_or_none()
    if not user or not user.passwordHash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
    if not verify_password(data.password, user.passwordHash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
    user.lastSignInAt = __import__("datetime").datetime.utcnow()
    await db.commit()
    _set_session_cookie(response, request, {"user_id": user.id})
    return {"success": True}


@router.post("/email/request-password")
async def request_password(
    request: Request,
    response: Response,
    data: RequestPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email.strip().lower()))
    user = result.scalar_one_or_none()
    if not user:
        # Don't reveal whether email exists
        return {"success": True, "message": "Если указанный email зарегистрирован, пароль будет отправлен"}
    await reset_user_password_and_email(db, user, raise_on_email_error=False)
    return {"success": True, "message": "Если указанный email зарегистрирован, пароль будет отправлен"}


@router.get("/me", response_model=UserResponse)
async def auth_me(user: User = Depends(get_current_user)):
    return user
