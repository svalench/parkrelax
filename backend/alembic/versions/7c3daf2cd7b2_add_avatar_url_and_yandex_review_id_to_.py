"""add avatar_url and yandex_review_id to reviews

Revision ID: 7c3daf2cd7b2
Revises: 7fe27dfe98d5
Create Date: 2026-05-04 22:24:14.912742

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c3daf2cd7b2'
down_revision: Union[str, Sequence[str], None] = '7fe27dfe98d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.add_column(sa.Column('avatarUrl', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('yandexReviewId', sa.String(length=100), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.drop_column('yandexReviewId')
        batch_op.drop_column('avatarUrl')
