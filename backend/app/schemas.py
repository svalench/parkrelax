from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ── Users ──────────────────────────────────────────────────────────

class UserBase(BaseModel):
    unionId: str
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: str = "user"


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = None
    lastSignInAt: Optional[datetime] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    unionId: str | None = None
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: str = "user"
    emailVerified: bool = False
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
    lastSignInAt: datetime | None = None


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


# ── Contacts ───────────────────────────────────────────────────────

class ContactBase(BaseModel):
    address: str
    workHours: Optional[str] = None
    yandexMapEmbed: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    address: Optional[str] = None
    workHours: Optional[str] = None
    yandexMapEmbed: Optional[str] = None


class ContactResponse(ContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class PhoneNumberBase(BaseModel):
    number: str
    isVisibleInHeader: bool = False
    sortOrder: int = 0


class PhoneNumberCreate(PhoneNumberBase):
    pass


class PhoneNumberUpdate(BaseModel):
    number: Optional[str] = None
    isVisibleInHeader: Optional[bool] = None
    sortOrder: Optional[int] = None


class PhoneNumberResponse(PhoneNumberBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class EmailAddressBase(BaseModel):
    email: str
    sortOrder: int = 0


class EmailAddressCreate(EmailAddressBase):
    pass


class EmailAddressUpdate(BaseModel):
    email: Optional[str] = None
    sortOrder: Optional[int] = None


class EmailAddressResponse(EmailAddressBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class ContactPublicResponse(BaseModel):
    contact: Optional[ContactResponse] = None
    phones: list[PhoneNumberResponse] = []
    emails: list[EmailAddressResponse] = []


# ── Reviews ────────────────────────────────────────────────────────

class ReviewBase(BaseModel):
    name: str
    rating: int
    text: str
    isActive: bool = True


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    name: Optional[str] = None
    rating: Optional[int] = None
    text: Optional[str] = None
    isActive: Optional[bool] = None


class ReviewResponse(ReviewBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    avatarUrl: Optional[str] = None
    yandexReviewId: Optional[str] = None
    createdAt: datetime | None = None


# ── Gallery ────────────────────────────────────────────────────────

class GalleryItemBase(BaseModel):
    title: Optional[str] = None
    imageUrl: Optional[str] = None
    category: str = "general"
    sortOrder: int = 0
    isActive: bool = True


class GalleryItemCreate(GalleryItemBase):
    pass


class GalleryItemUpdate(BaseModel):
    title: Optional[str] = None
    imageUrl: Optional[str] = None
    category: Optional[str] = None
    sortOrder: Optional[int] = None
    isActive: Optional[bool] = None


class GalleryItemResponse(GalleryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None


# ── Accommodations ─────────────────────────────────────────────────

class AccommodationBase(BaseModel):
    name: str
    description: Optional[str] = None
    typeId: int
    imageUrl: Optional[str] = None
    capacity: int = 0
    pricePerNight: int = 0
    isActive: bool = True
    showOnMain: bool = False
    sortOrder: int = 0


class AccommodationCreate(AccommodationBase):
    pass


class AccommodationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    typeId: Optional[int] = None
    imageUrl: Optional[str] = None
    capacity: Optional[int] = None
    pricePerNight: Optional[int] = None
    isActive: Optional[bool] = None
    showOnMain: Optional[bool] = None
    sortOrder: Optional[int] = None


class AccommodationResponse(AccommodationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    type: Optional["AccommodationTypeResponse"] = None


# ── Bookings ───────────────────────────────────────────────────────

class BookingBase(BaseModel):
    customerName: str
    customerPhone: str
    customerEmail: Optional[str] = None
    startDate: date
    endDate: date
    adults: int = 1
    children: int = 0
    accommodationId: Optional[int] = None
    userId: Optional[int] = None
    status: str = "pending"
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    customerName: Optional[str] = None
    customerPhone: Optional[str] = None
    customerEmail: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    accommodationId: Optional[int] = None
    userId: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
    accommodation: Optional[AccommodationResponse] = None


class BookingPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customerName: str
    customerPhone: str
    customerEmail: Optional[str] = None
    startDate: date
    endDate: date
    adults: int
    children: int
    accommodationId: Optional[int] = None
    status: str
    createdAt: datetime
    updatedAt: datetime
    accommodation: Optional[AccommodationResponse] = None
    isNewUser: bool = False
    tempPassword: Optional[str] = None


# ── Rules ──────────────────────────────────────────────────────────

class RuleBase(BaseModel):
    title: str
    content: str
    isActive: bool = True


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    isActive: Optional[bool] = None


class RuleResponse(RuleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


# ── Translations ───────────────────────────────────────────────────

class TranslationBase(BaseModel):
    key: str
    ru: Optional[str] = None
    en: Optional[str] = None
    be: Optional[str] = None


class TranslationCreate(TranslationBase):
    pass


class TranslationUpdate(BaseModel):
    key: Optional[str] = None
    ru: Optional[str] = None
    en: Optional[str] = None
    be: Optional[str] = None


class TranslationResponse(TranslationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


# ── Accommodation Types ────────────────────────────────────────────

class AccommodationTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int
    pricePerNight: int
    imageUrl: Optional[str] = None
    isActive: bool = True
    sortOrder: int = 0


class AccommodationTypeCreate(AccommodationTypeBase):
    pass


class AccommodationTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    pricePerNight: Optional[int] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None


class AccommodationTypeResponse(AccommodationTypeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None


# ── Admins ─────────────────────────────────────────────────────────

class AdminBase(BaseModel):
    username: str
    name: Optional[str] = None


class AdminCreate(AdminBase):
    password: str


class AdminUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None


class AdminResponse(AdminBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class AdminLogin(BaseModel):
    username: str
    password: str


# ── Site Settings ──────────────────────────────────────────────────

class SiteSettingsBase(BaseModel):
    heroBackgroundUrl: Optional[str] = None


class SiteSettingsUpdate(BaseModel):
    heroBackgroundUrl: Optional[str] = None


class SiteSettingsResponse(SiteSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    updatedAt: Optional[datetime] = None


# ── Auth ───────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OAuthCallback(BaseModel):
    code: str


class UploadResponse(BaseModel):
    url: str


class EmailLoginRequest(BaseModel):
    email: str
    password: str


class RequestPasswordRequest(BaseModel):
    email: str


# ── Legal Pages ────────────────────────────────────────────────────

class LegalPageBase(BaseModel):
    slug: str
    title: str
    content: str
    isActive: bool = True


class LegalPageCreate(LegalPageBase):
    pass


class LegalPageUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    isActive: Optional[bool] = None


class LegalPageResponse(LegalPageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


# ── Rental Items ───────────────────────────────────────────────────

class RentalItemBase(BaseModel):
    title: str
    info: Optional[str] = None
    badge: Optional[str] = None
    badgeColor: Optional[str] = None
    eyebrow: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    capacity: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: bool = True
    sortOrder: int = 0


class RentalItemCreate(RentalItemBase):
    pass


class RentalItemUpdate(BaseModel):
    title: Optional[str] = None
    info: Optional[str] = None
    badge: Optional[str] = None
    badgeColor: Optional[str] = None
    eyebrow: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    capacity: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None


class RentalItemResponse(RentalItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


# ── Payment ────────────────────────────────────────────────────────

class PaymentInitiateRequest(BaseModel):
    bookingId: int


class PaymentInitiateResponse(BaseModel):
    bookingId: int
    clientSecret: str
    amount: int
    currency: str = "RUB"


class PaymentConfirmRequest(BaseModel):
    bookingId: int
    clientSecret: str


class PaymentConfirmResponse(BaseModel):
    success: bool
    bookingId: int
    status: str
