#!/usr/bin/env python3
"""Генерация Alembic-миграции с контентом юридических страниц из .doc."""

from __future__ import annotations

import html
import re
import subprocess
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parents[2] / "docs"
OUTPUT = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "f1a2b3c4d5e6_update_legal_pages_from_docs.py"

PAGES = [
    {
        "slug": "public-offer",
        "title": "Публичный договор",
        "doc": "Публичный договор ПриватСтандарт КО 26-29.05.2026.doc",
    },
    {
        "slug": "accommodation-rules",
        "title": "Правила проживания",
        "doc": "Правила проживания КО 26.doc",
    },
    {
        "slug": "stay-rules",
        "title": "Правила пребывания",
        "doc": "Правила пребывания КО 26.doc",
    },
    {
        "slug": "banya-stay-rules",
        "title": "Правила пребывания — БАНЯ",
        "doc": "Правила пребывания - БАНЯ КО 26.doc",
    },
]

NEW_SLUGS = ["accommodation-rules", "stay-rules", "banya-stay-rules"]

SKIP_PATTERNS = (
    re.compile(r"УТВЕРЖДЕНО"),
    re.compile(r"^Приказ"),
    re.compile(r"^от \d"),
    re.compile(r"В\.В\. Васильченко"),
    re.compile(r"^управляющей организации"),
    re.compile(r"^ООО «Приват"),
)


def doc_to_text(doc_path: Path) -> str:
    result = subprocess.run(
        ["textutil", "-convert", "txt", "-stdout", str(doc_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def is_section_header(line: str) -> bool:
    stripped = line.strip()
    if not stripped or len(stripped) > 150:
        return False
    if stripped.endswith(":") and len(stripped) < 100:
        return True
    upper_part = re.sub(r"^\d+\.?\s*", "", stripped)
    letters = [c for c in upper_part if c.isalpha()]
    if not letters:
        return False
    upper_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
    return upper_ratio > 0.85 and len(upper_part) > 8


def text_to_html(text: str) -> str:
    parts: list[str] = []
    in_list = False
    started = False

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            if in_list:
                parts.append("</ul>")
                in_list = False
            continue

        if not started:
            if any(p.search(line) for p in SKIP_PATTERNS):
                continue
            if line.startswith("г.") and len(line) < 20:
                continue

        started = True

        if is_section_header(line):
            if in_list:
                parts.append("</ul>")
                in_list = False
            parts.append(f"<h2>{html.escape(line)}</h2>")
            continue

        if line.startswith(("-", "–", "—")):
            if not in_list:
                parts.append("<ul>")
                in_list = True
            item = re.sub(r"^[-–—]\s*", "", line)
            parts.append(f"<li>{html.escape(item)}</li>")
            continue

        if in_list:
            parts.append("</ul>")
            in_list = False

        parts.append(f"<p>{html.escape(line)}</p>")

    if in_list:
        parts.append("</ul>")

    return "\n".join(parts)


def py_string_literal(value: str) -> str:
    return '"""' + value.replace("\\", "\\\\").replace('"""', '\\"\\"\\"') + '"""'


def main() -> None:
    contents: dict[str, str] = {}
    for page in PAGES:
        doc_path = DOCS_DIR / page["doc"]
        text = doc_to_text(doc_path)
        contents[page["slug"]] = text_to_html(text)

    const_blocks = []
    for page in PAGES:
        slug_upper = page["slug"].upper().replace("-", "_")
        const_blocks.append(f"{slug_upper}_CONTENT = {py_string_literal(contents[page['slug']])}")

    pages_data = ",\n        ".join(
        f"""{{
            "slug": "{page["slug"]}",
            "title": "{page["title"]}",
            "content": {page["slug"].upper().replace("-", "_")}_CONTENT,
            "isActive": True,
        }}"""
        for page in PAGES
    )

    migration = f'''"""update_legal_pages_from_docs

Revision ID: f1a2b3c4d5e6
Revises: e6f7a8b9c0d1
Create Date: 2026-06-08 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "e6f7a8b9c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_SLUGS = {NEW_SLUGS!r}

{chr(10).join(const_blocks)}

LEGAL_PAGES = [
        {pages_data}
]


def _upsert_page(conn, page: dict) -> None:
    conn.execute(
        sa.text("""
            REPLACE INTO legal_pages (slug, title, content, isActive)
            VALUES (:slug, :title, :content, :isActive)
        """),
        page,
    )


def upgrade() -> None:
    """Обновить публичный договор и добавить страницы правил."""
    conn = op.get_bind()
    for page in LEGAL_PAGES:
        _upsert_page(conn, page)


def downgrade() -> None:
    """Удалить новые страницы правил (public-offer не откатываем автоматически)."""
    conn = op.get_bind()
    for slug in NEW_SLUGS:
        conn.execute(
            sa.text("DELETE FROM legal_pages WHERE slug = :slug"),
            {{"slug": slug}},
        )
'''

    OUTPUT.write_text(migration, encoding="utf-8")
    print(f"Written: {OUTPUT}")


if __name__ == "__main__":
    main()
