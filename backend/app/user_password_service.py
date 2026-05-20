"""Сброс пароля пользователя и отправка временного пароля на email."""

import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession

from app.email_service import generate_temp_password, send_email
from app.models import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


async def reset_user_password_and_email(
    db: AsyncSession,
    user: User,
    *,
    raise_on_email_error: bool = False,
) -> None:
    """Генерирует новый пароль, сохраняет хеш и отправляет письмо temp_password."""
    email = (user.email or "").strip()
    if not email:
        if raise_on_email_error:
            from starlette_admin.exceptions import ActionFailed

            raise ActionFailed("У пользователя не указан email")
        return

    new_password = generate_temp_password()
    user.passwordHash = hash_password(new_password)
    await db.commit()

    log = await send_email(
        db,
        to_email=email,
        template_type="temp_password",
        variables={
            "name": user.name or "Гость",
            "password": new_password,
            "startDate": "—",
            "endDate": "—",
            "houseName": "—",
        },
        raise_on_error=raise_on_email_error,
    )
    if raise_on_email_error and log.status != "sent":
        from starlette_admin.exceptions import ActionFailed

        raise ActionFailed(log.errorMessage or "Не удалось отправить письмо")
