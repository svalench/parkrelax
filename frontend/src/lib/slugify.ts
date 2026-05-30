/** Slug для якорей прайса (как на странице /prices). */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^а-яa-z0-9-]/g, '')
}

/** Позиция в прайсе (наименование как в Excel / API price-list). */
export const TERRACE_BANYA_PRICE_HASH = slugify(
  'Терраса с баней, подогреваемым мини-бассейном, мангальным комплексом и беседкой (длительность 3 часа)',
)

export const RENTAL_CATEGORY_PRICE_HASH = slugify(
  'АРЕНДА (время работы ежедневно с 9:00 до 20:00)',
)

/** Ссылка «Узнать цену» для карточки зоны аренды на главной. */
export function areaItemPriceHref(title: string): string {
  if (/террас|терасса/i.test(title) && /бан/i.test(title)) {
    return `/prices#${TERRACE_BANYA_PRICE_HASH}`
  }
  if (/беседк|пляж|зона/i.test(title)) {
    return `/prices#${RENTAL_CATEGORY_PRICE_HASH}`
  }
  return '/prices'
}
