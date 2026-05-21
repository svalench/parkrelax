"""add_banya_landing_and_show_in_listing

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-21 14:00:00.000000

"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('accommodationTypes', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('showInListing', sa.Boolean(), server_default='1', nullable=False),
        )

    op.create_table(
        'banya_page_settings',
        sa.Column('id', sa.Integer(), autoincrement=False, nullable=False),
        sa.Column('pageTitle', sa.String(length=200), nullable=False),
        sa.Column('pageSubtitle', sa.Text(), nullable=True),
        sa.Column('eyebrow', sa.String(length=100), nullable=True),
        sa.Column('ctaLabel', sa.String(length=100), nullable=True),
        sa.Column('ctaHref', sa.String(length=500), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'banya_slider',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('imageUrl', sa.Text(), nullable=True),
        sa.Column('sortOrder', sa.Integer(), nullable=False),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('banya_slider', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_banya_slider_id'), ['id'], unique=False)

    op.create_table(
        'banya_sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('eyebrow', sa.String(length=100), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('imageUrl', sa.Text(), nullable=True),
        sa.Column('chips', sa.Text(), nullable=True),
        sa.Column('sortOrder', sa.Integer(), nullable=False),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('banya_sections', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_banya_sections_id'), ['id'], unique=False)

    # Скрыть террасу с баней из блока размещения
    op.execute(
        """
        UPDATE accommodationTypes
        SET showInListing = 0
        WHERE LOWER(name) LIKE '%бан%'
           OR LOWER(name) LIKE '%террас%'
        """
    )

    chips1 = json.dumps(
        ['Русская баня на дровах', 'До 10 гостей', 'Беседка и мини-бассейн'],
        ensure_ascii=False,
    ).replace("'", "''")
    chips2 = json.dumps(
        ['Терраса у озера', 'Мини-бассейн', 'Зона для отдыха'],
        ensure_ascii=False,
    ).replace("'", "''")
    chips3 = json.dumps(
        ['Корпоративы и праздники', 'Свежий воздух Полесья', 'SPA-атмосфера'],
        ensure_ascii=False,
    ).replace("'", "''")

    op.execute(
        """
        INSERT INTO banya_page_settings
            (id, pageTitle, pageSubtitle, eyebrow, ctaLabel, ctaHref, isActive)
        VALUES
            (1,
             'Терраса с баней',
             'Большая терраса с русской баней на дровах, уютной беседкой и мини-бассейном на свежем воздухе.',
             'ОТДЫХ И РЕЛАКС',
             'Связаться',
             '/#contacts',
             1)
        """
    )

    op.execute(
        """
        INSERT INTO banya_slider (title, imageUrl, sortOrder, isActive)
        VALUES
            ('Терраса с баней', '/assets/asset_10.jpg', 0, 1),
            ('Баня на дровах', '/assets/asset_7.jpg', 1, 1),
            ('Зона отдыха', '/assets/asset_9.jpg', 2, 1)
        """
    )

    op.execute(
        f"""
        INSERT INTO banya_sections
            (eyebrow, title, description, imageUrl, chips, sortOrder, isActive)
        VALUES
            ('Баня', 'Русская баня на дровах',
             '<p>Традиционная парилка с берёзовыми вениками, предбанник и зона отдыха у воды.</p>',
             '/assets/asset_10.jpg', '{chips1}', 0, 1),
            ('Терраса', 'Просторная терраса у озера',
             '<p>Обеденная зона, мини-бассейн и вид на природу — идеально для компании и мероприятий.</p>',
             '/assets/asset_9.jpg', '{chips2}', 1, 1),
            ('Отдых', 'Релакс среди природы',
             '<p>Вечеринки, семейный отдых и корпоративы в окружении соснового леса и чистого воздуха Полесья.</p>',
             '/assets/asset_7.jpg', '{chips3}', 2, 1)
        """
    )


def downgrade() -> None:
    op.drop_table('banya_sections')
    op.drop_table('banya_slider')
    op.drop_table('banya_page_settings')
    with op.batch_alter_table('accommodationTypes', schema=None) as batch_op:
        batch_op.drop_column('showInListing')
