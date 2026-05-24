import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router'
import { X, Clock, Users } from 'lucide-react'
import { sanitizeRichHtml } from '../lib/safeHtml'

interface RentalItem {
  id?: number
  title: string
  info: string
  badge: string
  badgeColor: string
  eyebrow: string
  description: string
  duration: string
  capacity: string
  imageUrl: string
}

/** Максимум полос «шторки» на главной (остальные только в админке). */
const MAX_RENTAL_PANELS = 10

export default function Rental() {
  const [rentals, setRentals] = useState<RentalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/rental/items')
      .then((r) => r.json())
      .then((data: RentalItem[]) => {
        if (Array.isArray(data)) {
          setRentals(data)
        }
      })
      .catch(() => {
        setRentals([])
      })
      .finally(() => setLoading(false))
  }, [])

  const activate = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const deactivate = useCallback(() => {
    setActiveIndex(null)
  }, [])

  const handlePanelClick = useCallback(
    (index: number) => {
      if (activeIndex === index) return
      activate(index)
    },
    [activeIndex, activate]
  )

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      deactivate()
    },
    [deactivate]
  )

  // Click outside to close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (stageRef.current && !stageRef.current.contains(e.target as Node)) {
        setActiveIndex(null)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // Keyboard support
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setActiveIndex(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const visibleRentals = useMemo(
    () => rentals.slice(0, MAX_RENTAL_PANELS),
    [rentals]
  )
  const panelCount = visibleRentals.length

  return (
    <section id="rental" className="py-20 bg-white overflow-hidden">
      {/* Header — внутри контейнера */}
      <div className="container-main mb-10 md:mb-12">
        <div className="max-w-xl">
          <span className="section-label mb-3 block">ПРОКАТ</span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-3">
            Участвуй в <span className="text-brand">активности</span> на любой вкус
          </h2>
        </div>
      </div>

      {/* Curtain Stage */}
      <div className="container-main">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/60 bg-gray-100 shadow-sm animate-pulse aspect-[3/4]">
                <div className="w-full h-full bg-gray-200" />
              </div>
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-graytext text-lg">Активности скоро появятся</p>
          </div>
        ) : (
        <div
          ref={stageRef}
          className={`rental-stage w-full rounded-2xl md:rounded-3xl ${activeIndex !== null ? 'rental-stage-active' : ''}`}
          data-panel-count={panelCount}
        >
        {visibleRentals.map((item, i) => (
          <div
            key={item.id != null ? `rental-${item.id}` : `rental-${item.title}-${i}`}
            className={`rental-panel ${activeIndex === i ? 'rental-panel-active' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={item.title}
            onClick={() => handlePanelClick(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handlePanelClick(i)
              }
            }}
          >
            {/* Background */}
            <div
              className="rental-panel-bg"
              style={{ backgroundImage: `url('${item.imageUrl}')` }}
            />
            <div className="rental-panel-overlay" />

            {/* Badge */}
            <span className={`rental-panel-badge ${item.badgeColor}`}>
              {item.badge}
            </span>

            {/* Vertical label (collapsed) */}
            <div className="rental-panel-label-vertical">{item.title}</div>

            {/* Close button */}
            <button
              className="rental-panel-close"
              onClick={handleClose}
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Expanded content */}
            <div className="rental-panel-content">
              <div className="rental-panel-eyebrow">{item.eyebrow}</div>
              <h3 className="rental-panel-title">{item.title}</h3>
              <div
                className="rental-panel-desc prose prose-sm prose-invert max-w-none text-white/95
                  prose-p:mb-2 prose-p:last:mb-0 prose-ul:my-2 prose-li:marker:text-white/70"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(item.description || ''),
                }}
              />
              <div className="rental-panel-meta">
                <span className="rental-meta-chip">
                  <Clock className="w-3.5 h-3.5" />
                  {item.duration}
                </span>
                <span className="rental-meta-chip">
                  <Users className="w-3.5 h-3.5" />
                  {item.capacity}
                </span>
                <Link
                  to="/prices"
                  className="rental-panel-cta-outline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Узнать цену
                </Link>
              </div>
            </div>
          </div>
        ))}
        </div>
        )}
      </div>

    </section>
  )
}
