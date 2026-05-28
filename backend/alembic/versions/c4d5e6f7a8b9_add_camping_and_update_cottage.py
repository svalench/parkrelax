"""add_camping_and_update_cottage

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-05-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CAMPING_DESCRIPTION = (
    '<p>Проживание в собственной палатке на территории в установленном месте. '
    'Стоимость с человека: взрослые — 25 руб/сутки, дети 3–12 лет — 15 руб/сутки. '
    'Максимум 50 человек (взрослые+дети) в сутки.</p>'
)

COTTEDJ_DESCRIPTION = (
    'Просторный двухэтажный коттедж с террасой и панорамными окнами. '
    'Идеально для большой компании или семейного праздника.'
)


def upgrade() -> None:
    op.add_column(
        'accommodationTypes',
        sa.Column('pricingModel', sa.String(length=20), nullable=False, server_default='per_night'),
    )
    op.add_column(
        'accommodationTypes',
        sa.Column('childPricePerNight', sa.Integer(), nullable=True),
    )

    # Убираем «с камином» из описания коттеджа
    op.execute(
        sa.text(
            """
            UPDATE "accommodationTypes"
            SET description = REPLACE(description, 'с камином, ', '')
            WHERE name = 'Коттедж'
            """
        )
    )
    op.execute(
        sa.text(
            """
            UPDATE accommodations
            SET description = REPLACE(description, 'с камином, ', '')
            WHERE name ILIKE '%коттедж%' AND description IS NOT NULL
            """
        )
    )

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO "accommodationTypes" (
                id, name, description, capacity, "pricePerNight", "priceUnit",
                "pricingModel", "childPricePerNight", "imageUrl", "isActive",
                "showInListing", "sortOrder"
            )
            VALUES (
                5,
                'Кемпинг',
                :description,
                50,
                25,
                'чел/сутки',
                'per_person',
                15,
                '/assets/asset_3.webp',
                true,
                true,
                4
            )
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {'description': CAMPING_DESCRIPTION},
    )

    conn.execute(
        sa.text(
            """
            INSERT INTO accommodations (
                name, description, "typeId", "imageUrl", capacity,
                "pricePerNight", "isActive", "showOnMain", "sortOrder"
            )
            SELECT
                'Кемпинг',
                :description,
                5,
                '/assets/asset_3.webp',
                50,
                25,
                true,
                false,
                0
            WHERE NOT EXISTS (
                SELECT 1 FROM accommodations WHERE "typeId" = 5
            )
            """
        ),
        {'description': CAMPING_DESCRIPTION},
    )


def downgrade() -> None:
    op.execute(sa.text('DELETE FROM accommodations WHERE "typeId" = 5'))
    op.execute(sa.text('DELETE FROM "accommodationTypes" WHERE id = 5'))
    op.execute(
        sa.text(
            """
            UPDATE "accommodationTypes"
            SET description = :description
            WHERE name = 'Коттедж'
            """
        ),
        {
            'description': (
                'Просторный двухэтажный коттедж с камином, террасой и панорамными окнами. '
                'Идеально для большой компании или семейного праздника.'
            ),
        },
    )
    op.drop_column('accommodationTypes', 'childPricePerNight')
    op.drop_column('accommodationTypes', 'pricingModel')
