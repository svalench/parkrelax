import os
import uuid
from pathlib import Path

from fastapi import Request
from PIL import Image as PILImage
from sqlalchemy import select, asc
from sqlalchemy.orm import joinedload
from starlette.datastructures import UploadFile
from starlette.responses import RedirectResponse, Response
from starlette.templating import Jinja2Templates
from starlette_admin.auth import AuthProvider
from starlette_admin.contrib.sqla import Admin, ModelView
from starlette_admin.views import CustomView, DropDown
from starlette_admin.exceptions import LoginFailed, ActionFailed
from starlette_admin.actions import link_row_action, row_action
from dataclasses import dataclass
from starlette_admin.fields import (
    IntegerField,
    StringField,
    TextAreaField,
    TinyMCEEditorField,
    BooleanField,
    HasOne,
    HasMany,
    EnumField,
    ImageField,
    FileField,
    DateField,
    DateTimeField,
    URLField,
)


class RelativeURLField(URLField):
    """URLField that resolves relative paths against request base_url."""

    async def serialize_value(self, request, value, action):
        if value and isinstance(value, str) and value.startswith("/"):
            base = str(request.base_url).rstrip("/")
            value = base + value
        return await super().serialize_value(request, value, action)
from starlette_admin.i18n import I18nConfig

from app.auth import verify_admin_token, sign_admin_token
from app.database import async_engine, AsyncSessionLocal
from app.dependencies import CookieSettings
from app.routers.admin_auth import verify_password
from app.models import (
    User,
    Contact,
    PhoneNumber,
    EmailAddress,
    Review,
    GalleryItem,
    AboutSliderItem,
    Booking,
    AccommodationType,
    Accommodation,
    Admin as AdminModel,
    LegalPage,
    RentalItem,
    AreaItem,
    SmtpSettings,
    EmailTemplate,
    EmailLog,
    PriceListData,
    AccommodationImage,
    AccommodationFeature,
    AccommodationFeaturePreset,
    AccommodationFeaturePresetItem,
    AmenitySection,
    AmenityQuickTag,
    AmenityCategory,
    AmenityItem,
)

from app.html_sanitize import sanitize_rich_html
from app.user_password_service import reset_user_password_and_email
from app.services.accommodation_features import apply_feature_preset_to_accommodations


def _apply_sanitized_rich_text(obj: object, *attr_names: str) -> None:
    """Очищает HTML в полях rich text после отправки формы админки."""
    for key in attr_names:
        val = getattr(obj, key, None)
        if val is not None:
            setattr(obj, key, sanitize_rich_html(val))


# TinyMCE: self-hosted с CDN — нужен license_key gpl, иначе редактор пустой
RICHTEXT_TINYMCE_EXTRA = {
    "license_key": "gpl",
    "promotion": False,
    "language": "ru",
    "language_url": "https://cdn.jsdelivr.net/npm/tinymce-i18n@24.12.9/langs6/ru.js",
}


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
            raise LoginFailed("Неверное имя пользователя или пароль")

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


def _get_public_root() -> Path:
    env = os.getenv("NODE_ENV", "development")
    if env == "production":
        return Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
    return Path(__file__).resolve().parent.parent.parent / "frontend" / "public"


def _convert_to_webp(upload_file: UploadFile, upload_subdir: str) -> str:
    """Конвертирует загруженное изображение в WebP, сохраняет в public/uploads/{upload_subdir}/. Возвращает URL-путь."""
    public_root = _get_public_root()
    upload_dir = public_root / "uploads" / upload_subdir
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"{uuid.uuid4().hex}.webp"
    file_path = upload_dir / file_name

    # Перед чтением PIL указатель должен быть в начале файла
    upload_file.file.seek(0)
    pil_image = PILImage.open(upload_file.file)

    if pil_image.mode in ("P", "PA"):
        pil_image = pil_image.convert("RGBA")
    elif pil_image.mode not in ("RGB", "RGBA"):
        pil_image = pil_image.convert("RGB")

    pil_image.save(file_path, format="WEBP", quality=85, method=6)

    return f"/uploads/{upload_subdir}/{file_name}"


def _delete_image_file(image_url: str | None) -> None:
    """Удаляет файл изображения с диска, если он существует."""
    if not image_url:
        return
    try:
        public_root = _get_public_root()
        file_path = public_root / image_url.lstrip("/")
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass


# ── Варианты цвета бейджа (аренда) ──────────────────────────────────

BADGE_COLOR_CHOICES = [
    ("bg-[rgba(30,96,145,0.82)] text-[#caf0f8]", "Вода (синий)"),
    ("bg-[rgba(45,106,79,0.82)] text-[#d8f3dc]", "Рыбалка (зелёный)"),
    ("bg-[rgba(123,45,139,0.82)] text-[#f3e8ff]", "Актив (фиолетовый)"),
    ("bg-[rgba(187,62,3,0.82)] text-[#ffe8d6]", "Вечер (оранжевый)"),
    ("bg-[rgba(231,111,81,0.82)] text-[#fff1ec]", "Спорт (коралловый)"),
    ("bg-[rgba(20,20,60,0.88)] text-[#e0d9ff]", "Ночь (тёмно-синий)"),
    ("bg-[rgba(0,80,130,0.82)] text-[#bde8ff]", "Лодка (голубой)"),
]

class CustomImageField(ImageField):
    """ImageField: сериализация в формат, который ожидает JS-рендерер starlette-admin."""

    async def serialize_value(self, request, value, action):
        if value is None:
            return None
        filename = value.split("/")[-1] if isinstance(value, str) else ""
        base = str(request.base_url).rstrip("/")
        url = f"{base}{value}" if value.startswith("/") else value
        return {"url": url, "filename": filename}


@dataclass
class CroppableImageField(ImageField):
    """ImageField с inline cropper (Cropper.js) перед отправкой формы."""

    form_template: str = "forms/croppable_image.html"
    crop_ratio: float | None = None

    async def serialize_value(self, request, value, action):
        if value is None:
            return None
        filename = value.split("/")[-1] if isinstance(value, str) else ""
        base = str(request.base_url).rstrip("/")
        url = f"{base}{value}" if value.startswith("/") else value
        return {"url": url, "filename": filename}


class RentalItemView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("title", label="Название"),
        StringField("info", label="Краткая информация"),
        StringField("badge", label="Бейдж"),
        EnumField("badgeColor", label="Цвет бейджа", choices=BADGE_COLOR_CHOICES),
        StringField("eyebrow", label="Надзаголовок"),
        TinyMCEEditorField(
            "description",
            label="Описание",
            height=400,
            extra_options=RICHTEXT_TINYMCE_EXTRA,
        ),
        StringField("duration", label="Длительность"),
        StringField("capacity", label="Вместимость"),
        CustomImageField("imageUrl", label="Изображение"),
        BooleanField("isActive", label="Активно"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj: RentalItem) -> None:
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
        _apply_sanitized_rich_text(obj, "description")

    async def before_edit(self, request: Request, data: dict, obj: RentalItem) -> None:
        old_image_url = obj.imageUrl if obj else None
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
            if new_url != old_image_url:
                _delete_image_file(old_image_url)
        _apply_sanitized_rich_text(obj, "description")

    async def _process_image_upload(self, data: dict) -> str | None:
        image_value = data.get("imageUrl")

        file_value = image_value
        if isinstance(image_value, tuple) and len(image_value) == 2:
            file_value, _should_be_deleted = image_value

        if isinstance(file_value, UploadFile) and file_value.filename:
            new_url = _convert_to_webp(file_value, "rental")
            data["imageUrl"] = new_url
            return new_url
        elif isinstance(image_value, str) and image_value.startswith("/uploads/"):
            return None
        else:
            return None


# ── Представления моделей с русскими подписями полей ─────────────────

class UserAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("unionId", label="ID в системе"),
        StringField("name", label="Имя"),
        StringField("email", label="Email"),
        TextAreaField("avatar", label="Аватар (URL)"),
        StringField("role", label="Роль"),
        BooleanField("emailVerified", label="Email подтверждён"),
        DateTimeField("createdAt", label="Создан", read_only=True),
        DateTimeField("updatedAt", label="Обновлён", read_only=True),
        DateTimeField("lastSignInAt", label="Последний вход", read_only=True),
    ]

    @row_action(
        name="reset_password",
        text="Сбросить пароль",
        confirmation="Сгенерировать новый пароль и отправить его на email пользователя?",
        icon_class="fa-solid fa-key",
        submit_btn_text="Да, сбросить",
        submit_btn_class="btn-warning",
        action_btn_class="btn-warning",
    )
    async def reset_password_row_action(self, request: Request, pk: object) -> str:
        user = await self.find_by_pk(request, pk)
        if not user:
            raise ActionFailed("Пользователь не найден")
        await reset_user_password_and_email(
            request.state.session,
            user,
            raise_on_email_error=True,
        )
        return f"Новый пароль отправлен на {user.email}"


class ContactAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        TextAreaField("address", label="Адрес"),
        StringField("workHours", label="Часы работы"),
        TextAreaField("yandexMapEmbed", label="Код карты Яндекс (iframe)"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class PhoneNumberAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("number", label="Номер телефона"),
        BooleanField("isVisibleInHeader", label="Показывать в шапке сайта"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class EmailAddressAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("email", label="Email адрес"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class ReviewAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("name", label="Имя"),
        IntegerField("rating", label="Оценка"),
        TextAreaField("text", label="Текст отзыва"),
        TextAreaField("avatarUrl", label="URL аватара"),
        StringField("yandexReviewId", label="ID отзыва Яндекс"),
        BooleanField("isActive", label="Активен"),
        DateTimeField("createdAt", label="Создано", read_only=True),
    ]


class GalleryItemAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("title", label="Заголовок"),
        CroppableImageField("imageUrl", label="Изображение"),
        StringField("category", label="Категория"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активен"),
        DateTimeField("createdAt", label="Создано", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj: GalleryItem) -> None:
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url

    async def before_edit(self, request: Request, data: dict, obj: GalleryItem) -> None:
        old_image_url = obj.imageUrl if obj else None
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
            if new_url != old_image_url:
                _delete_image_file(old_image_url)

    async def _process_image_upload(self, data: dict) -> str | None:
        image_value = data.get("imageUrl")

        file_value = image_value
        if isinstance(image_value, tuple) and len(image_value) == 2:
            file_value, _should_be_deleted = image_value

        if isinstance(file_value, UploadFile) and file_value.filename:
            new_url = _convert_to_webp(file_value, "gallery")
            data["imageUrl"] = new_url
            return new_url
        if isinstance(image_value, str) and image_value.startswith("/uploads/"):
            return None
        return None


class AboutSliderItemAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("title", label="Заголовок"),
        CroppableImageField("imageUrl", label="Изображение", crop_ratio=0.62),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активен"),
        DateTimeField("createdAt", label="Создано", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj: AboutSliderItem) -> None:
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url

    async def before_edit(self, request: Request, data: dict, obj: AboutSliderItem) -> None:
        old_image_url = obj.imageUrl if obj else None
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
            if new_url != old_image_url:
                _delete_image_file(old_image_url)

    async def _process_image_upload(self, data: dict) -> str | None:
        image_value = data.get("imageUrl")

        file_value = image_value
        if isinstance(image_value, tuple) and len(image_value) == 2:
            file_value, _should_be_deleted = image_value

        if isinstance(file_value, UploadFile) and file_value.filename:
            new_url = _convert_to_webp(file_value, "about-slider")
            data["imageUrl"] = new_url
            return new_url
        if isinstance(image_value, str) and image_value.startswith("/uploads/"):
            return None
        return None


class BookingView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("customerName", label="Имя клиента"),
        StringField("customerPhone", label="Телефон"),
        StringField("customerEmail", label="Email"),
        DateField("startDate", label="Дата заезда"),
        DateField("endDate", label="Дата выезда"),
        IntegerField("adults", label="Взрослые"),
        IntegerField("children", label="Дети"),
        IntegerField("accommodationId", label="ID размещения"),
        IntegerField("userId", label="ID пользователя"),
        StringField("status", label="Статус"),
        TextAreaField("notes", label="Примечания"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class AccommodationTypeAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("name", label="Название"),
        TinyMCEEditorField(
            "description",
            label="Описание",
            height=400,
            extra_options=RICHTEXT_TINYMCE_EXTRA,
        ),
        IntegerField("capacity", label="Вместимость"),
        IntegerField("pricePerNight", label="Цена за ночь"),
        StringField("priceUnit", label="Единица цены (например: ночь, сутки, час)"),
        StringField("pricingModel", label="Модель цены (per_night / per_person)"),
        IntegerField("childPricePerNight", label="Цена за ребёнка (per_person)"),
        CustomImageField("imageUrl", label="Изображение"),
        BooleanField("isActive", label="Активно"),
        BooleanField("showInListing", label="Показывать в каталоге"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        DateTimeField("createdAt", label="Создано", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj: AccommodationType) -> None:
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
        _apply_sanitized_rich_text(obj, "description")

    async def before_edit(self, request: Request, data: dict, obj: AccommodationType) -> None:
        old_image_url = obj.imageUrl if obj else None
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
            if new_url != old_image_url:
                _delete_image_file(old_image_url)
        _apply_sanitized_rich_text(obj, "description")

    async def _process_image_upload(self, data: dict) -> str | None:
        image_value = data.get("imageUrl")

        file_value = image_value
        if isinstance(image_value, tuple) and len(image_value) == 2:
            file_value, _should_be_deleted = image_value

        if isinstance(file_value, UploadFile) and file_value.filename:
            new_url = _convert_to_webp(file_value, "accommodation-type")
            data["imageUrl"] = new_url
            return new_url
        if isinstance(image_value, str) and image_value.startswith("/uploads/"):
            return None
        return None


class AccommodationImageView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        HasOne("accommodation", identity="accommodations", label="Апартамент"),
        CustomImageField("imageUrl", label="Изображение"),
        IntegerField("sortOrder", label="Порядок сортировки"),
    ]

    async def before_create(self, request: Request, data: dict, obj: AccommodationImage) -> None:
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url

    async def before_edit(self, request: Request, data: dict, obj: AccommodationImage) -> None:
        old_image_url = obj.imageUrl if obj else None
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
            if new_url != old_image_url:
                _delete_image_file(old_image_url)

    async def _process_image_upload(self, data: dict) -> str | None:
        image_value = data.get("imageUrl")

        file_value = image_value
        if isinstance(image_value, tuple) and len(image_value) == 2:
            file_value, _should_be_deleted = image_value

        if isinstance(file_value, UploadFile) and file_value.filename:
            new_url = _convert_to_webp(file_value, "accommodation")
            data["imageUrl"] = new_url
            return new_url
        if isinstance(image_value, str) and image_value.startswith("/uploads/"):
            return None
        return None


@dataclass
class GalleryIframeField(TextAreaField):
    form_template: str = "forms/gallery_iframe.html"
    read_only: bool = True


class AccommodationView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("name", label="Название"),
        TinyMCEEditorField(
            "description",
            label="Описание",
            height=400,
            extra_options=RICHTEXT_TINYMCE_EXTRA,
        ),
        HasOne("type", identity="accommodation-type", label="Тип размещения"),
        CustomImageField("imageUrl", label="Изображение"),
        IntegerField("capacity", label="Вместимость"),
        IntegerField("pricePerNight", label="Цена за ночь"),
        BooleanField("isActive", label="Активно"),
        BooleanField("showOnMain", label="Показывать на главной"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        GalleryIframeField("galleryManager", label="Галерея (массовая загрузка + crop)"),
        DateTimeField("createdAt", label="Создано", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj: Accommodation) -> None:
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
        _apply_sanitized_rich_text(obj, "description")

    async def before_edit(self, request: Request, data: dict, obj: Accommodation) -> None:
        old_image_url = obj.imageUrl if obj else None
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
            if new_url != old_image_url:
                _delete_image_file(old_image_url)
        _apply_sanitized_rich_text(obj, "description")

    async def _process_image_upload(self, data: dict) -> str | None:
        image_value = data.get("imageUrl")

        file_value = image_value
        if isinstance(image_value, tuple) and len(image_value) == 2:
            file_value, _should_be_deleted = image_value

        if isinstance(file_value, UploadFile) and file_value.filename:
            new_url = _convert_to_webp(file_value, "accommodation")
            data["imageUrl"] = new_url
            return new_url
        if isinstance(image_value, str) and image_value.startswith("/uploads/"):
            return None
        return None


class AdminAccountView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("username", label="Логин"),
        StringField("passwordHash", label="Хэш пароля (bcrypt)"),
        StringField("name", label="Имя"),
        DateTimeField("createdAt", label="Создан", read_only=True),
        DateTimeField("updatedAt", label="Обновлён", read_only=True),
    ]


class LegalPageAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("slug", label="Слаг"),
        StringField("title", label="Заголовок"),
        TinyMCEEditorField(
            "content",
            label="Содержание",
            height=480,
            extra_options=RICHTEXT_TINYMCE_EXTRA,
        ),
        BooleanField("isActive", label="Активна"),
        DateTimeField("createdAt", label="Создана", read_only=True),
        DateTimeField("updatedAt", label="Обновлена", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj: LegalPage) -> None:
        _apply_sanitized_rich_text(obj, "content")

    async def before_edit(self, request: Request, data: dict, obj: LegalPage) -> None:
        _apply_sanitized_rich_text(obj, "content")


class SmtpSettingsView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("host", label="SMTP сервер"),
        IntegerField("port", label="Порт"),
        StringField("username", label="Логин"),
        StringField("password", label="Пароль"),
        BooleanField("useTls", label="Использовать TLS"),
        StringField("fromEmail", label="Email отправителя"),
        StringField("fromName", label="Имя отправителя"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class EmailTemplateView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("type", label="Тип шаблона"),
        StringField("subject", label="Тема письма"),
        FileField("uploadPath", label="HTML файл (импорт)"),
        TextAreaField("bodyHtml", label="HTML шаблон"),
        RelativeURLField(
            "previewUrl",
            label="Предпросмотр",
            exclude_from_edit=True,
            exclude_from_create=True,
        ),
        BooleanField("isActive", label="Активен"),
        DateTimeField("createdAt", label="Создан", read_only=True),
        DateTimeField("updatedAt", label="Обновлён", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj) -> None:
        await self._process_file_upload(data, obj)

    async def before_edit(self, request: Request, data: dict, obj) -> None:
        await self._process_file_upload(data, obj)

    async def _process_file_upload(self, data: dict, obj) -> None:
        file_value = data.get("uploadPath")
        if not file_value:
            return
        file = file_value
        if isinstance(file_value, tuple) and len(file_value) == 2:
            file, _should_be_deleted = file_value
        if isinstance(file, UploadFile) and file.filename:
            content = await file.read()
            try:
                text = content.decode("utf-8")
            except UnicodeDecodeError:
                text = content.decode("utf-8", errors="replace")
            obj.bodyHtml = text
            data["bodyHtml"] = text
            # Do not store file path; keep uploadPath empty
            obj.uploadPath = None
            data["uploadPath"] = None


class EmailLogView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("toEmail", label="Получатель"),
        StringField("subject", label="Тема"),
        RelativeURLField(
            "previewUrl",
            label="Предпросмотр",
            exclude_from_edit=True,
            exclude_from_create=True,
        ),
        TextAreaField("bodyPreview", label="Предпросмотр (обрезано)"),
        TextAreaField("bodyHtml", label="Полное HTML письма"),
        StringField("templateType", label="Тип шаблона"),
        StringField("status", label="Статус"),
        TextAreaField("errorMessage", label="Ошибка"),
        StringField("messageId", label="Message ID"),
        DateTimeField("sentAt", label="Отправлено", read_only=True),
    ]

    def can_create(self, request) -> bool:
        return False

    def can_edit(self, request) -> bool:
        return False

    def can_delete(self, request) -> bool:
        return False


class PriceListDataView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        FileField("uploadFile", label="Excel файл (загрузить новый прайс)"),
        TextAreaField("data", label="Данные (JSON)", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]

    def can_create(self, request) -> bool:
        return False

    def can_delete(self, request) -> bool:
        return False

    async def before_create(self, request: Request, data: dict, obj: PriceListData) -> None:
        await self._process_upload(data, obj)

    async def before_edit(self, request: Request, data: dict, obj: PriceListData) -> None:
        await self._process_upload(data, obj)

    async def _process_upload(self, data: dict, obj: PriceListData) -> None:
        import json
        from starlette.datastructures import UploadFile

        file_value = data.get("uploadFile")
        if not file_value:
            return

        file = file_value
        if isinstance(file_value, tuple) and len(file_value) == 2:
            file, _should_be_deleted = file_value

        if isinstance(file, UploadFile) and file.filename:
            content = await file.read()
            try:
                from app.price_parser import parse_price_excel
                parsed = parse_price_excel(content)
                obj.data = json.dumps(parsed, ensure_ascii=False)
                data["data"] = obj.data
            except Exception as exc:
                raise Exception(f"Ошибка парсинга Excel: {exc}")
            finally:
                # Clear upload field
                obj.uploadFile = None
                data["uploadFile"] = None


class AreaItemAdminView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("title", label="Название"),
        StringField("info", label="Краткая информация"),
        CroppableImageField("imageUrl", label="Изображение", crop_ratio=1.6),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]

    async def before_create(self, request: Request, data: dict, obj: AreaItem) -> None:
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url

    async def before_edit(self, request: Request, data: dict, obj: AreaItem) -> None:
        old_image_url = obj.imageUrl if obj else None
        new_url = await self._process_image_upload(data)
        if new_url is not None:
            obj.imageUrl = new_url
            if new_url != old_image_url:
                _delete_image_file(old_image_url)

    async def _process_image_upload(self, data: dict) -> str | None:
        image_value = data.get("imageUrl")

        file_value = image_value
        if isinstance(image_value, tuple) and len(image_value) == 2:
            file_value, _should_be_deleted = image_value

        if isinstance(file_value, UploadFile) and file_value.filename:
            new_url = _convert_to_webp(file_value, "area")
            data["imageUrl"] = new_url
            return new_url
        if isinstance(image_value, str) and image_value.startswith("/uploads/"):
            return None
        return None


LUCIDE_ICON_LIST = [
    "Home", "Bed", "CircleCheck", "PartyPopper", "Bike", "Flame", "Anchor",
    "Waves", "Wifi", "Umbrella", "Car", "Baby", "Fish", "Ship", "UtensilsCrossed",
    "Refrigerator", "Tv", "PawPrint", "Droplets", "Star", "Heart", "MapPin",
    "Phone", "Mail", "Globe", "Clock", "Calendar", "Search", "User", "Users",
    "Settings", "Plus", "Minus", "Check", "X", "ChevronLeft", "ChevronRight",
    "ChevronDown", "ArrowRight", "ArrowLeft", "ExternalLink", "Link", "Image",
    "Camera", "Music", "Video", "FileText", "Book", "Bookmark", "Flag", "Tag",
    "Bell", "Shield", "Lock", "Key", "Zap", "Sun", "Moon", "Cloud",
    "Thermometer", "Coffee", "Gift", "Award", "Trophy", "Target", "TrendingUp",
    "Activity", "BarChart", "PieChart", "Layout", "Grid", "List", "Monitor",
    "Smartphone", "Printer", "Lightbulb", "Pin", "Scissors", "Trash", "Edit",
    "Copy", "Save", "Download", "Upload", "Share", "Send", "MessageSquare",
    "HelpCircle", "Info", "AlertCircle", "AlertTriangle", "Volume2", "VolumeX",
    "Mic", "Headphones", "Eye", "EyeOff", "Smile", "ThumbsUp", "ThumbsDown",
    "Play", "Pause", "SkipForward", "SkipBack", "Square", "Compass", "Map",
    "Navigation", "TreePine", "Mountain", "Tent", "Binoculars", "Watch",
    "AlarmClock", "Timer", "Hourglass", "Wallet", "CreditCard", "Receipt",
    "Ticket", "Plane", "Train", "Bus", "Anchor", "Sailboat", "Anchor",
    "Toilet", "ShowerHead", "Bath", "Building", "Building2", "Layers",
    "House", "Sofa", "Trees",
]


@dataclass
class LucideIconField(StringField):
    """StringField с inline-сеткой для выбора Lucide-иконки."""

    form_template: str = "forms/lucide_icons.html"
    icon_list: list[str] = None

    def __post_init__(self):
        if self.icon_list is None:
            self.icon_list = LUCIDE_ICON_LIST
        super().__post_init__()


class AmenitySectionView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("label", label="Лейбл секции"),
        StringField("title", label="Заголовок (H2)"),
        TinyMCEEditorField(
            "description",
            label="Описание",
            height=300,
            extra_options=RICHTEXT_TINYMCE_EXTRA,
        ),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]

    def can_create(self, request) -> bool:
        return False

    def can_delete(self, request) -> bool:
        return False


class AmenityQuickTagView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        LucideIconField("iconName", label="Иконка"),
        StringField("label", label="Текст"),
        StringField("link", label="Ссылка"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class AccommodationFeatureView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        HasOne("accommodation", identity="accommodations", label="Размещение"),
        LucideIconField("iconName", label="Иконка", required=True),
        StringField("label", label="Описание", required=True),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class AccommodationFeaturePresetView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        StringField("name", label="Название шаблона"),
        TextAreaField("description", label="Описание"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]

    @link_row_action(
        name="apply_preset",
        text="Применить к размещениям",
        icon_class="fa fa-clone",
    )
    def apply_preset_row_action(self, request: Request, pk: object) -> str:
        root = request.scope.get("root_path", "/admin")
        return f"{root}/apply-accommodation-features?preset_id={pk}"


class AccommodationFeaturePresetItemView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        HasOne("preset", identity="accommodation-feature-presets", label="Шаблон"),
        LucideIconField("iconName", label="Иконка", required=True),
        StringField("label", label="Описание", required=True),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class ApplyAccommodationFeaturesView(CustomView):
    """Массовое применение шаблона особенностей к нескольким размещениям."""

    def __init__(self) -> None:
        super().__init__(
            label="Применить особенности",
            icon="fa fa-clone",
            path="/apply-accommodation-features",
            template_path="apply_accommodation_features.html",
            methods=["GET", "POST"],
            add_to_menu=True,
        )

    async def _load_context(
        self,
        *,
        selected_preset_id: int | None = None,
        selected_accommodation_ids: set[int] | None = None,
        replace_existing: bool = True,
    ) -> dict:
        selected_accommodation_ids = selected_accommodation_ids or set()
        async with AsyncSessionLocal() as db:
            presets_result = await db.execute(
                select(AccommodationFeaturePreset)
                .where(AccommodationFeaturePreset.isActive == True)
                .order_by(asc(AccommodationFeaturePreset.name))
            )
            presets = list(presets_result.scalars().all())

            preset_items: list[AccommodationFeaturePresetItem] = []
            if selected_preset_id:
                items_result = await db.execute(
                    select(AccommodationFeaturePresetItem)
                    .where(
                        AccommodationFeaturePresetItem.presetId == selected_preset_id,
                        AccommodationFeaturePresetItem.isActive == True,
                    )
                    .order_by(asc(AccommodationFeaturePresetItem.sortOrder))
                )
                preset_items = list(items_result.scalars().all())

            acc_result = await db.execute(
                select(Accommodation)
                .options(joinedload(Accommodation.type))
                .where(Accommodation.isActive == True)
                .order_by(asc(Accommodation.sortOrder))
            )
            accommodations = list(acc_result.unique().scalars().all())

        groups_map: dict[str, list] = {}
        for acc in accommodations:
            type_name = acc.type.name if acc.type else "Без типа"
            groups_map.setdefault(type_name, []).append(acc)
        accommodation_groups = [
            {"type_name": name, "accommodations": items}
            for name, items in sorted(groups_map.items(), key=lambda x: x[0])
        ]

        return {
            "presets": presets,
            "preset_items": preset_items,
            "accommodation_groups": accommodation_groups,
            "selected_preset_id": selected_preset_id,
            "selected_accommodation_ids": selected_accommodation_ids,
            "replace_existing": replace_existing,
        }

    async def render(self, request: Request, templates: Jinja2Templates) -> Response:
        if request.method == "POST":
            form = await request.form()
            preset_raw = form.get("preset_id")
            replace_existing = form.get("replace_existing") == "1"
            accommodation_ids: list[int] = []
            for raw_id in form.getlist("accommodation_ids"):
                try:
                    accommodation_ids.append(int(raw_id))
                except (TypeError, ValueError):
                    continue

            try:
                preset_id = int(preset_raw) if preset_raw else 0
            except (TypeError, ValueError):
                preset_id = 0

            if not preset_id or not accommodation_ids:
                context = await self._load_context(
                    selected_preset_id=preset_id or None,
                    selected_accommodation_ids=set(accommodation_ids),
                    replace_existing=replace_existing,
                )
                context["error"] = "Выберите шаблон и хотя бы одно размещение."
                return templates.TemplateResponse(
                    request,
                    name=self.template_path,
                    context=context,
                )

            try:
                async with AsyncSessionLocal() as db:
                    acc_count, feature_count = await apply_feature_preset_to_accommodations(
                        db,
                        preset_id,
                        accommodation_ids,
                        replace_existing=replace_existing,
                    )
            except ValueError as exc:
                context = await self._load_context(
                    selected_preset_id=preset_id,
                    selected_accommodation_ids=set(accommodation_ids),
                    replace_existing=replace_existing,
                )
                context["error"] = str(exc)
                return templates.TemplateResponse(
                    request,
                    name=self.template_path,
                    context=context,
                )

            return RedirectResponse(
                url=(
                    f"{request.scope['root_path']}{self.path}"
                    f"?ok=1&acc={acc_count}&feat={feature_count}"
                ),
                status_code=303,
            )

        selected_preset_id: int | None = None
        preset_q = request.query_params.get("preset_id")
        if preset_q:
            try:
                selected_preset_id = int(preset_q)
            except (TypeError, ValueError):
                selected_preset_id = None

        context = await self._load_context(selected_preset_id=selected_preset_id)
        if request.query_params.get("ok") == "1":
            acc_count = request.query_params.get("acc", "?")
            feat_count = request.query_params.get("feat", "?")
            context["message"] = (
                f"Готово: обновлено размещений — {acc_count}, "
                f"добавлено записей особенностей — {feat_count}."
            )
        return templates.TemplateResponse(
            request,
            name=self.template_path,
            context=context,
        )


class AmenityCategoryView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        LucideIconField("iconName", label="Иконка"),
        StringField("title", label="Название категории"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


class AmenityItemView(ModelView):
    fields = [
        IntegerField("id", read_only=True),
        HasOne("category", identity="amenity-categories", label="Категория"),
        StringField("title", label="Название пункта"),
        StringField("link", label="Ссылка"),
        IntegerField("sortOrder", label="Порядок сортировки"),
        BooleanField("isActive", label="Активно"),
        DateTimeField("createdAt", label="Создано", read_only=True),
        DateTimeField("updatedAt", label="Обновлено", read_only=True),
    ]


# ── Настройка админки ───────────────────────────────────────────────

_templates_dir = str(Path(__file__).resolve().parent / "templates")

admin = Admin(
    engine=async_engine,
    title="Комплекс отдыха Парк Relax — админка",
    base_url="/admin",
    auth_provider=AdminAuthProvider(),
    i18n_config=I18nConfig(default_locale="ru"),
    templates_dir=_templates_dir,
    index_view=CustomView(
        label="Дашборд",
        icon="fa fa-dashboard",
        path="/",
        template_path="dashboard.html",
    ),
)

# ── Разделы ───────────────────────────────────────────────────────

admin.add_view(UserAdminView(User, icon="fa fa-user", label="Пользователи", identity="users"))
admin.add_view(BookingView(Booking, icon="fa fa-calendar-check", label="Бронирование", identity="booking"))
admin.add_view(
    AccommodationTypeAdminView(
        AccommodationType,
        icon="fa fa-bed",
        label="Типы размещения",
        identity="accommodation-type",
    )
)
admin.add_view(AccommodationView(Accommodation, icon="fa fa-home", label="Размещения", identity="accommodations"))
admin.add_view(AccommodationImageView(AccommodationImage, icon="fa fa-images", label="Галерея апартаментов", identity="accommodation-images"))
admin.add_view(
    AccommodationFeatureView(
        AccommodationFeature,
        icon="fa fa-tags",
        label="Особенности размещения",
        identity="accommodation-features",
    )
)
admin.add_view(
    AccommodationFeaturePresetView(
        AccommodationFeaturePreset,
        icon="fa fa-layer-group",
        label="Шаблоны особенностей",
        identity="accommodation-feature-presets",
    )
)
admin.add_view(
    AccommodationFeaturePresetItemView(
        AccommodationFeaturePresetItem,
        icon="fa fa-list",
        label="Пункты шаблона",
        identity="accommodation-feature-preset-items",
    )
)
admin.add_view(ApplyAccommodationFeaturesView())
admin.add_view(RentalItemView(RentalItem, icon="fa fa-bicycle", label="Аренда и услуги", identity="rental-items"))
admin.add_view(AreaItemAdminView(AreaItem, icon="fa fa-map-marker-alt", label="Зоны отдыха (аренда)", identity="area-items"))
admin.add_view(
    DropDown(
        "Удобства",
        icon="fa fa-concierge-bell",
        views=[
            AmenitySectionView(AmenitySection, label="Настройки секции", identity="amenity-section"),
            AmenityQuickTagView(AmenityQuickTag, label="Быстрые теги", identity="amenity-quick-tags"),
            AmenityCategoryView(AmenityCategory, label="Категории", identity="amenity-categories"),
            AmenityItemView(AmenityItem, label="Пункты", identity="amenity-items"),
        ],
    )
)
admin.add_view(PriceListDataView(PriceListData, icon="fa fa-table", label="Прайс-лист", identity="price-list"))
admin.add_view(LegalPageAdminView(LegalPage, icon="fa fa-file-contract", label="Юридические страницы", identity="legal-pages"))
admin.add_view(ContactAdminView(Contact, icon="fa fa-address-book", label="Контакты", identity="contacts"))
admin.add_view(PhoneNumberAdminView(PhoneNumber, icon="fa fa-phone", label="Телефоны", identity="phone-numbers"))
admin.add_view(EmailAddressAdminView(EmailAddress, icon="fa fa-envelope", label="Email адреса", identity="email-addresses"))
admin.add_view(ReviewAdminView(Review, icon="fa fa-star", label="Отзывы", identity="reviews"))
admin.add_view(
    DropDown(
        "Почта",
        icon="fa fa-envelope",
        views=[
            SmtpSettingsView(SmtpSettings, label="SMTP настройки", identity="smtp-settings"),
            EmailTemplateView(EmailTemplate, label="Шаблоны писем", identity="email-templates"),
            EmailLogView(EmailLog, label="Отправленные письма", identity="email-logs"),
        ],
    )
)
admin.add_view(
    DropDown(
        "Слайдер",
        icon="fa fa-images",
        views=[
            GalleryItemAdminView(GalleryItem, label="Галерея", identity="gallery"),
            AboutSliderItemAdminView(AboutSliderItem, label="Слайдер О нас", identity="about-slider"),
        ],
    )
)
admin.add_view(AdminAccountView(AdminModel, icon="fa fa-user-shield", label="Администраторы", identity="admins"))


