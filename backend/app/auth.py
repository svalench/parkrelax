import base64
import json
import time
from typing import Optional
import httpx
from jose import jwt, JWTError
from jose.utils import base64url_decode
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
from fastapi import HTTPException, status
from app.config import settings
from app import models

# ── Constants ──────────────────────────────────────────────────────

SESSION_COOKIE_NAME = "kimi_sid"
ADMIN_COOKIE_NAME = "admin_sid"
SESSION_MAX_AGE = 365 * 24 * 60 * 60  # 1 year
ADMIN_MAX_AGE = 7 * 24 * 60 * 60      # 7 days

JWT_ALG = "HS256"
ADMIN_JWT_ALG = "HS256"

# ── Session Tokens (Kimi OAuth) ────────────────────────────────────


def sign_session_token(payload: dict) -> str:
    return jwt.encode(
        {**payload, "iat": int(time.time()), "exp": int(time.time()) + SESSION_MAX_AGE},
        settings.app_secret or "fallback-secret",
        algorithm=JWT_ALG,
    )


def verify_session_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token,
            settings.app_secret or "fallback-secret",
            algorithms=[JWT_ALG],
            options={"require": ["exp"]},
        )
    except JWTError:
        return None


# ── Admin Tokens ───────────────────────────────────────────────────


def sign_admin_token(admin_id: int) -> str:
    return jwt.encode(
        {"admin_id": admin_id, "iat": int(time.time()), "exp": int(time.time()) + ADMIN_MAX_AGE},
        settings.app_secret or "fallback-secret",
        algorithm=ADMIN_JWT_ALG,
    )


def verify_admin_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token,
            settings.app_secret or "fallback-secret",
            algorithms=[ADMIN_JWT_ALG],
            options={"require": ["exp"]},
        )
    except JWTError:
        return None


# ── Remote JWKS Cache ──────────────────────────────────────────────

_jwks_cache: Optional[list] = None
_jwks_last_fetch: float = 0
JWKS_TTL = 3600  # 1 hour


async def _fetch_jwks() -> list:
    global _jwks_cache, _jwks_last_fetch
    now = time.time()
    if _jwks_cache and (now - _jwks_last_fetch) < JWKS_TTL:
        return _jwks_cache
    url = f"{settings.kimi_auth_url}/api/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
    _jwks_cache = data.get("keys", [])
    _jwks_last_fetch = now
    return _jwks_cache


def _rsa_key_from_jwk(jwk: dict):
    """Convert a JWK dict to a cryptography RSA public key."""
    n = int.from_bytes(base64url_decode(jwk["n"].encode()), "big")
    e = int.from_bytes(base64url_decode(jwk["e"].encode()), "big")
    numbers = RSAPublicNumbers(e, n)
    return numbers.public_key()


def _jwt_header(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    payload = base64url_decode(parts[0].encode())
    return json.loads(payload)


async def verify_access_token(access_token: str) -> dict:
    header = _jwt_header(access_token)
    kid = header.get("kid")
    if not kid:
        raise ValueError("Missing kid in access token header")

    jwks = await _fetch_jwks()
    jwk = next((k for k in jwks if k.get("kid") == kid), None)
    if not jwk:
        raise ValueError(f"JWKS key with kid={kid} not found")

    pub_key = _rsa_key_from_jwk(jwk)
    pem = pub_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    payload = jwt.decode(access_token, pem, algorithms=[header.get("alg", "RS256")])
    user_id = payload.get("user_id") or payload.get("sub")
    client_id = payload.get("client_id")
    if not user_id:
        raise ValueError("user_id missing from access token")
    return {"user_id": str(user_id), "client_id": str(client_id) if client_id else None}


# ── OAuth Exchange ─────────────────────────────────────────────────

async def exchange_auth_code(code: str, redirect_uri: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.kimi_auth_url}/api/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.app_id,
                "redirect_uri": redirect_uri,
                "client_secret": settings.app_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15.0,
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Token exchange failed: {resp.text}",
            )
        return resp.json()


# ── Kimi User Profile ──────────────────────────────────────────────

async def get_kimi_user_profile(token: str) -> Optional[dict]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.kimi_open_url}/v1/users/me/profile",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
            },
            timeout=15.0,
        )
        if resp.status_code != 200:
            return None
        return resp.json()


# ── Authenticate Requests ──────────────────────────────────────────

async def authenticate_request(cookies: dict) -> Optional[models.User]:
    """Authenticate a user from request cookies (returns User model or raises)."""
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select
    from app.database import AsyncSessionLocal

    token = cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    payload = verify_session_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(models.User).where(models.User.unionId == payload["unionId"]))
        user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def authenticate_admin_request(cookies: dict) -> Optional[models.Admin]:
    """Authenticate an admin from request cookies (returns Admin model or raises)."""
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select
    from app.database import AsyncSessionLocal

    token = cookies.get(ADMIN_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authentication required")
    payload = verify_admin_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(models.Admin).where(models.Admin.id == payload["admin_id"]))
        admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
    return admin
