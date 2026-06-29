from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator, model_validator


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


# ── Admin Emails ───────────────────────────────────────────────────

class AdminEmailBase(BaseModel):
    email: str
    name: Optional[str] = None
    isActive: bool = True
    notifyOnPayments: bool = True


class AdminEmailCreate(AdminEmailBase):
    pass


class AdminEmailUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    isActive: Optional[bool] = None
    notifyOnPayments: Optional[bool] = None


class AdminEmailResponse(AdminEmailBase):
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


# ── About Slider ───────────────────────────────────────────────────

class AboutSliderItemBase(BaseModel):
    title: Optional[str] = None
    imageUrl: Optional[str] = None
    sortOrder: int = 0
    isActive: bool = True


class AboutSliderItemCreate(AboutSliderItemBase):
    pass


class AboutSliderItemUpdate(BaseModel):
    title: Optional[str] = None
    imageUrl: Optional[str] = None
    sortOrder: Optional[int] = None
    isActive: Optional[bool] = None


class AboutSliderItemResponse(AboutSliderItemBase):
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


class AccommodationImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    imageUrl: str
    sortOrder: int = 0


class AccommodationFeatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    iconName: str = ""
    label: str = ""
    sortOrder: int = 0
    isActive: bool = True
    presetId: int | None = None


class AccommodationResponse(AccommodationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    type: Optional["AccommodationTypeResponse"] = None
    images: list[AccommodationImageResponse] = []
    features: list[AccommodationFeatureResponse] = []

    @model_validator(mode="after")
    def only_active_features(self) -> "AccommodationResponse":
        self.features = sorted(
            [f for f in self.features if f.isActive],
            key=lambda f: f.sortOrder,
        )
        return self


class AccommodationAvailabilityResponse(AccommodationResponse):
    """Размещение с флагом занятости на выбранный диапазон дат."""

    isBookedForDates: bool = False


class PaginatedAccommodationAvailabilityResponse(BaseModel):
    """Список размещений с метаданными пагинации."""

    items: list[AccommodationAvailabilityResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int


class AccommodationBookingCheckResponse(BaseModel):
    """Проверка перед оформлением: свободно ли размещение на даты."""

    available: bool
    accommodation: Optional[AccommodationAvailabilityResponse] = None


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
    holdExpiresAt: Optional[datetime] = None
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
    priceUnit: Optional[str] = "ночь"
    pricingModel: Optional[str] = "per_night"
    childPricePerNight: Optional[int] = None
    imageUrl: Optional[str] = None
    isActive: bool = True
    showInListing: bool = True
    sortOrder: int = 0


class AccommodationTypeCreate(AccommodationTypeBase):
    pass


class AccommodationTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    pricePerNight: Optional[int] = None
    priceUnit: Optional[str] = None
    pricingModel: Optional[str] = None
    childPricePerNight: Optional[int] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    showInListing: Optional[bool] = None
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
    bookingPublicEnabled: bool = False


class SiteSettingsUpdate(BaseModel):
    heroBackgroundUrl: Optional[str] = None


class SiteSettingsBookingUpdate(BaseModel):
    bookingPublicEnabled: bool


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


# ── Area Items ─────────────────────────────────────────────────────

class AreaItemBase(BaseModel):
    title: str
    info: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: bool = True
    sortOrder: int = 0


class AreaItemCreate(AreaItemBase):
    pass


class AreaItemUpdate(BaseModel):
    title: Optional[str] = None
    info: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None


class AreaItemResponse(AreaItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


# ── Payment ────────────────────────────────────────────────────────

class PaymentInitiateRequest(BaseModel):
    bookingId: int


class PaymentInitiateResponse(BaseModel):
    paymentId: int | None = None
    bookingId: int
    amount: int
    currency: str = "BYN"
    paymentMode: str = "mock"
    status: str | None = None
    clientSecret: str | None = None
    redirectUrl: str | None = None
    paymentToken: str | None = None
    holdExpiresAt: datetime | None = None


class PaymentConfirmRequest(BaseModel):
    bookingId: int
    paymentId: int | None = None
    clientSecret: str | None = None
    paymentToken: str | None = None

    @field_validator("clientSecret")
    @classmethod
    def validate_client_secret(cls, v: str | None) -> str | None:
        if v is None:
            return v
        import re
        if not re.fullmatch(r"secret_\d+_[A-Za-z0-9_-]+", v):
            raise ValueError("Invalid client secret format")
        return v


class PaymentConfirmResponse(BaseModel):
    success: bool
    bookingId: int
    status: str
    paymentId: int | None = None


class PaymentSettingsBase(BaseModel):
    shopId: Optional[str] = None
    secretKey: Optional[str] = None
    testMode: bool = True
    isActive: bool = False
    notificationUrl: Optional[str] = None
    bookingPaymentMode: str = "manual_confirmation"

    @field_validator("bookingPaymentMode")
    @classmethod
    def validate_booking_payment_mode(cls, v: str) -> str:
        if v not in {"manual_confirmation", "auto_payment"}:
            raise ValueError("Invalid booking payment mode")
        return v


class PaymentSettingsUpdate(BaseModel):
    shopId: Optional[str] = None
    secretKey: Optional[str] = None
    testMode: Optional[bool] = None
    isActive: Optional[bool] = None
    notificationUrl: Optional[str] = None
    bookingPaymentMode: Optional[str] = None

    @field_validator("bookingPaymentMode")
    @classmethod
    def validate_optional_booking_payment_mode(cls, v: str | None) -> str | None:
        if v is not None and v not in {"manual_confirmation", "auto_payment"}:
            raise ValueError("Invalid booking payment mode")
        return v


class PaymentSettingsResponse(PaymentSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int = 1
    updatedAt: datetime | None = None


class PaymentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    paymentId: int
    eventType: str
    providerStatus: Optional[str] = None
    payloadJson: Optional[str] = None
    createdAt: datetime | None = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    bookingId: int | None = None
    userId: int | None = None
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    amountMinor: int
    currency: str = "BYN"
    provider: str = "bepaid"
    status: str
    bookingPaymentMode: str = "manual_confirmation"
    trackingId: Optional[str] = None
    checkoutToken: Optional[str] = None
    redirectUrl: Optional[str] = None
    transactionId: Optional[str] = None
    providerStatus: Optional[str] = None
    createdByType: str = "guest"
    createdByUserId: int | None = None
    createdByAdminId: int | None = None
    requestIp: Optional[str] = None
    userAgent: Optional[str] = None
    errorMessage: Optional[str] = None
    customerEmailSentAt: datetime | None = None
    adminEmailSentAt: datetime | None = None
    paidAt: datetime | None = None
    lastWebhookAt: datetime | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
    events: list[PaymentEventResponse] = []


class PriceListDataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    data: list[dict] = []
    updatedAt: datetime | None = None


# ── Amenities ──────────────────────────────────────────────────────

class AmenitySectionBase(BaseModel):
    label: str = "УДОБСТВА"
    title: str = ""
    description: str = ""


class AmenitySectionCreate(AmenitySectionBase):
    pass


class AmenitySectionUpdate(BaseModel):
    label: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class AmenitySectionResponse(AmenitySectionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    updatedAt: datetime | None = None


class AmenityQuickTagBase(BaseModel):
    iconName: str = ""
    label: str = ""
    link: str = "/prices"
    sortOrder: int = 0
    isActive: bool = True


class AmenityQuickTagCreate(AmenityQuickTagBase):
    pass


class AmenityQuickTagUpdate(BaseModel):
    iconName: Optional[str] = None
    label: Optional[str] = None
    link: Optional[str] = None
    sortOrder: Optional[int] = None
    isActive: Optional[bool] = None


class AmenityQuickTagResponse(AmenityQuickTagBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class AmenityCategoryBase(BaseModel):
    iconName: str = ""
    title: str = ""
    sortOrder: int = 0
    isActive: bool = True


class AmenityCategoryCreate(AmenityCategoryBase):
    pass


class AmenityCategoryUpdate(BaseModel):
    iconName: Optional[str] = None
    title: Optional[str] = None
    sortOrder: Optional[int] = None
    isActive: Optional[bool] = None


class AmenityCategoryResponse(AmenityCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class AmenityItemBase(BaseModel):
    categoryId: int
    title: str = ""
    link: str = "/prices"
    sortOrder: int = 0
    isActive: bool = True


class AmenityItemCreate(AmenityItemBase):
    pass


class AmenityItemUpdate(BaseModel):
    categoryId: Optional[int] = None
    title: Optional[str] = None
    link: Optional[str] = None
    sortOrder: Optional[int] = None
    isActive: Optional[bool] = None


class AmenityItemResponse(AmenityItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


# ── Banya landing ──────────────────────────────────────────────────

class BanyaPageSettingsBase(BaseModel):
    pageTitle: str
    pageSubtitle: Optional[str] = None
    eyebrow: Optional[str] = None
    ctaLabel: Optional[str] = None
    ctaHref: Optional[str] = None
    isActive: bool = True


class BanyaPageSettingsUpdate(BaseModel):
    pageTitle: Optional[str] = None
    pageSubtitle: Optional[str] = None
    eyebrow: Optional[str] = None
    ctaLabel: Optional[str] = None
    ctaHref: Optional[str] = None
    isActive: Optional[bool] = None


class BanyaPageSettingsResponse(BanyaPageSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int = 1
    updatedAt: datetime | None = None


class BanyaSliderItemBase(BaseModel):
    title: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: bool = True
    sortOrder: int = 0


class BanyaSliderItemCreate(BanyaSliderItemBase):
    pass


class BanyaSliderItemUpdate(BaseModel):
    title: Optional[str] = None
    imageUrl: Optional[str] = None
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None


class BanyaSliderItemResponse(BanyaSliderItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None


class BanyaSectionBase(BaseModel):
    eyebrow: Optional[str] = None
    title: str
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    chips: Optional[list[str]] = None
    isActive: bool = True
    sortOrder: int = 0


class BanyaSectionCreate(BanyaSectionBase):
    pass


class BanyaSectionUpdate(BaseModel):
    eyebrow: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    imageUrl: Optional[str] = None
    chips: Optional[list[str]] = None
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None


class BanyaSectionResponse(BanyaSectionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class BanyaPagePublicResponse(BaseModel):
    settings: BanyaPageSettingsResponse
    slider: list[BanyaSliderItemResponse]
    sections: list[BanyaSectionResponse]
