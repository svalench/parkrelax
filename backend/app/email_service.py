import re
import secrets
import string
from datetime import datetime
from typing import Optional

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SmtpSettings, EmailTemplate, EmailLog


DEFAULT_TEMPLATES = {
    "temp_password": {
        "subject": "Ваш временный пароль — Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Вы забронировали проживание в <strong>Парк Relax</strong>.</p>
<p><strong>Ваш временный пароль:</strong> {{password}}</p>
<p>Даты бронирования: {{startDate}} — {{endDate}}</p>
<p>Дом: {{houseName}}</p>
<p>Вы можете войти в личный кабинет, используя свою почту и этот пароль.</p>
<hr>
<p>С уважением, команда Парк Relax</p>
""".strip(),
    },
    "welcome": {
        "subject": "Добро пожаловать в Парк Relax",
        "bodyHtml": """
<h2>Добро пожаловать, {{name}}!</h2>
<p>Вы зарегистрировались на сайте <strong>Парк Relax</strong>.</p>
<p>Теперь вы можете бронировать проживание и управлять своими бронями в личном кабинете.</p>
<hr>
<p>С уважением, команда Парк Relax</p>
""".strip(),
    },
    "payment_success": {
        "subject": "Бронирование подтверждено — Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Ваша оплата прошла успешно. Бронирование подтверждено!</p>
<p><strong>Даты:</strong> {{startDate}} — {{endDate}}</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Сумма:</strong> {{amount}} Br</p>
<p>Ждём вас в Парк Relax!</p>
<hr>
<p>С уважением, команда Парк Relax</p>
""".strip(),
    },
    "booking_reminder": {
        "subject": "Напоминание о бронировании — Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Напоминаем, что ваш заезд запланирован на <strong>{{startDate}}</strong>.</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Даты проживания:</strong> {{startDate}} — {{endDate}}</p>
<p>Если у вас есть вопросы, просто ответьте на это письмо.</p>
<hr>
<p>С уважением, команда Парк Relax</p>
""".strip(),
    },
}


def generate_temp_password(length: int = 8) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _render_template(template_str: str, variables: dict) -> str:
    result = template_str
    for key, value in variables.items():
        result = result.replace(f"{{{{{key}}}}}", str(value) if value is not None else "")
    return result


async def ensure_default_templates(db: AsyncSession) -> None:
    for ttype, data in DEFAULT_TEMPLATES.items():
        result = await db.execute(select(EmailTemplate).where(EmailTemplate.type == ttype))
        if result.scalar_one_or_none() is None:
            db.add(
                EmailTemplate(
                    type=ttype,
                    subject=data["subject"],
                    bodyHtml=data["bodyHtml"],
                    isActive=True,
                )
            )
    await db.commit()


async def get_active_smtp_settings(db: AsyncSession) -> Optional[SmtpSettings]:
    result = await db.execute(select(SmtpSettings).where(SmtpSettings.isActive == True))
    return result.scalar_one_or_none()


async def send_email(
    db: AsyncSession,
    to_email: str,
    template_type: str,
    variables: dict,
    subject_override: Optional[str] = None,
    body_override: Optional[str] = None,
) -> EmailLog:
    """Send an email using active SMTP settings and log the result."""
    # Resolve template first to have subject for logging even on failure
    template = None
    if not body_override:
        template_result = await db.execute(
            select(EmailTemplate).where(
                EmailTemplate.type == template_type, EmailTemplate.isActive == True
            )
        )
        template = template_result.scalar_one_or_none()

    subject = subject_override or (template.subject if template else "")
    body = body_override or (template.bodyHtml if template else "")

    # Render template with variables early so we store the final content
    subject = _render_template(subject, variables)
    body = _render_template(body, variables)

    smtp = await get_active_smtp_settings(db)
    if not smtp:
        log = EmailLog(
            toEmail=to_email,
            subject=subject,
            bodyPreview=body[:500] if body else "",
            bodyHtml=body,
            templateType=template_type,
            status="failed",
            errorMessage="SMTP not configured or inactive",
        )
        db.add(log)
        await db.commit()
        return log

    if not body_override and not template:
        log = EmailLog(
            toEmail=to_email,
            subject=subject,
            bodyPreview=body[:500] if body else "",
            bodyHtml=body,
            templateType=template_type,
            status="failed",
            errorMessage=f"Template {template_type} not found or inactive",
        )
        db.add(log)
        await db.commit()
        return log

    log = EmailLog(
        toEmail=to_email,
        subject=subject,
        bodyPreview=body[:500],
        bodyHtml=body,
        templateType=template_type,
        status="pending",
    )
    db.add(log)
    await db.flush()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{smtp.fromName or 'Парк Relax'} <{smtp.fromEmail or smtp.username}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp.host,
            port=smtp.port,
            username=smtp.username,
            password=smtp.password,
            start_tls=smtp.useTls,
        )
        log.status = "sent"
        log.sentAt = datetime.utcnow()
    except Exception as exc:
        log.status = "failed"
        log.errorMessage = str(exc)[:500]

    await db.commit()
    return log
