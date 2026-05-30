"""Санитизация HTML для полей rich text (nh3 / ammonia)."""

from __future__ import annotations

import nh3

# Теги и атрибуты согласованы с типичным выводом TinyMCE из starlette-admin.
_ALLOWED_TAGS = frozenset(
    {
        "a",
        "b",
        "blockquote",
        "br",
        "code",
        "div",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "hr",
        "i",
        "li",
        "ol",
        "p",
        "pre",
        "s",
        "span",
        "strong",
        "sub",
        "sup",
        "u",
        "ul",
    }
)

# nh3 ожидает mapping: тег -> множество атрибутов
_ALLOWED_ATTRIBUTES = {
    # rel задаётся через link_rel в nh3; не добавлять rel вручную
    "a": {"href", "title", "target"},
    "span": {"style", "class"},
    "p": {"style", "class"},
    "div": {"style", "class"},
}

_ALLOWED_URL_SCHEMES = frozenset({"http", "https", "mailto"})


def plain_text_from_html(html: str | None) -> str:
    """Текст без HTML для превью в админке."""
    if not html:
        return ""
    cleaned = nh3.clean(html, tags=set())
    return " ".join(cleaned.split())


def sanitize_rich_html(html: str | None) -> str | None:
    """Удаляет небезопасную разметку; возвращает None если на входе None."""
    if html is None:
        return None
    if not html.strip():
        return html
    return nh3.clean(
        html,
        tags=_ALLOWED_TAGS,
        attributes=_ALLOWED_ATTRIBUTES,
        url_schemes=_ALLOWED_URL_SCHEMES,
        strip_comments=True,
    )
