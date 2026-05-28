"""add_accommodation_feature_presets

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-05-28 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'accommodation_feature_presets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_accommodation_feature_presets_id'),
        'accommodation_feature_presets',
        ['id'],
        unique=False,
    )

    op.create_table(
        'accommodation_feature_preset_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('presetId', sa.Integer(), nullable=False),
        sa.Column('iconName', sa.String(length=100), nullable=False, server_default=''),
        sa.Column('label', sa.String(length=200), nullable=False, server_default=''),
        sa.Column('sortOrder', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('isActive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ['presetId'],
            ['accommodation_feature_presets.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_accommodation_feature_preset_items_id'),
        'accommodation_feature_preset_items',
        ['id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f('ix_accommodation_feature_preset_items_id'),
        table_name='accommodation_feature_preset_items',
    )
    op.drop_table('accommodation_feature_preset_items')
    op.drop_index(
        op.f('ix_accommodation_feature_presets_id'),
        table_name='accommodation_feature_presets',
    )
    op.drop_table('accommodation_feature_presets')
