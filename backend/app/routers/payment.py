import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.dependencies import get_db
from app.models import Booking, Accommodation
from app.schemas import (
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentConfirmRequest,
    PaymentConfirmResponse,
)
from app.email_service import send_email
from app.routers.site_settings import require_public_booking_enabled

router = APIRouter(prefix="/payment", tags=["payment"])


@router.post("/initiate", response_model=PaymentInitiateResponse)
async def initiate_payment(
    data: PaymentInitiateRequest,
    db: AsyncSession = Depends(get_db),
):
    await require_public_booking_enabled(db)
    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation), joinedload(Booking.user))
        .where(Booking.id == data.bookingId)
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status not in ("pending",):
        raise HTTPException(status_code=400, detail="Booking is not available for payment")

    nights = max(1, (booking.endDate - booking.startDate).days)
    amount = nights * (booking.accommodation.pricePerNight if booking.accommodation else 0)
    client_secret = f"secret_{booking.id}_{secrets.token_urlsafe(16)}"

    return PaymentInitiateResponse(
        bookingId=booking.id,
        clientSecret=client_secret,
        amount=amount,
        currency="BYN",
    )


@router.post("/confirm", response_model=PaymentConfirmResponse)
async def confirm_payment(
    data: PaymentConfirmRequest,
    db: AsyncSession = Depends(get_db),
):
    await require_public_booking_enabled(db)
    result = await db.execute(
        select(Booking)
        .options(joinedload(Booking.accommodation), joinedload(Booking.user))
        .where(Booking.id == data.bookingId)
    )
    booking = result.unique().scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Simple mock validation
    if not data.clientSecret or not data.clientSecret.startswith(f"secret_{booking.id}_"):
        raise HTTPException(status_code=400, detail="Invalid client secret")

    booking.status = "paid"
    await db.commit()

    # Send payment success email
    if booking.user and booking.user.email:
        nights = max(1, (booking.endDate - booking.startDate).days)
        amount = nights * (booking.accommodation.pricePerNight if booking.accommodation else 0)
        await send_email(
            db,
            to_email=booking.user.email,
            template_type="payment_success",
            variables={
                "name": booking.user.name or booking.customerName or "Гость",
                "startDate": booking.startDate.isoformat(),
                "endDate": booking.endDate.isoformat(),
                "houseName": booking.accommodation.name if booking.accommodation else "—",
                "amount": str(amount),
            },
        )

    return PaymentConfirmResponse(
        success=True,
        bookingId=booking.id,
        status=booking.status,
    )
