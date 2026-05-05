from fastapi import APIRouter, Depends
from sqlalchemy import select, asc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_viewsets import AsyncBaseViewset

from app.database import AsyncSessionLocal
from app.dependencies import get_db, get_current_admin
from app.models import Contact, PhoneNumber, EmailAddress
from app.schemas import (
    ContactResponse,
    ContactPublicResponse,
    PhoneNumberResponse,
    EmailAddressResponse,
)

router = APIRouter(prefix="/contact", tags=["contact"])


@router.get("", response_model=ContactPublicResponse)
async def get_contacts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Contact).limit(1))
    contact = result.scalar_one_or_none()

    phones_result = await db.execute(
        select(PhoneNumber).order_by(asc(PhoneNumber.sortOrder))
    )
    phones = phones_result.scalars().all()

    emails_result = await db.execute(
        select(EmailAddress).order_by(asc(EmailAddress.sortOrder))
    )
    emails = emails_result.scalars().all()

    return ContactPublicResponse(
        contact=ContactResponse.model_validate(contact) if contact else None,
        phones=[PhoneNumberResponse.model_validate(p) for p in phones],
        emails=[EmailAddressResponse.model_validate(e) for e in emails],
    )


@router.get("/phones", response_model=list[PhoneNumberResponse])
async def list_phones(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PhoneNumber).order_by(asc(PhoneNumber.sortOrder)))
    return result.scalars().all()


@router.get("/emails", response_model=list[EmailAddressResponse])
async def list_emails(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmailAddress).order_by(asc(EmailAddress.sortOrder)))
    return result.scalars().all()


# ── Admin Viewsets ──────────────────────────────────────────────────

admin_contact_viewset = AsyncBaseViewset(
    endpoint="/admin/contacts",
    model=Contact,
    response_model=ContactResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-contact"],
)
admin_contact_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])

admin_phone_viewset = AsyncBaseViewset(
    endpoint="/admin/phone-numbers",
    model=PhoneNumber,
    response_model=PhoneNumberResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-phone"],
)
admin_phone_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])

admin_email_viewset = AsyncBaseViewset(
    endpoint="/admin/email-addresses",
    model=EmailAddress,
    response_model=EmailAddressResponse,
    db_session=AsyncSessionLocal,
    tags=["admin-email"],
)
admin_email_viewset.register(methods=["LIST", "GET", "POST", "PATCH", "DELETE"])
