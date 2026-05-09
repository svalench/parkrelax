"""add price list

Revision ID: 0d8f3e2a1b4c
Revises: bdd70b782cd4
Create Date: 2026-05-09 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0d8f3e2a1b4c'
down_revision: Union[str, Sequence[str], None] = 'bdd70b782cd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('price_list_data',
        sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('data', sa.Text(), nullable=False),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_price_list_data_id'), 'price_list_data', ['id'], unique=False)

    # Insert default empty row
    price_list_table = sa.table(
        'price_list_data',
        sa.column('id', sa.Integer),
        sa.column('data', sa.Text),
    )
    op.bulk_insert(price_list_table, [
        {"id": 1, "data": "[]"},
    ])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_price_list_data_id'), table_name='price_list_data')
    op.drop_table('price_list_data')
