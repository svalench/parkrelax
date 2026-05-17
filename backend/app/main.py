import os
from pathlib import Path
from fastapi import FastAPI, Request, Depends
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.admin import admin
from app.dependencies import get_current_admin
from app.security import (
    SecurityHeadersMiddleware,
    AuditLoggingMiddleware,
    csrf_router,
    csrf_dependency,
)
from app.routers import (
    auth,
    admin_auth,
    contact,
    review,
    gallery,
    booking,
    rule,
    translation,
    accommodation,
    site_settings,
    upload,
    legal_page,
    rental,
    user_auth,
    payment,
    profile,
    admin_dashboard,
    price_list,
    about_slider,
)

from contextlib import asynccontextmanager
from app.database import AsyncSessionLocal
from app.email_service import ensure_default_templates


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as db:
        await ensure_default_templates(db)
    yield


class ApiPrefixMiddleware:
    """Rewrite /api/* paths to /* so frontend can use /api/... in production."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["path"].startswith("/api/"):
            scope["path"] = scope["path"][4:]  # strip /api
            # Also adjust raw_path if present
            raw = scope.get("raw_path")
            if raw and raw.startswith(b"/api/"):
                scope["raw_path"] = raw[4:]
        await self.app(scope, receive, send)


app = FastAPI(title="Park Relax API", lifespan=lifespan)
app.add_middleware(ApiPrefixMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditLoggingMiddleware)

# ── CORS ───────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Public Routers ─────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(admin_auth.router)
app.include_router(contact.router)
app.include_router(review.router)
app.include_router(gallery.router)
app.include_router(booking.router)
app.include_router(rule.router)
app.include_router(translation.router)
app.include_router(accommodation.router)
app.include_router(site_settings.router)
app.include_router(upload.router)
app.include_router(legal_page.router)
app.include_router(rental.router)
app.include_router(user_auth.router)
app.include_router(payment.router, dependencies=[Depends(csrf_dependency)])
app.include_router(profile.router)
app.include_router(admin_dashboard.router)
app.include_router(price_list.router)
app.include_router(about_slider.router)
app.include_router(csrf_router)

# OAuth callback at legacy path
@app.get("/api/oauth/callback")
async def oauth_callback_legacy(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    error_description: str = None,
):
    from app.routers.auth import oauth_callback
    from fastapi import Response
    response = Response()
    result = await oauth_callback(request, response, code, state, error, error_description)
    return response

# ── Email preview (admin only) ─────────────────────────────────────

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import EmailLog

@app.get("/admin/email-preview/{log_id}", response_class=HTMLResponse)
async def email_preview(
    log_id: int,
    request: Request,
    admin=Depends(get_current_admin),
):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(EmailLog).where(EmailLog.id == log_id))
        log = result.scalar_one_or_none()
    if not log:
        return HTMLResponse("<h1>Письмо не найдено</h1>", status_code=404)
    html = log.bodyHtml or "<p>Нет содержимого</p>"
    safe_html = html.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(chr(34), '&quot;')
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Предпросмотр письма — Комплекс отдыха Парк Relax</title>
<style>
body {{ margin: 0; padding: 0; background: #eef2f5; font-family: system-ui, -apple-system, sans-serif; }}
.header {{ background: #1e6091; color: #fff; padding: 12px 20px; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }}
.header a {{ color: #caf0f8; text-decoration: none; }}
.container {{ padding: 20px; }}
iframe {{ width: 100%; height: calc(100vh - 80px); border: none; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
</style>
</head>
<body>
<div class="header">
  <span>Предпросмотр письма: <strong>{log.subject}</strong> → {log.toEmail}</span>
  <a href="/admin/email-logs/detail/{log_id}">← Назад к журналу</a>
</div>
<div class="container">
  <iframe sandbox="allow-same-origin" srcdoc="{safe_html}"></iframe>
</div>
</body>
</html>""")

# ── Email template preview (admin only) ────────────────────────────

from app.models import EmailTemplate
from app.email_service import _render_template

@app.get("/admin/email-template-preview/{template_id}", response_class=HTMLResponse)
async def email_template_preview(
    template_id: int,
    request: Request,
    admin=Depends(get_current_admin),
):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id))
        template = result.scalar_one_or_none()
    if not template:
        return HTMLResponse("<h1>Шаблон не найден</h1>", status_code=404)

    test_vars = {
        "name": "Иван Петров",
        "password": "TempPass123",
        "startDate": "2026-06-01",
        "endDate": "2026-06-05",
        "houseName": "Коттедж Лесной",
        "amount": "15000",
    }
    html = _render_template(template.bodyHtml, test_vars)
    safe_html = html.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(chr(34), '&quot;')
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Предпросмотр шаблона — Комплекс отдыха Парк Relax</title>
<style>
body {{ margin: 0; padding: 0; background: #eef2f5; font-family: system-ui, -apple-system, sans-serif; }}
.header {{ background: #1e6091; color: #fff; padding: 12px 20px; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }}
.header a {{ color: #caf0f8; text-decoration: none; }}
.container {{ padding: 20px; }}
iframe {{ width: 100%; height: calc(100vh - 80px); border: none; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
</style>
</head>
<body>
<div class="header">
  <span>Предпросмотр шаблона: <strong>{template.subject}</strong> ({template.type})</span>
  <a href="/admin/email-templates/detail/{template_id}">← Назад к шаблону</a>
</div>
<div class="container">
  <iframe sandbox="allow-same-origin" srcdoc="{safe_html}"></iframe>
</div>
</body>
</html>""")

# ── Starlette Admin ────────────────────────────────────────────────

admin.mount_to(app)

# Starlette Mount("/admin") совпадает только с /admin/... (есть {path:path}); без завершающего
# слэша /admin попадает в mount("/") со статикой и отдаёт SPA вместо админки.
@app.get("/admin", include_in_schema=False)
async def admin_root_redirect():
    return RedirectResponse(url="/admin/", status_code=307)


# ── Health check ───────────────────────────────────────────────────

@app.get("/api/ping")
@app.get("/ping")
async def ping():
    return {"ok": True, "ts": __import__("time").time()}

# ── Static files (production) ──────────────────────────────────────

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

# Serve static assets (always, so iframe at /admin-panel can load them)
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

@app.get("/admin-panel")
@app.get("/admin-panel/{path:path}")
async def admin_panel_page(request: Request):
    """Serve React admin dashboard for iframe inside starlette-admin."""
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(
            str(index_file),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    return HTMLResponse("Frontend not built. Run <code>npm run build</code>.", status_code=404)

if os.getenv("NODE_ENV") == "production" and FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return HTMLResponse("Not found", status_code=404)
