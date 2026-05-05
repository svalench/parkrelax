"""seed_accommodation_types

Revision ID: 5a14d69947ad
Revises: 3c1c7962a06f
Create Date: 2026-05-05 21:48:55.903109

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a14d69947ad'
down_revision: Union[str, Sequence[str], None] = '3c1c7962a06f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed accommodation types with descriptions, images and prices."""
    op.execute("""
    INSERT OR REPLACE INTO accommodationTypes (id, name, description, capacity, pricePerNight, imageUrl, isActive, sortOrder)
    VALUES
    (1, 'Коттедж', 'Просторный двухэтажный коттедж с камином, террасой и панорамными окнами. Идеально для большой компании или семейного праздника.', 8, 15000, '/assets/asset_7.jpg', 1, 0),
    (2, 'Апартаменты', 'Современные апартаменты с балконом, полностью оборудованной кухней и уютной гостиной. Комфорт как дома, но среди природы.', 4, 8000, '/assets/asset_8.jpg', 1, 1),
    (3, 'Летние домики', 'Уютные A-образные домики у озера с террасой и видом на воду. Идеальный выбор для романтического getaway или тихого отдыха.', 6, 10000, '/assets/asset_9.jpg', 1, 2),
    (4, 'Терраса с баней и мини бассейном', 'Большая терраса с русской баней, мини-бассейном и обеденной зоной. Отличное место для вечеринок и корпоративного отдыха.', 10, 20000, '/assets/asset_10.jpg', 1, 3);
    """)


def downgrade() -> None:
    """Remove seeded accommodation types."""
    op.execute("DELETE FROM accommodationTypes WHERE id IN (1, 2, 3, 4)")
