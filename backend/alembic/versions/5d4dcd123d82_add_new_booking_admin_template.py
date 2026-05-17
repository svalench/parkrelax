"""add_new_booking_admin_template

Revision ID: 5d4dcd123d82
Revises: bc0191b932f3
Create Date: 2026-05-16 12:27:38.664567

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d4dcd123d82'
down_revision: Union[str, Sequence[str], None] = 'bc0191b932f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new_booking_admin email template if missing."""
    conn = op.get_bind()
    is_sqlite = conn.dialect.name == "sqlite"
    now_sql = "datetime('now')" if is_sqlite else "NOW()"

    exists = conn.execute(
        sa.text("SELECT 1 FROM email_templates WHERE type = :t"),
        {"t": "new_booking_admin"},
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
                "type": "new_booking_admin",
                "subject": "Новая заявка на бронирование — Комплекс отдыха Парк Relax",
                "body": """<h2>Новая заявка на бронирование</h2>
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
            },
        )


def downgrade() -> None:
    """Remove new_booking_admin email template."""
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM email_templates WHERE type = :t"),
        {"t": "new_booking_admin"},
    )
