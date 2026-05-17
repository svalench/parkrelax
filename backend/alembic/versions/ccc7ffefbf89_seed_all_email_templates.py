"""seed_all_email_templates

Revision ID: ccc7ffefbf89
Revises: 69a6a18bfe32
Create Date: 2026-05-17 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccc7ffefbf89'
down_revision: Union[str, Sequence[str], None] = '69a6a18bfe32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TEMPLATES = {
    "temp_password": (
        "Ваш временный пароль — Комплекс отдыха Парк Relax",
        """<h2>Здравствуйте, {{name}}!</h2>
<p>Вы забронировали аренду в <strong>Комплексе отдыха Парк Relax</strong>.</p>
<p><strong>Ваш временный пароль:</strong> {{password}}</p>
<p>Даты бронирования: {{startDate}} — {{endDate}}</p>
<p>Дом: {{houseName}}</p>
<p>Вы можете войти в личный кабинет, используя свою почту и этот пароль.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>""",
    ),
    "welcome": (
        "Добро пожаловать в Комплекс отдыха Парк Relax",
        """<h2>Добро пожаловать, {{name}}!</h2>
<p>Вы зарегистрировались на сайте <strong>Комплекса отдыха Парк Relax</strong>.</p>
<p>Теперь вы можете бронировать аренду и управлять своими бронями в личном кабинете.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>""",
    ),
    "payment_success": (
        "Бронирование подтверждено — Комплекс отдыха Парк Relax",
        """<h2>Здравствуйте, {{name}}!</h2>
<p>Ваша оплата прошла успешно. Бронирование подтверждено!</p>
<p><strong>Даты:</strong> {{startDate}} — {{endDate}}</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Сумма:</strong> {{amount}} Br</p>
<p>Ждём вас в Комплексе отдыха Парк Relax!</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>""",
    ),
    "booking_reminder": (
        "Напоминание о бронировании — Комплекс отдыха Парк Relax",
        """<h2>Здравствуйте, {{name}}!</h2>
<p>Напоминаем, что ваш заезд запланирован на <strong>{{startDate}}</strong>.</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Даты проживания:</strong> {{startDate}} — {{endDate}}</p>
<p>Если у вас есть вопросы, просто ответьте на это письмо.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>""",
    ),
    "new_booking_admin": (
        "Новая заявка на бронирование — Комплекс отдыха Парк Relax",
        """<h2>Новая заявка на бронирование</h2>
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
<p>С уважением, команда Комплекса отдыха Парк Relax</p>""",
    ),
    "booking_confirmation": (
        "Бронирование подтверждено — Комплекс отдыха Парк Relax",
        """<h2>Здравствуйте, {{name}}!</h2>
<p>Ваше бронирование в <strong>Комплексе отдыха Парк Relax</strong> оформлено.</p>
<p><strong>Дом:</strong> {{houseName}}</p>
<p><strong>Даты:</strong> {{startDate}} — {{endDate}}</p>
<p><strong>Гости:</strong> {{adults}} взрослых, {{children}} детей</p>
<p><strong>Ночей:</strong> {{nights}}</p>
<hr>
<p>Для входа в личный кабинет используйте email и пароль. Если вы забыли пароль, восстановите его на сайте.</p>
<hr>
<p>С уважением, команда Комплекса отдыха Парк Relax</p>""",
    ),
}


def upgrade() -> None:
    conn = op.get_bind()
    is_sqlite = conn.dialect.name == "sqlite"
    now_sql = "datetime('now')" if is_sqlite else "NOW()"

    for ttype, (subject, body) in TEMPLATES.items():
        exists = conn.execute(
            sa.text("SELECT 1 FROM email_templates WHERE type = :t"),
            {"t": ttype},
        ).fetchone()

        if not exists:
            conn.execute(
                sa.text(
                    f"""
                    INSERT INTO email_templates (type, subject, bodyHtml, isActive, createdAt, updatedAt)
                    VALUES (:type, :subject, :body, 1, {now_sql}, {now_sql})
                    """
                ),
                {
                    "type": ttype,
                    "subject": subject,
                    "body": body,
                },
            )


def downgrade() -> None:
    conn = op.get_bind()
    for ttype in TEMPLATES:
        conn.execute(
            sa.text("DELETE FROM email_templates WHERE type = :t"),
            {"t": ttype},
        )
