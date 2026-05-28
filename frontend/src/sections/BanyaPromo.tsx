import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flame, Users, Waves, ArrowRight } from 'lucide-react'
import { plainTextFromHtml } from '../lib/safeHtml'

interface AccommodationType {
  id: number
  name: string
  description?: string
  capacity: number
  imageUrl?: string
  isActive: boolean
  sortOrder: number
}

const FALLBACK_IMAGE = '/assets/asset_7.webp'

const FALLBACK_DESCRIPTION =
  'Большая терраса с баней на дровах, уютной беседкой и мини-бассейном на свежем воздухе. Идеальное место для вечеринок, семейного отдыха и корпоративов у озера.'

function pickBanyaType(types: AccommodationType[]): AccommodationType | undefined {
  const active = types.filter((t) => t.isActive)
  return (
    active.find((t) => /бан/i.test(t.name)) ??
    active.find((t) => /терраса/i.test(t.name)) ??
    undefined
  )
}

/** Акцент на части названия с «бан» — как brand в блоке про Полесье. */
function renderPromoTitle(name: string) {
  const match = name.match(/^(.*?)(бан\S*)(.*)$/i)
  if (match) {
    return (
      <>
        {match[1]}
        <span className="text-brand">{match[2]}</span>
        {match[3]}
      </>
    )
  }
  return name
}

export default function BanyaPromo() {
  const navigate = useNavigate()
  const [banyaType, setBanyaType] = useState<AccommodationType | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: AccommodationType[]) => {
        if (Array.isArray(data)) {
          setBanyaType(pickBanyaType(data))
        }
      })
      .catch(() => setBanyaType(undefined))
      .finally(() => setLoading(false))
  }, [])

  const bgImage = banyaType?.imageUrl || FALLBACK_IMAGE
  const displayName = banyaType?.name ?? 'Терасса с баней'
  const description =
    plainTextFromHtml(banyaType?.description) || FALLBACK_DESCRIPTION
  const capacity = banyaType?.capacity ?? 10

  const chips = [
    { icon: Flame, text: 'Терраса с баней на дровах' },
    { icon: Users, text: `До ${capacity} гостей` },
    { icon: Waves, text: 'Беседка и мини-бассейн' },
  ]

  const goToContacts = () => {
    navigate({ pathname: '/', hash: '#contacts' })
    window.setTimeout(() => {
      document.getElementById('contacts')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 120)
  }

  return (
    <section
      id="banya"
      className="relative min-h-[420px] md:min-h-[520px] overflow-hidden"
      aria-label={displayName}
    >
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundImage: `url(${bgImage})` }}
        role="img"
        aria-label={`Фото: ${displayName}`}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 md:from-black/80 md:via-black/55 md:to-black/25" />

      <div className="relative z-10 container-main py-16 md:py-20 flex items-center min-h-[420px] md:min-h-[520px]">
        <div className="max-w-2xl">
          <span className="section-label mb-3 block text-white/50">
            ОТДЫХ И РЕЛАКС
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {banyaType ? (
              renderPromoTitle(displayName)
            ) : (
              <>
                Терраса с <span className="text-brand">баней</span>
              </>
            )}
          </h2>
          <p className="text-white/75 leading-relaxed mb-6">{description}</p>

          <div className="flex flex-wrap gap-3 mb-8">
            {chips.map((chip) => (
              <div
                key={chip.text}
                className="flex items-center gap-2 text-sm text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10"
              >
                <chip.icon className="w-4 h-4 text-brand shrink-0" />
                {chip.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/banya')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
            >
              Подробнее
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToContacts}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium border border-white/20 hover:bg-white/20 transition-colors"
            >
              Связаться
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
