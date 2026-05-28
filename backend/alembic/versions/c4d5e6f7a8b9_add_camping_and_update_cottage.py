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


def upgrade() -> None:
    with op.batch_alter_table('accommodationTypes', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('pricingModel', sa.String(length=20), nullable=False, server_default='per_night'),
        )
        batch_op.add_column(
            sa.Column('childPricePerNight', sa.Integer(), nullable=True),
        )

    # Убираем «с камином» из описания коттеджа
    op.execute(
        """
        UPDATE accommodationTypes
        SET description = REPLACE(description, 'с камином, ', '')
        WHERE name = 'Коттедж'
        """
    )
    op.execute(
        """
        UPDATE accommodations
        SET description = REPLACE(description, 'с камином, ', '')
        WHERE LOWER(name) LIKE '%коттедж%' AND description IS NOT NULL
        """
    )

    camping_desc = CAMPING_DESCRIPTION.replace("'", "''")
    op.execute(
        f"""
        REPLACE INTO accommodationTypes (
            id, name, description, capacity, pricePerNight, priceUnit,
            pricingModel, childPricePerNight, imageUrl, isActive,
            showInListing, sortOrder
        )
        VALUES (
            5,
            'Кемпинг',
            '{camping_desc}',
            50,
            25,
            'чел/сутки',
            'per_person',
            15,
            '/assets/asset_3.webp',
            1,
            1,
            4
        )
        """
    )

    op.execute(
        f"""
        INSERT INTO accommodations (
            name, description, typeId, imageUrl, capacity,
            pricePerNight, isActive, showOnMain, sortOrder
        )
        SELECT
            'Кемпинг',
            '{camping_desc}',
            5,
            '/assets/asset_3.webp',
            50,
            25,
            1,
            0,
            0
        WHERE NOT EXISTS (
            SELECT 1 FROM accommodations WHERE typeId = 5
        )
        """
    )


def downgrade() -> None:
    op.execute('DELETE FROM accommodations WHERE typeId = 5')
    op.execute('DELETE FROM accommodationTypes WHERE id = 5')
    cottage_desc = (
        'Просторный двухэтажный коттедж с камином, террасой и панорамными окнами. '
        'Идеально для большой компании или семейного праздника.'
    ).replace("'", "''")
    op.execute(
        f"""
        UPDATE accommodationTypes
        SET description = '{cottage_desc}'
        WHERE name = 'Коттедж'
        """
    )
    with op.batch_alter_table('accommodationTypes', schema=None) as batch_op:
        batch_op.drop_column('childPricePerNight')
        batch_op.drop_column('pricingModel')
