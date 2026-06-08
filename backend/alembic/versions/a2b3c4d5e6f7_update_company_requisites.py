"""update_company_requisites

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-06-08 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PUBLIC_OFFER_REQUISITES_FIX = (
    ("<h2>УНП:", "<p>УНП:"),
    ("</h2>\n<p>Р/с:", "</p>\n<p>Р/с:"),
    ("<h2>Р/с:", "<p>Р/с:"),
    ("E- mail:", "E-mail:"),
)


def upgrade() -> None:
    """Обновить реквизиты в public-offer и контактах."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if inspector.has_table("legal_pages"):
        row = conn.execute(
            sa.text("SELECT content FROM legal_pages WHERE slug = :slug"),
            {"slug": "public-offer"},
        ).fetchone()
        if row and row[0]:
            content = row[0]
            for old, new in PUBLIC_OFFER_REQUISITES_FIX:
                content = content.replace(old, new)
            content = content.replace("<h2>УНП:", "<p>УНП:").replace(
                "192803799</h2>", "192803799</p>"
            )
            content = content.replace("<h2>Р/с:", "<p>Р/с:").replace(
                "BY03BAPB30128903300100000000</h2>",
                "BY03BAPB30128903300100000000</p>",
            )
            conn.execute(
                sa.text("UPDATE legal_pages SET content = :content WHERE slug = :slug"),
                {"content": content, "slug": "public-offer"},
            )

    if inspector.has_table("phone_numbers"):
        conn.execute(
            sa.text("""
                UPDATE phone_numbers
                SET number = :new_phone
                WHERE number LIKE '%500-50-29%'
                   OR number LIKE '%5005029%'
                   OR REPLACE(REPLACE(REPLACE(number, ' ', ''), '(', ''), ')', '') LIKE '%295005029%'
            """),
            {"new_phone": "+375 (17) 390-19-50"},
        )

    if inspector.has_table("email_addresses"):
        conn.execute(
            sa.text("""
                UPDATE email_addresses
                SET email = :new_email
                WHERE email IN (
                    'email@parkrelax.by',
                    'info@parkrelax.by',
                    'park_office@mail.ru',
                    'privat_office@mail.ru'
                )
            """),
            {"new_email": "office@parkrelax.by"},
        )


def downgrade() -> None:
    """Откат контактов (контент public-offer не восстанавливаем)."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if inspector.has_table("phone_numbers"):
        conn.execute(
            sa.text("""
                UPDATE phone_numbers
                SET number = :old_phone
                WHERE number = :new_phone
            """),
            {
                "old_phone": "+375 (29) 500-50-29",
                "new_phone": "+375 (17) 390-19-50",
            },
        )

    if inspector.has_table("email_addresses"):
        conn.execute(
            sa.text("""
                UPDATE email_addresses
                SET email = :old_email
                WHERE email = :new_email
            """),
            {
                "old_email": "email@parkrelax.by",
                "new_email": "office@parkrelax.by",
            },
        )
