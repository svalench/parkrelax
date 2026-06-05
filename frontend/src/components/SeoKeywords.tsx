import { SEO_HIDDEN_TEXT, getResortJsonLd } from '@/lib/seo'

/** Скрытый SEO-блок и JSON-LD для поисковиков (Яндекс, Google). */
export default function SeoKeywords() {
  const jsonLd = JSON.stringify(getResortJsonLd())

  return (
    <>
      <script type="application/ld+json">{jsonLd}</script>
      <div className="sr-only">
        <p>{SEO_HIDDEN_TEXT}</p>
      </div>
    </>
  )
}
