"""sync_public_offer_requisites

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-06-08 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

REQUISITES_HTML = """<h2>РЕКВИЗИТЫ ИСПОЛНИТЕЛЯ</h2>
<p>Общество с ограниченной ответственностью «ПриватСтандарт»</p>
<p>Юридический  адрес: 220036, г. Минск, проезд Бетонный, д. 17, каб. 11</p>
<p>Почтовый адрес: 220030, г. Минск, ул.Октябрьская, д. 19Б, каб. 101</p>
<p>УНП: 192803799</p>
<p>Р/с: BY03BAPB30128903300100000000</p>
<p>Банк: ОАО «Белагропромбанк», Минск, пр-т Победителей, 119-492</p>
<p>Телефон: +375 (17) 390-19-50</p>
<p>E- mail: office@parkrelax.by</p>"""


def upgrade() -> None:
    """Синхронизировать блок реквизитов в public-offer."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not inspector.has_table("legal_pages"):
        return

    row = conn.execute(
        sa.text("SELECT content FROM legal_pages WHERE slug = :slug"),
        {"slug": "public-offer"},
    ).fetchone()
    if not row or not row[0]:
        return

    content = row[0]
    marker = "<h2>РЕКВИЗИТЫ ИСПОЛНИТЕЛЯ</h2>"
    if marker in content:
        content = content.split(marker, 1)[0].rstrip() + REQUISITES_HTML
    else:
        content = content.rstrip() + REQUISITES_HTML

    conn.execute(
        sa.text("UPDATE legal_pages SET content = :content WHERE slug = :slug"),
        {"content": content, "slug": "public-offer"},
    )


def downgrade() -> None:
    """Откат не выполняется — предыдущая редакция реквизитов не сохраняется."""
    pass
