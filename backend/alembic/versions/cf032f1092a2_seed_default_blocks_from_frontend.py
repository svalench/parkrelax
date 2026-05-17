"""seed_default_blocks_from_frontend

Revision ID: cf032f1092a2
Revises: 312ca13b4ab5
Create Date: 2026-05-17 17:15:07.815084

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf032f1092a2'
down_revision: Union[str, Sequence[str], None] = '312ca13b4ab5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ACCOMMODATION_TYPES = [
    {
        'id': 1,
        'name': 'Коттедж',
        'description': 'Просторный двухэтажный коттедж с камином, террасой и панорамными окнами. Идеально для большой компании или семейного праздника.',
        'capacity': 8,
        'pricePerNight': 8500,
        'priceUnit': 'ночь',
        'imageUrl': '/assets/asset_7.jpg',
        'isActive': True,
        'sortOrder': 0,
    },
    {
        'id': 2,
        'name': 'Апартаменты',
        'description': 'Современные апартаменты с балконом, полностью оборудованной кухней и уютной гостиной. Комфорт как дома, но среди природы.',
        'capacity': 4,
        'pricePerNight': 5200,
        'priceUnit': 'ночь',
        'imageUrl': '/assets/asset_8.jpg',
        'isActive': True,
        'sortOrder': 1,
    },
    {
        'id': 3,
        'name': 'Летние домики',
        'description': 'Уютные A-образные домики у озера с террасой и видом на воду. Идеальный выбор для романтического getaway или тихого отдыха.',
        'capacity': 6,
        'pricePerNight': 4800,
        'priceUnit': 'ночь',
        'imageUrl': '/assets/asset_9.jpg',
        'isActive': True,
        'sortOrder': 2,
    },
    {
        'id': 4,
        'name': 'Терраса с баней',
        'description': 'Большая терраса с русской баней, мини-бассейном и обеденной зоной. Отличное место для вечеринок и корпоративного отдыха.',
        'capacity': 10,
        'pricePerNight': 12000,
        'priceUnit': 'ночь',
        'imageUrl': '/assets/asset_10.jpg',
        'isActive': True,
        'sortOrder': 3,
    },
]

RENTAL_ITEMS = [
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


def upgrade() -> None:
    """Seed default accommodation types and rental items from former frontend fallbacks."""
    conn = op.get_bind()

    # --- accommodationTypes ---
    for row in ACCOMMODATION_TYPES:
        conn.execute(
            sa.text("""
                INSERT OR REPLACE INTO accommodationTypes
                (id, name, description, capacity, pricePerNight, priceUnit, imageUrl, isActive, sortOrder)
                VALUES (:id, :name, :description, :capacity, :pricePerNight, :priceUnit, :imageUrl, :isActive, :sortOrder)
            """),
            row,
        )

    # --- rental_items ---
    # Remove old defaults first to avoid duplicates (title is not unique)
    titles = [r['title'] for r in RENTAL_ITEMS]
    placeholders = ', '.join(f"'{t}'" for t in titles)
    conn.execute(sa.text(f"DELETE FROM rental_items WHERE title IN ({placeholders})"))
    conn.execute(
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
        ).insert(),
        RENTAL_ITEMS,
    )


def downgrade() -> None:
    """Remove seeded default blocks."""
    conn = op.get_bind()

    # accommodationTypes
    conn.execute(
        sa.text("DELETE FROM accommodationTypes WHERE id IN :ids"),
        {'ids': tuple(r['id'] for r in ACCOMMODATION_TYPES)},
    )

    # rental_items
    titles = [r['title'] for r in RENTAL_ITEMS]
    placeholders = ', '.join(f"'{t}'" for t in titles)
    conn.execute(sa.text(f"DELETE FROM rental_items WHERE title IN ({placeholders})"))
