import os
import uuid
from pathlib import Path

from fastapi import Request
from PIL import Image as PILImage
from starlette.datastructures import UploadFile
from starlette.responses import Response
from starlette_admin.auth import AuthProvider
from starlette_admin.contrib.sqla import Admin, ModelView
from starlette_admin.views import CustomView, DropDown
from starlette_admin.exceptions import LoginFailed
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
)

from app.html_sanitize import sanitize_rich_html


def _apply_sanitized_rich_text(obj: object, *attr_names: str) -> None:
    """Очищает HTML в полях rich text после отправки формы админки."""
    for key in attr_names:
        val = getattr(obj, key, None)
        if val is not None:
            setattr(obj, key, sanitize_rich_html(val))


# TinyMCE: русский UI (версия langs совпадает с TinyMCEEditorField.version_tinymce по умолчанию)
RICHTEXT_TINYMCE_EXTRA = {
    "language": "ru",
    "language_url": "https://cdn.jsdelivr.net/npm/tinymce@6.4/langs/ru.js",
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
        CustomImageField("imageUrl", label="Изображение"),
        BooleanField("isActive", label="Активно"),
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
        RelativeURLField("previewUrl", label="Предпросмотр"),
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
        RelativeURLField("previewUrl", label="Предпросмотр"),
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
admin.add_view(ContactAdminView(Contact, icon="fa fa-address-book", label="Контакты", identity="contacts"))
admin.add_view(PhoneNumberAdminView(PhoneNumber, icon="fa fa-phone", label="Телефоны", identity="phone-numbers"))
admin.add_view(EmailAddressAdminView(EmailAddress, icon="fa fa-envelope", label="Email адреса", identity="email-addresses"))
admin.add_view(ReviewAdminView(Review, icon="fa fa-star", label="Отзывы", identity="reviews"))
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
admin.add_view(BookingView(Booking, icon="fa fa-calendar-check", label="Бронирования", identity="booking"))
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
admin.add_view(AdminAccountView(AdminModel, icon="fa fa-user-shield", label="Администраторы", identity="admins"))
admin.add_view(LegalPageAdminView(LegalPage, icon="fa fa-file-contract", label="Юридические страницы", identity="legal-pages"))
admin.add_view(RentalItemView(RentalItem, icon="fa fa-bicycle", label="Аренда и услуги", identity="rental-items"))
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
admin.add_view(PriceListDataView(PriceListData, icon="fa fa-table", label="Прайс-лист", identity="price-list"))


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


admin.add_view(AreaItemAdminView(AreaItem, icon="fa fa-map-marker-alt", label="Зоны отдыха (аренда)", identity="area-items"))
