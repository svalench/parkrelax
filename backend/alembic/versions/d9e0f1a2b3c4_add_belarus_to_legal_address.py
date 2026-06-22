"""add_belarus_to_legal_address

Revision ID: d9e0f1a2b3c4
Revises: c8d9e0f1a2b3
Create Date: 2026-06-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, Sequence[str], None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_LEGAL_ADDRESS = "220036, г. Минск, проезд Бетонный, д. 17, каб. 11"
NEW_LEGAL_ADDRESS = "Республика Беларусь, 220036, г. Минск, проезд Бетонный, д. 17, каб. 11"


def upgrade() -> None:
    """Добавить «Республика Беларусь» в юридический адрес на юридических страницах."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table("legal_pages"):
        return

    rows = conn.execute(sa.text("SELECT id, content FROM legal_pages")).fetchall()
    for row in rows:
        content = row[1]
        if not content or NEW_LEGAL_ADDRESS in content:
            continue
        if OLD_LEGAL_ADDRESS not in content:
            continue
        conn.execute(
            sa.text("UPDATE legal_pages SET content = :content WHERE id = :id"),
            {"content": content.replace(OLD_LEGAL_ADDRESS, NEW_LEGAL_ADDRESS), "id": row[0]},
        )


def downgrade() -> None:
    """Убрать «Республика Беларусь» из юридического адреса."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table("legal_pages"):
        return

    rows = conn.execute(sa.text("SELECT id, content FROM legal_pages")).fetchall()
    for row in rows:
        content = row[1]
        if not content or NEW_LEGAL_ADDRESS not in content:
            continue
        conn.execute(
            sa.text("UPDATE legal_pages SET content = :content WHERE id = :id"),
            {"content": content.replace(NEW_LEGAL_ADDRESS, OLD_LEGAL_ADDRESS), "id": row[0]},
        )
