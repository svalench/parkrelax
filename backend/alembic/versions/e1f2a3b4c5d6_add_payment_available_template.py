"""add_payment_available_template

Revision ID: e1f2a3b4c5d6
Revises: e0f1a2b3c4d5
Create Date: 2026-06-27 11:21:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "e0f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    exists = bind.execute(
        sa.text("SELECT 1 FROM email_templates WHERE type = :type"),
        {"type": "payment_available"},
    ).scalar()
    if exists:
        return

    body = """
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
""".strip()

    bind.execute(
        sa.text(
            """
            INSERT INTO email_templates (type, subject, bodyHtml, isActive, createdAt, updatedAt)
            VALUES (:type, :subject, :bodyHtml, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """
        ),
        {
            "type": "payment_available",
            "subject": "Оплата бронирования №{{bookingId}} доступна — Комплекс отдыха Парк Relax",
            "bodyHtml": body,
        },
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.get_bind().execute(
        sa.text("DELETE FROM email_templates WHERE type = :type"),
        {"type": "payment_available"},
    )
