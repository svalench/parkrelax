"""add_preset_id_to_accommodation_features

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-06-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f7a8b9c0d1e2'
down_revision: Union[str, Sequence[str], None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _feature_columns() -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {c['name'] for c in inspector.get_columns('accommodation_features')}


def _index_exists(name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return name in {idx['name'] for idx in inspector.get_indexes('accommodation_features')}


def upgrade() -> None:
    existing = _feature_columns()
    if 'presetId' not in existing:
        with op.batch_alter_table('accommodation_features', schema=None) as batch_op:
            batch_op.add_column(sa.Column('presetId', sa.Integer(), nullable=True))
            batch_op.create_foreign_key(
                'fk_accommodation_features_preset_id',
                'accommodation_feature_presets',
                ['presetId'],
                ['id'],
                ondelete='SET NULL',
            )

    if not _index_exists('ix_accommodation_features_accommodation_preset'):
        op.create_index(
            'ix_accommodation_features_accommodation_preset',
            'accommodation_features',
            ['accommodationId', 'presetId'],
            unique=False,
        )


def downgrade() -> None:
    if _index_exists('ix_accommodation_features_accommodation_preset'):
        op.drop_index(
            'ix_accommodation_features_accommodation_preset',
            table_name='accommodation_features',
        )

    existing = _feature_columns()
    if 'presetId' in existing:
        with op.batch_alter_table('accommodation_features', schema=None) as batch_op:
            batch_op.drop_constraint(
                'fk_accommodation_features_preset_id',
                type_='foreignkey',
            )
            batch_op.drop_column('presetId')
