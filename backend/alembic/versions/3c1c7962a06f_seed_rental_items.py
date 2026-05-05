"""seed_rental_items

Revision ID: 3c1c7962a06f
Revises: 79b986888d98
Create Date: 2026-05-05 21:41:03.008661

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c1c7962a06f'
down_revision: Union[str, Sequence[str], None] = '79b986888d98'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed rental items."""
    op.bulk_insert(
        sa.table(
            'rental_items',
            sa.column('title', sa.String(200)),
            sa.column('info', sa.String(200)),
            sa.column('badge', sa.String(100)),
            sa.column('badgeColor', sa.String(100)),
            sa.column('eyebrow', sa.String(100)),
            sa.column('description', sa.Text),
            sa.column('duration', sa.String(100)),
            sa.column('capacity', sa.String(100)),
            sa.column('imageUrl', sa.Text),
            sa.column('isActive', sa.Boolean),
            sa.column('sortOrder', sa.Integer),
        ),
        [
            {
                'title': 'Катамаран',
                'info': 'До 4 человек',
                'badge': 'Вода',
                'badgeColor': 'bg-[rgba(30,96,145,0.82)] text-[#caf0f8]',
                'eyebrow': 'Водный спорт',
                'description': 'Прогулки по озеру на комфортабельном катамаране. Идеально для семейного отдыха и романтических прогулок на закате.',
                'duration': '1–2 часа',
                'capacity': 'до 4 чел.',
                'imageUrl': '/assets/catamaran.webp',
                'isActive': True,
                'sortOrder': 0,
            },
            {
                'title': 'Лодка с веслами',
                'info': 'До 3 человек',
                'badge': 'Рыбалка',
                'badgeColor': 'bg-[rgba(45,106,79,0.82)] text-[#d8f3dc]',
                'eyebrow': 'Спокойствие',
                'description': 'Тихая гребля по заливам и заливчикам озера. Отличный способ расслабиться и половить рыбу в уединённых местах.',
                'duration': 'от 1 часа',
                'capacity': 'до 3 чел.',
                'imageUrl': '/assets/beach_.webp',
                'isActive': True,
                'sortOrder': 1,
            },
            {
                'title': 'Велосипед',
                'info': 'Почасовой прокат',
                'badge': 'Спорт',
                'badgeColor': 'bg-[rgba(231,111,81,0.82)] text-[#fff1ec]',
                'eyebrow': 'Активный отдых',
                'description': 'Велосипеды для взрослых и детей. Катайтесь по лесным тропам и береговой линии, наслаждаясь природой.',
                'duration': 'почасово',
                'capacity': '1 чел.',
                'imageUrl': '/assets/asset_13.jpg',
                'isActive': True,
                'sortOrder': 2,
            },
            {
                'title': 'SUP-доски',
                'info': 'Активный отдых',
                'badge': 'Актив',
                'badgeColor': 'bg-[rgba(123,45,139,0.82)] text-[#f3e8ff]',
                'eyebrow': 'Баланс',
                'description': 'SUP-бординг для новичков и опытных. Укрепляйте корпус, наслаждайтесь видами и освежающими купаниями.',
                'duration': 'от 1 часа',
                'capacity': '1 чел.',
                'imageUrl': '/assets/asset_14.jpg',
                'isActive': True,
                'sortOrder': 3,
            },
        ]
    )


def downgrade() -> None:
    """Remove seeded rental items."""
    op.execute("DELETE FROM rental_items WHERE title IN ('Катамаран', 'Лодка с веслами', 'Велосипед', 'SUP-доски')")
