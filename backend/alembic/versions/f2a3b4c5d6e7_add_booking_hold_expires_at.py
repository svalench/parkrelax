"""add_booking_hold_expires_at

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-06-29 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table(table_name):
        return False
    return column_name in {col["name"] for col in inspector.get_columns(table_name)}


def upgrade() -> None:
    if not _has_column("bookings", "holdExpiresAt"):
        op.add_column("bookings", sa.Column("holdExpiresAt", sa.DateTime(), nullable=True))


def downgrade() -> None:
    if _has_column("bookings", "holdExpiresAt"):
        op.drop_column("bookings", "holdExpiresAt")
