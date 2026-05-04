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
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)
    lastSignInAt = Column(DateTime, default=func.now(), nullable=True)


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(Text, nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True)
    workHours = Column(String(100), nullable=True)
    mapUrl = Column(Text, nullable=True)
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


class Accommodation(Base):
    __tablename__ = "accommodations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    typeId = Column(Integer, ForeignKey("accommodationTypes.id"), nullable=False)
    imageUrl = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)
    sortOrder = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=func.now(), nullable=True)

    type = relationship("AccommodationType", back_populates="accommodations")
    bookings = relationship("Booking", back_populates="accommodation")


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
    status = Column(String(50), default="pending", nullable=False)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=func.now(), nullable=True)
    updatedAt = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=True)

    accommodation = relationship("Accommodation", back_populates="bookings")


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
