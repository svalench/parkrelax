"""Security middleware: headers, CSRF, audit logging with sensitive-data masking."""

from __future__ import annotations

import hmac
import hashlib
import secrets
import json
import re
import logging
from typing import Optional

from fastapi import Request, Response, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

# ── Logging setup ──────────────────────────────────────────────────

logger = logging.getLogger("app.security")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# ── Constants ──────────────────────────────────────────────────────

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "x-csrf-token"
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}

# Patterns for masking sensitive data in logs / bodies
_PAN_PATTERN = re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b")
_CVV_PATTERN = re.compile(r'"(cvv|cvc|cardCvv|cardCvc|securityCode)"\s*:\s*"\d{3,4}"')
_SECRET_PATTERN = re.compile(r'"(clientSecret|password|appSecret|secret)"\s*:\s*"[^"]+"')
_SENSITIVE_KEYS = {"clientsecret", "password", "appsecret", "secret", "cvv", "cvc", "cardcvv", "cardcvc", "securitycode", "pan", "cardnumber", "token"}


# ── Helpers: masking ───────────────────────────────────────────────


def _mask_pan(text: str) -> str:
    """Mask PAN (16-digit card numbers) keeping last 4 digits."""
    def repl(m: re.Match) -> str:
        s = m.group().replace(" ", "").replace("-", "")
        if len(s) == 16:
            return f"****-****-****-{s[12:]}"
        return "****"
    return _PAN_PATTERN.sub(repl, text)


def _mask_json_fields(text: str) -> str:
    """Mask sensitive JSON string fields."""
    text = _CVV_PATTERN.sub(lambda m: m.group(0).split(":")[0] + ': "***"', text)
    text = _SECRET_PATTERN.sub(lambda m: m.group(0).split(":")[0] + ': "***"', text)
    return text


def mask_sensitive_data(text: str | None) -> str | None:
    """Mask PAN, CVV, secrets in arbitrary text."""
    if text is None:
        return None
    text = _mask_pan(text)
    text = _mask_json_fields(text)
    return text


def _redact_headers(headers: dict) -> dict:
    """Redact sensitive headers for logging."""
    redacted = {}
    for k, v in headers.items():
        kl = k.lower()
        if kl in ("cookie", "authorization", "x-csrf-token"):
            redacted[k] = "***"
        else:
            redacted[k] = mask_sensitive_data(str(v)) or ""
    return redacted


# ── Helpers: CSRF ──────────────────────────────────────────────────


def _csrf_sign(token: str) -> str:
    secret = (settings.app_secret or "fallback-csrf-secret").encode()
    return hmac.new(secret, token.encode(), hashlib.sha256).hexdigest()[:32]


def generate_csrf_token() -> str:
    token = secrets.token_urlsafe(32)
    sig = _csrf_sign(token)
    return f"{token}:{sig}"


def validate_csrf_token(token: str) -> bool:
    if ":" not in token:
        return False
    raw, sig = token.rsplit(":", 1)
    return hmac.compare_digest(sig, _csrf_sign(raw))


async def csrf_dependency(request: Request) -> None:
    """FastAPI dependency that validates CSRF token for state-changing requests."""
    if request.method in CSRF_SAFE_METHODS:
        return

    # Exempt OAuth callbacks and webhook-style endpoints if needed
    path = request.url.path
    exempt_paths = {"/oauth/callback", "/api/oauth/callback"}
    if path in exempt_paths or path.startswith("/admin/"):
        return

    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
    header_token = request.headers.get(CSRF_HEADER_NAME)

    if not cookie_token or not header_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing",
        )

    if cookie_token != header_token or not validate_csrf_token(cookie_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token invalid",
        )


# ── Middleware: Security Headers ───────────────────────────────────


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Allow iframe embedding for admin-panel (same-origin only)
        path = request.url.path
        allow_frame = path.startswith("/admin-panel")

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "SAMEORIGIN" if allow_frame else "DENY"

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS (HTTPS only in production)
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # Content Security Policy (restrictive default; adjust as needed)
        frame_ancestors = "'self'" if allow_frame else "'none'"
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self'; "
            "frame-src 'self' https:; "
            f"frame-ancestors {frame_ancestors}; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        response.headers["Content-Security-Policy"] = csp

        return response


# ── Middleware: Audit Logging ──────────────────────────────────────


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """Log requests/responses with sensitive data masked."""

    async def dispatch(self, request: Request, call_next):
        # Read body for logging (limit size)
        body_bytes = b""
        if request.method not in CSRF_SAFE_METHODS:
            try:
                body_bytes = await request.body()
            except Exception:
                pass
            # Re-build request stream so downstream can read it again
            async def receive():
                return {"type": "http.request", "body": body_bytes}
            request._receive = receive

        body_text = body_bytes.decode("utf-8", errors="replace")[:4096]
        masked_body = mask_sensitive_data(body_text) or ""

        logger.info(
            "Request %s %s from %s headers=%s body=%s",
            request.method,
            request.url.path,
            request.client.host if request.client else "-",
            _redact_headers(dict(request.headers)),
            masked_body,
        )

        response: Response = await call_next(request)

        # Log response status (do not log response body to avoid leaking data)
        logger.info(
            "Response %s %s status=%s",
            request.method,
            request.url.path,
            response.status_code,
        )

        return response


# ── CSRF token endpoint ─────────────────────────────────────────────

from fastapi import APIRouter

csrf_router = APIRouter(tags=["security"])


@csrf_router.get("/csrf-token")
async def get_csrf_token(request: Request, response: Response):
    """Return a new CSRF token and set it as a cookie."""
    token = generate_csrf_token()
    from app.dependencies import CookieSettings
    cookie = CookieSettings(request)
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,  # must be readable by JS for double-submit
        secure=cookie.settings["secure"],
        samesite=cookie.settings["samesite"],
        path="/",
        max_age=86400,
    )
    return {"csrfToken": token}
