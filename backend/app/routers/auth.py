import base64
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db, get_current_user, CookieSettings
from app.auth import (
    exchange_auth_code,
    verify_access_token,
    get_kimi_user_profile,
    sign_session_token,
    verify_session_token,
)
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=dict)
async def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "unionId": user.unionId,
        "name": user.name,
        "email": user.email,
        "avatar": user.avatar,
        "role": user.role,
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    cookie_settings = CookieSettings(request)
    opts = cookie_settings.settings
    response.set_cookie(
        "kimi_sid",
        "",
        max_age=0,
        httponly=opts["httponly"],
        path=opts["path"],
        samesite=opts["samesite"],
        secure=opts["secure"],
    )
    return {"success": True}


# ── OAuth Callback ─────────────────────────────────────────────────

@router.get("/oauth/callback")
async def oauth_callback(
    request: Request,
    response: Response,
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
    db: AsyncSession = Depends(get_db),
):
    if error:
        if error == "access_denied":
            return Response(status_code=302, headers={"location": "/"})
        raise HTTPException(status_code=400, detail=f"{error}: {error_description}")

    if not code or not state:
        raise HTTPException(status_code=400, detail="code and state are required")

    try:
        redirect_uri = base64.b64decode(state).decode("utf-8")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state")

    token_resp = await exchange_auth_code(code, redirect_uri)
    access_token = token_resp.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access_token")

    token_info = await verify_access_token(access_token)
    user_id = token_info["user_id"]

    profile = await get_kimi_user_profile(access_token)
    profile_name = profile.get("name") if profile else None
    profile_avatar = profile.get("avatar_url") if profile else None

    # Upsert user
    result = await db.execute(select(User).where(User.unionId == user_id))
    user = result.scalar_one_or_none()
    from datetime import datetime
    now = datetime.utcnow()
    if user:
        user.name = profile_name or user.name
        user.avatar = profile_avatar or user.avatar
        user.lastSignInAt = now
    else:
        role = "admin" if user_id == settings.owner_union_id else "user"
        user = User(
            unionId=user_id,
            name=profile_name,
            avatar=profile_avatar,
            role=role,
            createdAt=now,
            updatedAt=now,
            lastSignInAt=now,
        )
        db.add(user)
    await db.commit()

    # Set session cookie
    session_token = sign_session_token({"unionId": user_id, "clientId": settings.app_id})
    cookie_settings = CookieSettings(request)
    opts = cookie_settings.settings
    response.set_cookie(
        "kimi_sid",
        session_token,
        max_age=365 * 24 * 60 * 60,
        httponly=opts["httponly"],
        path=opts["path"],
        samesite=opts["samesite"],
        secure=opts["secure"],
    )
    return Response(status_code=302, headers={"location": "/"})
