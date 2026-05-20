"""add_amenities_tables

Revision ID: ba2566789d10
Revises: 0b7b6166424d
Create Date: 2026-05-20 14:21:58.220596

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba2566789d10'
down_revision: Union[str, Sequence[str], None] = '0b7b6166424d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create tables
    op.create_table(
        'amenity_sections',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('label', sa.String(100), nullable=False, server_default='УДОБСТВА'),
        sa.Column('title', sa.String(500), nullable=False, server_default=''),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'amenity_quick_tags',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('iconName', sa.String(100), nullable=False, server_default=''),
        sa.Column('label', sa.String(200), nullable=False, server_default=''),
        sa.Column('link', sa.String(500), nullable=False, server_default='/prices'),
        sa.Column('sortOrder', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('isActive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'amenity_categories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('iconName', sa.String(100), nullable=False, server_default=''),
        sa.Column('title', sa.String(200), nullable=False, server_default=''),
        sa.Column('sortOrder', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('isActive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
    )

    op.create_table(
        'amenity_items',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('categoryId', sa.Integer(), sa.ForeignKey('amenity_categories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False, server_default=''),
        sa.Column('link', sa.String(500), nullable=False, server_default='/prices'),
        sa.Column('sortOrder', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('isActive', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
    )

    # Data migration
    conn = op.get_bind()
    now = datetime.utcnow()

    # Section
    conn.execute(
        sa.text("""
            INSERT INTO amenity_sections (id, label, title, description, updatedAt)
            VALUES (1, :label, :title, :description, :now)
        """),
        {
            'label': 'УДОБСТВА',
            'title': 'Всё для комфортного отдыха: инфраструктура Комплекса отдыха Парк Relax',
            'description': (
                'На территории базы отдыха в Пинском районе есть всё необходимое: '
                'от <strong class="text-dark font-medium">бани на дровах</strong> и '
                '<strong class="text-dark font-medium">бассейна на улице</strong> до '
                '<strong class="text-dark font-medium">проката лодок</strong>, '
                '<strong class="text-dark font-medium">собственного пляжа</strong> и '
                '<strong class="text-dark font-medium">детской площадки</strong>. '
                'Рыбалка, велосипеды, мангалы, спутниковое TV — отдыхайте с комфортом среди природы.'
            ),
            'now': now,
        }
    )

    # Quick tags
    quick_tags = [
        ('Waves', 'Бассейн'),
        ('Flame', 'Баня и сауна'),
        ('Wifi', 'Wi-Fi'),
        ('Umbrella', 'Собственный пляж'),
        ('Car', 'Парковка'),
        ('Baby', 'Детская площадка'),
        ('Fish', 'Рыбалка'),
        ('Ship', 'Прокат лодок'),
        ('Bike', 'Велосипеды'),
        ('UtensilsCrossed', 'Мангал'),
        ('Refrigerator', 'Холодильник'),
        ('Tv', 'TV'),
        ('PawPrint', 'Можно с животными'),
    ]
    for idx, (icon, label) in enumerate(quick_tags):
        conn.execute(
            sa.text("""
                INSERT INTO amenity_quick_tags (iconName, label, link, sortOrder, isActive, createdAt, updatedAt)
                VALUES (:iconName, :label, '/prices', :sortOrder, 1, :now, :now)
            """),
            {'iconName': icon, 'label': label, 'sortOrder': idx, 'now': now}
        )

    # Categories
    categories = [
        ('Home', 'Инфраструктура'),
        ('Bed', 'Размещение'),
        ('CircleCheck', 'Для гостей'),
        ('PartyPopper', 'Активный отдых'),
        ('Bike', 'Спорт'),
        ('Flame', 'Здоровье и SPA'),
        ('Droplets', 'Услуги'),
        ('Anchor', 'Дополнительно'),
    ]
    cat_ids = {}
    for idx, (icon, title) in enumerate(categories):
        cat_id = idx + 1
        conn.execute(
            sa.text("""
                INSERT INTO amenity_categories (id, iconName, title, sortOrder, isActive, createdAt, updatedAt)
                VALUES (:id, :iconName, :title, :sortOrder, 1, :now, :now)
            """),
            {'id': cat_id, 'iconName': icon, 'title': title, 'sortOrder': idx, 'now': now},
        )
        cat_ids[title] = cat_id

    # Items by category
    items_data = {
        'Инфраструктура': [
            'Бассейн', 'Мангал', 'Беседка', 'Водоём для купания', 'Баня', 'Сауна',
            'Wi-Fi', 'TV', 'Холодильник', 'Телефон', 'Детская площадка', 'Отопление', 'Собственный пляж',
        ],
        'Размещение': [
            'Коттедж', 'Домик', 'Треугольный домик', '2-местные номера',
            '3-местные номера', '4-местные номера',
        ],
        'Для гостей': [
            'Оплата картой', 'Парковка', 'Можно с детьми', 'Можно с животными',
        ],
        'Активный отдых': [
            'Рыбалка', 'Для корпоратива', 'Для вечеринки', 'На День Рождения',
            'Прокат лодок', 'Беседка', 'Интернет', 'Мангал', 'Спутниковое TV',
        ],
        'Спорт': [
            'Велосипеды', 'Рыбалка', 'Спортивная площадка',
        ],
        'Здоровье и SPA': [
            'Баня на дровах', 'Бассейн на улице', 'Русская парная', 'Сауна', 'Душ',
        ],
        'Услуги': [
            'Детская площадка', 'Душ', 'Телефон',
        ],
        'Дополнительно': [
            'Водоём', 'Лодочная станция', 'Пляж',
        ],
    }

    for cat_title, items in items_data.items():
        cat_id = cat_ids[cat_title]
        for idx, item_title in enumerate(items):
            conn.execute(
                sa.text("""
                    INSERT INTO amenity_items (categoryId, title, link, sortOrder, isActive, createdAt, updatedAt)
                    VALUES (:categoryId, :title, '/prices', :sortOrder, 1, :now, :now)
                """),
                {'categoryId': cat_id, 'title': item_title, 'sortOrder': idx, 'now': now}
            )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('amenity_items')
    op.drop_table('amenity_categories')
    op.drop_table('amenity_quick_tags')
    op.drop_table('amenity_sections')
