"""add_accommodation_features

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-05-28 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'accommodation_features',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('accommodationId', sa.Integer(), nullable=False),
        sa.Column('iconName', sa.String(length=100), nullable=False, server_default=''),
        sa.Column('label', sa.String(length=200), nullable=False, server_default=''),
        sa.Column('sortOrder', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('isActive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ['accommodationId'],
            ['accommodations.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_accommodation_features_id'),
        'accommodation_features',
        ['id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_accommodation_features_id'), table_name='accommodation_features')
    op.drop_table('accommodation_features')
