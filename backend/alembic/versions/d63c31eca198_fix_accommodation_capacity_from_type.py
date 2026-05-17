"""fix_accommodation_capacity_from_type

Revision ID: d63c31eca198
Revises: 618a257ca346
Create Date: 2026-05-17 20:12:01.474571

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd63c31eca198'
down_revision: Union[str, Sequence[str], None] = '618a257ca346'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set accommodation capacity from its type where capacity is 0."""
    op.execute("""
        UPDATE accommodations
        SET capacity = (
            SELECT capacity FROM accommodationTypes WHERE accommodationTypes.id = accommodations.typeId
        )
        WHERE capacity = 0
    """)


def downgrade() -> None:
    """Downgrade is a no-op; we can't safely revert capacity values."""
    pass
