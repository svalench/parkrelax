"""add_payment_audit_and_settings

Revision ID: e0f1a2b3c4d5
Revises: d9e0f1a2b3c4
Create Date: 2026-06-27 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e0f1a2b3c4d5"
down_revision: Union[str, Sequence[str], None] = "d9e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return inspector.has_table(table_name)


def _columns(table_name: str) -> set[str]:
    if not _has_table(table_name):
        return set()
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {col["name"] for col in inspector.get_columns(table_name)}


def _index_names(table_name: str) -> set[str]:
    if not _has_table(table_name):
        return set()
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {idx["name"] for idx in inspector.get_indexes(table_name)}


def _seed_payment_settings() -> None:
    bind = op.get_bind()
    count = bind.execute(sa.text("SELECT COUNT(*) FROM payment_settings WHERE id = 1")).scalar() or 0
    if count:
        return
    bind.execute(
        sa.text(
            """
            INSERT INTO payment_settings
                (id, shopId, secretKey, testMode, isActive, notificationUrl, bookingPaymentMode, updatedAt)
            VALUES
                (1, NULL, NULL, 1, 0, '/api/payment/webhook', 'manual_confirmation', CURRENT_TIMESTAMP)
            """
        )
    )


def _seed_payment_admin_template() -> None:
    bind = op.get_bind()
    exists = bind.execute(
        sa.text("SELECT 1 FROM email_templates WHERE type = :type"),
        {"type": "payment_success_admin"},
    ).scalar()
    if exists:
        return

    body = """
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
""".strip()
    bind.execute(
        sa.text(
            """
            INSERT INTO email_templates (type, subject, bodyHtml, isActive, createdAt, updatedAt)
            VALUES (:type, :subject, :bodyHtml, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """
        ),
        {
            "type": "payment_success_admin",
            "subject": "Оплата бронирования №{{bookingId}} — Комплекс отдыха Парк Relax",
            "bodyHtml": body,
        },
    )


def upgrade() -> None:
    """Upgrade schema."""
    if "notifyOnPayments" not in _columns("admin_emails"):
        with op.batch_alter_table("admin_emails", schema=None) as batch_op:
            batch_op.add_column(
                sa.Column("notifyOnPayments", sa.Boolean(), nullable=False, server_default="1"),
            )

    if not _has_table("payment_settings"):
        op.create_table(
            "payment_settings",
            sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
            sa.Column("shopId", sa.String(length=255), nullable=True),
            sa.Column("secretKey", sa.String(length=255), nullable=True),
            sa.Column("testMode", sa.Boolean(), nullable=False, server_default="1"),
            sa.Column("isActive", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("notificationUrl", sa.Text(), nullable=True),
            sa.Column(
                "bookingPaymentMode",
                sa.String(length=50),
                nullable=False,
                server_default="manual_confirmation",
            ),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    _seed_payment_settings()

    if not _has_table("payments"):
        op.create_table(
            "payments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("bookingId", sa.Integer(), nullable=True),
            sa.Column("userId", sa.Integer(), nullable=True),
            sa.Column("customerName", sa.String(length=100), nullable=True),
            sa.Column("customerEmail", sa.String(length=320), nullable=True),
            sa.Column("customerPhone", sa.String(length=50), nullable=True),
            sa.Column("amountMinor", sa.Integer(), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False, server_default="BYN"),
            sa.Column("provider", sa.String(length=50), nullable=False, server_default="bepaid"),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="created"),
            sa.Column(
                "bookingPaymentMode",
                sa.String(length=50),
                nullable=False,
                server_default="manual_confirmation",
            ),
            sa.Column("trackingId", sa.String(length=120), nullable=True),
            sa.Column("checkoutToken", sa.String(length=255), nullable=True),
            sa.Column("redirectUrl", sa.Text(), nullable=True),
            sa.Column("transactionId", sa.String(length=255), nullable=True),
            sa.Column("providerStatus", sa.String(length=100), nullable=True),
            sa.Column("responsePayload", sa.Text(), nullable=True),
            sa.Column("createdByType", sa.String(length=50), nullable=False, server_default="guest"),
            sa.Column("createdByUserId", sa.Integer(), nullable=True),
            sa.Column("createdByAdminId", sa.Integer(), nullable=True),
            sa.Column("requestIp", sa.String(length=64), nullable=True),
            sa.Column("userAgent", sa.Text(), nullable=True),
            sa.Column("errorMessage", sa.Text(), nullable=True),
            sa.Column("customerEmailSentAt", sa.DateTime(), nullable=True),
            sa.Column("adminEmailSentAt", sa.DateTime(), nullable=True),
            sa.Column("paidAt", sa.DateTime(), nullable=True),
            sa.Column("lastWebhookAt", sa.DateTime(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["bookingId"], ["bookings.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["createdByAdminId"], ["admins.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["createdByUserId"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["userId"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("trackingId", name="uq_payments_tracking_id"),
            sa.UniqueConstraint("checkoutToken", name="uq_payments_checkout_token"),
            sa.UniqueConstraint("transactionId", name="uq_payments_transaction_id"),
        )

    for index_name, columns in {
        "ix_payments_id": ["id"],
        "ix_payments_booking_id": ["bookingId"],
        "ix_payments_user_id": ["userId"],
        "ix_payments_status": ["status"],
        "ix_payments_created_at": ["createdAt"],
    }.items():
        if index_name not in _index_names("payments"):
            op.create_index(index_name, "payments", columns, unique=False)

    if not _has_table("payment_events"):
        op.create_table(
            "payment_events",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("paymentId", sa.Integer(), nullable=False),
            sa.Column("eventType", sa.String(length=50), nullable=False),
            sa.Column("providerStatus", sa.String(length=100), nullable=True),
            sa.Column("payloadJson", sa.Text(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["paymentId"], ["payments.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    for index_name, columns in {
        "ix_payment_events_id": ["id"],
        "ix_payment_events_payment_id": ["paymentId"],
        "ix_payment_events_created_at": ["createdAt"],
    }.items():
        if index_name not in _index_names("payment_events"):
            op.create_index(index_name, "payment_events", columns, unique=False)

    _seed_payment_admin_template()


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    bind.execute(sa.text("DELETE FROM email_templates WHERE type = :type"), {"type": "payment_success_admin"})

    if _has_table("payment_events"):
        op.drop_table("payment_events")
    if _has_table("payments"):
        op.drop_table("payments")
    if _has_table("payment_settings"):
        op.drop_table("payment_settings")

    if "notifyOnPayments" in _columns("admin_emails"):
        with op.batch_alter_table("admin_emails", schema=None) as batch_op:
            batch_op.drop_column("notifyOnPayments")
