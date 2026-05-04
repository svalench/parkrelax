import os
from pathlib import Path
from fastapi import FastAPI, Request, Depends
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.admin import admin
from app.dependencies import get_current_admin
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
)

app = FastAPI(title="Park Relax API")

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

# ── Starlette Admin ────────────────────────────────────────────────

admin.mount_to(app)

# ── Health check ───────────────────────────────────────────────────

@app.get("/api/ping")
async def ping():
    return {"ok": True, "ts": __import__("time").time()}

# ── Static files (production) ──────────────────────────────────────

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if os.getenv("NODE_ENV") == "production" and FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return HTMLResponse("Not found", status_code=404)
