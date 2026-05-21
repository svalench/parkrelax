import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { sanitizeRichHtml } from '@/lib/safeHtml'

const API_BASE = '/api'
const FALLBACK_IMAGE = '/assets/asset_10.webp'

interface BanyaPageSettings {
  pageTitle: string
  pageSubtitle?: string
  eyebrow?: string
  ctaLabel?: string
  ctaHref?: string
  isActive: boolean
}

interface BanyaSection {
  id: number
  eyebrow?: string
  title: string
  description?: string
  imageUrl?: string
  chips?: string[]
  sortOrder: number
  isActive: boolean
}

interface BanyaPageData {
  settings: BanyaPageSettings
  sections: BanyaSection[]
}

function handleCta(href: string | undefined, navigate: ReturnType<typeof useNavigate>) {
  const target = href || '/#contacts'
  if (target.startsWith('/#')) {
    const hash = target.slice(1)
    navigate({ pathname: '/', hash })
    window.setTimeout(() => {
      document.getElementById(hash.replace('#', ''))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 120)
    return
  }
  if (target.startsWith('http') || target.startsWith('tel:')) {
    window.location.href = target
    return
  }
  navigate(target)
}

export default function BanyaPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<BanyaPageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/banya/page`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: { settings?: BanyaPageSettings; sections?: BanyaSection[] } | null) => {
        if (payload?.settings) {
          setData({
            settings: payload.settings,
            sections: payload.sections ?? [],
          })
        } else {
          setData(null)
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    )
  }

  const settings = data?.settings
  const sections = data?.sections ?? []
  const pageTitle = settings?.pageTitle ?? 'Терраса с баней'
  const pageSubtitle =
    settings?.pageSubtitle ??
    'Большая терраса с русской баней на дровах, уютной беседкой и мини-бассейном на свежем воздухе.'

  return (
    <div className="min-h-screen bg-dark text-white">
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="container-main pt-24 md:pt-28 pb-4 pointer-events-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm px-3 py-2 rounded-lg bg-black/35 backdrop-blur-md border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </button>
        </div>
      </header>

      <div className="banya-snap-root">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <section
              key={section.id}
              className="banya-snap-section relative flex items-end min-h-[100svh] snap-start snap-always"
              style={{
                backgroundImage: `url(${section.imageUrl || FALLBACK_IMAGE})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              <div className="relative z-10 container-main w-full pb-16 md:pb-24 pt-36 md:pt-40">
                {index === 0 && (
                  <div className="mb-8 md:mb-10">
                    {settings?.eyebrow && (
                      <span className="section-label mb-3 block text-white/50">
                        {settings.eyebrow}
                      </span>
                    )}
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 max-w-3xl">
                      {pageTitle}
                    </h1>
                    <p className="text-white/75 max-w-2xl leading-relaxed text-base md:text-lg">
                      {pageSubtitle}
                    </p>
                  </div>
                )}
                {section.eyebrow && index > 0 && (
                  <span className="text-xs font-bold uppercase tracking-widest text-brand mb-3 block">
                    {section.eyebrow}
                  </span>
                )}
                {index > 0 && (
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-3xl">
                    {section.title}
                  </h2>
                )}
                {index === 0 && section.title !== pageTitle && (
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 max-w-3xl">
                    {section.title}
                  </h2>
                )}
                {section.description && (
                  <div
                    className="prose prose-invert prose-lg max-w-2xl text-white/85 mb-6"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeRichHtml(section.description),
                    }}
                  />
                )}
                {section.chips && section.chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {section.chips.map((chip) => (
                      <span
                        key={chip}
                        className="text-sm text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/15"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))
        ) : (
          <section
            className="banya-snap-section relative flex items-end min-h-[100svh] snap-start snap-always"
            style={{ backgroundImage: `url(${FALLBACK_IMAGE})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            <div className="relative z-10 container-main w-full pb-16 md:pb-24 pt-36 md:pt-40">
              {settings?.eyebrow && (
                <span className="section-label mb-3 block text-white/50">{settings.eyebrow}</span>
              )}
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{pageTitle}</h1>
              <p className="text-white/75 max-w-2xl leading-relaxed mb-6">{pageSubtitle}</p>
              <p className="text-white/60">Секции лендинга скоро появятся</p>
            </div>
          </section>
        )}

        <section className="banya-snap-section relative flex items-center justify-center min-h-[40svh] snap-start snap-always bg-dark border-t border-white/10">
          <div className="container-main py-12 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
            <p className="text-white/70 text-center sm:text-left">
              Забронируйте террасу с баней — поможем подобрать дату и формат отдыха
            </p>
            <button
              type="button"
              onClick={() => handleCta(settings?.ctaHref, navigate)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors shrink-0"
            >
              {settings?.ctaLabel ?? 'Связаться'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
