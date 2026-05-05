import DOMPurify from 'dompurify'

/** Согласовано по тегам с backend/app/html_sanitize.py (nh3). */
const SANITIZE_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'hr',
    'i',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'span',
    'strong',
    'sub',
    'sup',
    'u',
    'ul',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'class', 'style'],
  ALLOW_DATA_ATTR: false,
}

/** HTML для полного вывода (статьи, модалки с форматированием). */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}

/** Текст без тегов для карточек и превью с line-clamp. */
export function plainTextFromHtml(html: string | undefined | null): string {
  if (html == null || html === '') return ''
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '').trim()
  }
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}
