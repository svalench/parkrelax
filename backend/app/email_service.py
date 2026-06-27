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
        "subject": "Ваш временный пароль — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Вы забронировали аренду в <strong>Комплексе отдыха Парк Relax</strong>.</p>
<p><strong>Ваш временный пароль:</strong> {{password}}</p>
<p>Даты бронирования: {{startDate}} — {{endDate}}</p>
<p>Дом: {{houseName}}</p>
<p>Вы можете войти в личный кабинет, используя свою почту и этот пароль.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
""".strip(),
    },
    "welcome": {
        "subject": "Добро пожаловать в Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Добро пожаловать, {{name}}!</h2>
<p>Вы зарегистрировались на сайте <strong>Комплекса отдыха Парк Relax</strong>.</p>
<p>Теперь вы можете бронировать аренду и управлять своими бронями в личном кабинете.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
""".strip(),
    },
    "payment_success": {
        "subject": "Бронирование подтверждено — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Ваша оплата прошла успешно. Бронирование подтверждено!</p>
<p><strong>Даты:</strong> {{startDate}} — {{endDate}}</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Сумма:</strong> {{amount}} Br</p>
<p>Ждём вас в Комплексе отдыха Парк Relax!</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
""".strip(),
    },
    "payment_success_admin": {
        "subject": "Оплата бронирования №{{bookingId}} — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Платёж успешно оплачен</h2>
<table style="border-collapse:collapse;width:100%;max-width:680px;font-family:Arial,sans-serif;">
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>ID платежа</strong></td><td style="padding:8px;border:1px solid #ddd;">{{paymentId}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>ID бронирования</strong></td><td style="padding:8px;border:1px solid #ddd;">{{bookingId}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Клиент</strong></td><td style="padding:8px;border:1px solid #ddd;">{{customerName}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd;">{{customerEmail}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Телефон</strong></td><td style="padding:8px;border:1px solid #ddd;">{{customerPhone}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Размещение</strong></td><td style="padding:8px;border:1px solid #ddd;">{{houseName}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Даты</strong></td><td style="padding:8px;border:1px solid #ddd;">{{startDate}} — {{endDate}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Сумма</strong></td><td style="padding:8px;border:1px solid #ddd;">{{amount}} {{currency}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Статус</strong></td><td style="padding:8px;border:1px solid #ddd;">{{status}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Создан</strong></td><td style="padding:8px;border:1px solid #ddd;">{{createdAt}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Оплачен</strong></td><td style="padding:8px;border:1px solid #ddd;">{{paidAt}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Transaction ID</strong></td><td style="padding:8px;border:1px solid #ddd;">{{transactionId}}</td></tr>
</table>
<p style="margin-top:16px;">Открыть админку: <a href="{{adminUrl}}">{{adminUrl}}</a></p>
""".strip(),
    },
    "payment_available": {
        "subject": "Оплата бронирования №{{bookingId}} доступна — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Ваше бронирование №{{bookingId}} подтверждено администратором. Теперь доступна онлайн-оплата банковской картой.</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Даты:</strong> {{startDate}} — {{endDate}}</p>
<p><strong>Сумма к оплате:</strong> {{amount}} Br</p>
<p style="margin-top:16px;">
  <a href="{{paymentUrl}}" style="display:inline-block;background:#1e6091;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;">
    Перейти к оплате
  </a>
</p>
<p>Если кнопка не открывается, перейдите по ссылке: <a href="{{paymentUrl}}">{{paymentUrl}}</a></p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
""".strip(),
    },
    "booking_reminder": {
        "subject": "Напоминание о бронировании — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Напоминаем, что ваш заезд запланирован на <strong>{{startDate}}</strong>.</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Даты проживания:</strong> {{startDate}} — {{endDate}}</p>
<p>Если у вас есть вопросы, просто ответьте на это письмо.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
""".strip(),
    },
    "booking_cancelled": {
        "subject": "Бронирование отменено — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Ваше бронирование №{{bookingId}} в <strong>Комплексе отдыха Парк Relax</strong> отменено.</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Даты:</strong> {{startDate}} — {{endDate}}</p>
<p>Условия возврата предоплаты указаны в <a href="https://parkrelax.by/legal/refund-policy">Правилах возврата средств</a>.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
""".strip(),
    },
    "booking_confirmation": {
        "subject": "Бронирование подтверждено — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Здравствуйте, {{name}}!</h2>
<p>Ваше бронирование в <strong>Комплексе отдыха Парк Relax</strong> оформлено.</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Даты:</strong> {{startDate}} — {{endDate}}</p>
<p><strong>Гости:</strong> {{adults}} взрослых, {{children}} детей</p>
<p><strong>Ночей:</strong> {{nights}}</p>
<hr>
<p>Для входа в личный кабинет используйте email и пароль. Если вы забыли пароль, восстановите его на сайте.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
""".strip(),
    },
    "new_booking_admin": {
        "subject": "Новая заявка на бронирование — Комплекс отдыха Парк Relax",
        "bodyHtml": """
<h2>Новая заявка на бронирование</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;font-family:Arial,sans-serif;">
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>ID бронирования</strong></td><td style="padding:8px;border:1px solid #ddd;">{{bookingId}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Гость</strong></td><td style="padding:8px;border:1px solid #ddd;">{{customerName}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Телефон</strong></td><td style="padding:8px;border:1px solid #ddd;">{{customerPhone}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd;">{{customerEmail}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Дом</strong></td><td style="padding:8px;border:1px solid #ddd;">{{houseName}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Заезд</strong></td><td style="padding:8px;border:1px solid #ddd;">{{startDate}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Выезд</strong></td><td style="padding:8px;border:1px solid #ddd;">{{endDate}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Взрослые</strong></td><td style="padding:8px;border:1px solid #ddd;">{{adults}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Дети</strong></td><td style="padding:8px;border:1px solid #ddd;">{{children}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Ночей</strong></td><td style="padding:8px;border:1px solid #ddd;">{{nights}}</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Сумма</strong></td><td style="padding:8px;border:1px solid #ddd;">{{totalPrice}} Br</td></tr>
  <tr><td style="padding:8px;border:1px solid #ddd;background:#f9f9f9;"><strong>Статус</strong></td><td style="padding:8px;border:1px solid #ddd;">Ожидает подтверждения</td></tr>
</table>
<p style="margin-top:16px;">Для подтверждения перейдите в <a href="{{adminUrl}}">админ-панель</a>.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>
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
    raise_on_error: bool = False,
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
    msg["From"] = f"{smtp.fromName or 'Комплекс отдыха Парк Relax'} <{smtp.fromEmail or smtp.username}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html", "utf-8"))

    try:
        # Port 465 requires SSL/TLS immediately (use_tls=True)
        # Port 587 uses STARTTLS (start_tls=True)
        if smtp.port == 465:
            await aiosmtplib.send(
                msg,
                hostname=smtp.host,
                port=smtp.port,
                username=smtp.username,
                password=smtp.password,
                use_tls=True,
                timeout=30,
            )
        else:
            await aiosmtplib.send(
                msg,
                hostname=smtp.host,
                port=smtp.port,
                username=smtp.username,
                password=smtp.password,
                start_tls=smtp.useTls,
                timeout=30,
            )
        log.status = "sent"
        log.sentAt = datetime.utcnow()
    except Exception as exc:
        import traceback
        log.status = "failed"
        log.errorMessage = f"{exc}\n\n{traceback.format_exc()}"
        await db.commit()
        if raise_on_error:
            raise

    await db.commit()
    return log
