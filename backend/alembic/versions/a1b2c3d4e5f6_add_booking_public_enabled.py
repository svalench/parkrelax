"""add_booking_public_enabled_to_site_settings

Revision ID: a1b2c3d4e5f6
Revises: ba2566789d10
Create Date: 2026-05-21 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ba2566789d10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('siteSettings', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'bookingPublicEnabled',
                sa.Boolean(),
                server_default='0',
                nullable=False,
            ),
        )


def downgrade() -> None:
    with op.batch_alter_table('siteSettings', schema=None) as batch_op:
        batch_op.drop_column('bookingPublicEnabled')
