from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    unionId = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    email = Column(String(320), nullable=True)
    avatar = Column(Text, nullable=True)
    role = Column(String(50), default="user", nullable=False)
    passwordHash = Column(String(255), nullable=True)
    emailVerified = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)
    lastSignInAt = Column(DateTime, default=func.now(), nullable=True)

    bookings = relationship("Booking", back_populates="user")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(Text, nullable=False)
    workHours = Column(String(100), nullable=True)
    yandexMapEmbed = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class PhoneNumber(Base):
    __tablename__ = "phone_numbers"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(50), nullable=False)
    isVisibleInHeader = Column(Boolean, default=False, nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class EmailAddress(Base):
    __tablename__ = "email_addresses"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class AdminEmail(Base):
    __tablename__ = "admin_emails"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(320), nullable=False)
    name = Column(String(100), nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    avatarUrl = Column(Text, nullable=True)
    yandexReviewId = Column(String(100), nullable=True, unique=True)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)


class GalleryItem(Base):
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=True)
    imageUrl = Column(Text, nullable=True)
    category = Column(String(50), default="general", nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)


class AboutSliderItem(Base):
    __tablename__ = "about_slider"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=True)
    imageUrl = Column(Text, nullable=True)
    sortOrder = Column(Integer, default=0, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)


class Accommodation(Base):
    __tablename__ = "accommodations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    typeId = Column(Integer, ForeignKey("accommodationTypes.id"), nullable=False)
    imageUrl = Column(Text, nullable=True)
    capacity = Column(Integer, default=0, nullable=False)
    pricePerNight = Column(Integer, default=0, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    showOnMain = Column(Boolean, default=False, nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)

    type = relationship("AccommodationType", back_populates="accommodations")
    bookings = relationship("Booking", back_populates="accommodation")
    images = relationship(
        "AccommodationImage",
        back_populates="accommodation",
        cascade="all, delete-orphan",
        order_by="AccommodationImage.sortOrder",
    )

    @property
    def galleryManager(self) -> str:
        return ""

    @galleryManager.setter
    def galleryManager(self, value: str) -> None:
        pass


class AccommodationImage(Base):
    __tablename__ = "accommodation_images"

    id = Column(Integer, primary_key=True, index=True)
    accommodationId = Column(Integer, ForeignKey("accommodations.id", ondelete="CASCADE"), nullable=False)
    imageUrl = Column(Text, nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)

    accommodation = relationship("Accommodation", back_populates="images")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customerName = Column(String(100), nullable=False)
    customerPhone = Column(String(50), nullable=False)
    customerEmail = Column(String(100), nullable=True)
    startDate = Column(Date, nullable=False)
    endDate = Column(Date, nullable=False)
    adults = Column(Integer, default=1, nullable=False)
    children = Column(Integer, default=0, nullable=False)
    accommodationId = Column(Integer, ForeignKey("accommodations.id"), nullable=True)
    userId = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="pending", nullable=False)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)

    accommodation = relationship("Accommodation", back_populates="bookings")
    user = relationship("User", back_populates="bookings")


class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class Translation(Base):
    __tablename__ = "translations"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(200), unique=True, nullable=False)
    ru = Column(Text, nullable=True)
    en = Column(Text, nullable=True)
    be = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class AccommodationType(Base):
    __tablename__ = "accommodationTypes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    capacity = Column(Integer, nullable=False)
    pricePerNight = Column(Integer, nullable=False)
    priceUnit = Column(String(50), default="ночь", nullable=True)
    imageUrl = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)

    accommodations = relationship("Accommodation", back_populates="type")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    passwordHash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class SiteSettings(Base):
    __tablename__ = "siteSettings"

    id = Column(Integer, primary_key=True, autoincrement=False)
    heroBackgroundUrl = Column(Text, nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class LegalPage(Base):
    __tablename__ = "legal_pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class RentalItem(Base):
    __tablename__ = "rental_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    info = Column(String(200), nullable=True)
    badge = Column(String(100), nullable=True)
    badgeColor = Column(String(100), nullable=True)
    eyebrow = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    duration = Column(String(100), nullable=True)
    capacity = Column(String(100), nullable=True)
    imageUrl = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


# ── Email / SMTP ───────────────────────────────────────────────────

class SmtpSettings(Base):
    __tablename__ = "smtp_settings"

    id = Column(Integer, primary_key=True, autoincrement=False, default=1)
    host = Column(String(255), nullable=False, default="smtp.gmail.com")
    port = Column(Integer, nullable=False, default=587)
    username = Column(String(255), nullable=True)
    password = Column(String(255), nullable=True)
    useTls = Column(Boolean, default=True, nullable=False)
    fromEmail = Column(String(320), nullable=True)
    fromName = Column(String(255), nullable=True)
    isActive = Column(Boolean, default=False, nullable=False)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), unique=True, nullable=False)
    subject = Column(String(500), nullable=False)
    bodyHtml = Column(Text, nullable=False)
    uploadPath = Column(String(500), nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)

    @property
    def previewUrl(self) -> str:
        return f"/admin/email-template-preview/{self.id}"


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    toEmail = Column(String(320), nullable=False)
    subject = Column(String(500), nullable=False)
    bodyPreview = Column(Text, nullable=True)
    bodyHtml = Column(Text, nullable=True)
    templateType = Column(String(50), nullable=True)
    status = Column(String(50), default="pending", nullable=False)
    errorMessage = Column(Text, nullable=True)
    messageId = Column(String(500), nullable=True)
    sentAt = Column(DateTime, default=func.now(), nullable=True)

    @property
    def previewUrl(self) -> str:
        return f"/admin/email-preview/{self.id}"


class PriceListData(Base):
    __tablename__ = "price_list_data"

    id = Column(Integer, primary_key=True, autoincrement=False, default=1)
    data = Column(Text, default="[]", nullable=False)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)
