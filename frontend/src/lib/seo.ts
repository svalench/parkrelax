/** Ключевые фразы для поиска (РФ → отдых в Беларуси). */
export const SEO_KEYWORDS_META =
  'отдых в беларуси, отдых в белоруссии, курорт беларуси, курорты беларуси, база отдыха беларусь, комплекс отдыха беларусь, парк отдыха беларусь, отдых на озере беларусь, коттеджи у озера беларусь, снять коттедж беларусь, отдых в полесье, отдых пинский район, отдых для россиян в беларуси, отдых из россии беларусь, отдых из москвы беларусь, отдых из минска, семейный отдых беларусь, баня на дровах беларусь, прокат лодок sup беларусь, турбаза беларусь, парк relax, park relax кончицы'

/** Текст для скрытого SEO-блока (естественные формулировки, не спам-список). */
export const SEO_HIDDEN_TEXT =
  'Комплекс отдыха Парк Relax в деревне Кончицы, Пинский район, Беларусь — курорт и база отдыха на берегу озера в Полесье. ' +
  'Отдых в Беларуси для гостей из России и Беларуси: коттеджи и домики у воды, белый песчаный пляж, баня на дровах, терраса, прокат лодок и SUP. ' +
  'Бронирование онлайн: отдых на озере, семейный и корпоративный отдых, маршруты из Минска, Бреста и Гомеля.'

export const SITE_URL = 'https://parkrelax.by'

export function getResortJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Resort',
    name: 'Парк Relax',
    alternateName: 'Park Relax',
    description: SEO_HIDDEN_TEXT,
    url: SITE_URL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Кончицы',
      addressRegion: 'Брестская область',
      addressCountry: 'BY',
    },
    keywords: SEO_KEYWORDS_META,
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Озеро и пляж' },
      { '@type': 'LocationFeatureSpecification', name: 'Коттеджи и апартаменты' },
      { '@type': 'LocationFeatureSpecification', name: 'Баня на дровах' },
      { '@type': 'LocationFeatureSpecification', name: 'Прокат лодок и SUP' },
    ],
  }
}
