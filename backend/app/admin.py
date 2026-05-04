from fastapi import Request
from starlette.responses import Response
from starlette_admin.auth import AuthProvider
from starlette_admin.contrib.sqla import Admin, ModelView
from starlette_admin.exceptions import LoginFailed
from starlette_admin.fields import (
    IntegerField,
    StringField,
    TextAreaField,
    BooleanField,
    HasOne,
)

from app.auth import verify_admin_token, sign_admin_token
from app.database import async_engine, AsyncSessionLocal
from app.dependencies import CookieSettings
from app.routers.admin_auth import verify_password
from app.models import (
    User,
    Contact,
    Review,
    GalleryItem,
    Booking,
    Rule,
    Translation,
    AccommodationType,
    Accommodation,
    Admin as AdminModel,
    SiteSettings,
    LegalPage,
)


class AdminAuthProvider(AuthProvider):
    async def is_authenticated(self, request: Request) -> bool:
        token = request.cookies.get("admin_sid")
        if not token or not verify_admin_token(token):
            return False
        return True

    async def login(
        self,
        username: str,
        password: str,
        remember_me: bool,
        request: Request,
        response: Response,
    ) -> Response:
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(AdminModel).where(AdminModel.username == username))
            admin = result.scalar_one_or_none()

        if not admin or not verify_password(password, admin.passwordHash):
            raise LoginFailed("Invalid username or password")

        token = sign_admin_token(admin.id)
        cookie_settings = CookieSettings(request)
        opts = cookie_settings.settings
        response.set_cookie(
            "admin_sid",
            token,
            max_age=7 * 24 * 60 * 60 if remember_me else None,
            httponly=opts["httponly"],
            path=opts["path"],
            samesite=opts["samesite"],
            secure=opts["secure"],
        )
        return response

    async def logout(self, request: Request, response: Response) -> Response:
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
        return response


# ── Admin Setup ────────────────────────────────────────────────────

admin = Admin(
    engine=async_engine,
    title="Park Relax Admin",
    base_url="/admin",
    auth_provider=AdminAuthProvider(),
)

# ── Model Views ────────────────────────────────────────────────────

admin.add_view(ModelView(User, icon="fa fa-user", label="Users", identity="users"))
admin.add_view(ModelView(Contact, icon="fa fa-address-book", label="Contacts", identity="contacts"))
admin.add_view(ModelView(Review, icon="fa fa-star", label="Reviews", identity="reviews"))
admin.add_view(ModelView(GalleryItem, icon="fa fa-images", label="Gallery", identity="gallery"))
class BookingView(ModelView):
    fields = [
        IntegerField("id"),
        StringField("customerName"),
        StringField("customerPhone"),
        StringField("customerEmail"),
        StringField("startDate"),
        StringField("endDate"),
        IntegerField("adults"),
        IntegerField("children"),
        IntegerField("accommodationId", label="Accommodation ID"),
        StringField("status"),
        TextAreaField("notes"),
    ]

admin.add_view(BookingView(Booking, icon="fa fa-calendar-check", label="Bookings", identity="booking"))
admin.add_view(ModelView(Rule, icon="fa fa-gavel", label="Rules", identity="rules"))
admin.add_view(ModelView(Translation, icon="fa fa-language", label="Translations", identity="translations"))
admin.add_view(ModelView(AccommodationType, icon="fa fa-bed", label="Accommodation Types", identity="accommodation-type"))

class AccommodationView(ModelView):
    fields = [
        IntegerField("id"),
        StringField("name"),
        TextAreaField("description"),
        HasOne("type", identity="accommodation-type", label="Type"),
        StringField("imageUrl"),
        BooleanField("isActive"),
        IntegerField("sortOrder"),
    ]

admin.add_view(AccommodationView(Accommodation, icon="fa fa-home", label="Accommodations", identity="accommodations"))
admin.add_view(ModelView(AdminModel, icon="fa fa-user-shield", label="Admins", identity="admins"))
admin.add_view(ModelView(SiteSettings, icon="fa fa-cogs", label="Site Settings", identity="settings"))
admin.add_view(ModelView(LegalPage, icon="fa fa-file-contract", label="Legal Pages", identity="legal-pages"))
