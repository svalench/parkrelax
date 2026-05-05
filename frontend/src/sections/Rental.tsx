import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Clock, Users, ArrowRight } from 'lucide-react'
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

const fallbackRentals: RentalItem[] = [
  {
    title: 'Катамаран',
    info: 'До 4 человек',
    badge: 'Вода',
    badgeColor: 'bg-[rgba(30,96,145,0.82)] text-[#caf0f8]',
    eyebrow: 'Водный спорт',
    description: 'Прогулки по озеру на комфортабельном катамаране. Идеально для семейного отдыха и романтических прогулок на закате.',
    duration: '1–2 часа',
    capacity: 'до 4 чел.',
    imageUrl: '/assets/catamaran.webp',
  },
  {
    title: 'Лодка с веслами',
    info: 'До 3 человек',
    badge: 'Рыбалка',
    badgeColor: 'bg-[rgba(45,106,79,0.82)] text-[#d8f3dc]',
    eyebrow: 'Спокойствие',
    description: 'Тихая гребля по заливам и заливчикам озера. Отличный способ расслабиться и половить рыбу в уединённых местах.',
    duration: 'от 1 часа',
    capacity: 'до 3 чел.',
    imageUrl: '/assets/beach_.webp',
  },
  {
    title: 'Велосипед',
    info: 'Почасовой прокат',
    badge: 'Спорт',
    badgeColor: 'bg-[rgba(231,111,81,0.82)] text-[#fff1ec]',
    eyebrow: 'Активный отдых',
    description: 'Велосипеды для взрослых и детей. Катайтесь по лесным тропам и береговой линии, наслаждаясь природой.',
    duration: 'почасово',
    capacity: '1 чел.',
    imageUrl: '/assets/asset_13.jpg',
  },
  {
    title: 'SUP-доски',
    info: 'Активный отдых',
    badge: 'Актив',
    badgeColor: 'bg-[rgba(123,45,139,0.82)] text-[#f3e8ff]',
    eyebrow: 'Баланс',
    description: 'SUP-бординг для новичков и опытных. Укрепляйте корпус, наслаждайтесь видами и освежающими купаниями.',
    duration: 'от 1 часа',
    capacity: '1 чел.',
    imageUrl: '/assets/asset_14.jpg',
  },
]

export default function Rental() {
  const [rentals, setRentals] = useState<RentalItem[]>(fallbackRentals)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/rental/items')
      .then((r) => r.json())
      .then((data: RentalItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setRentals(data)
        }
      })
      .catch(() => {
        // fallback already set
      })
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

  return (
    <section id="rental" className="py-20 bg-white overflow-hidden">
      {/* Header — внутри контейнера */}
      <div className="container-main mb-10 md:mb-12">
        <div className="rental-header">
          <span className="rental-eyebrow">ПРОКАТ</span>
          <h2 className="rental-title">
            Выбирай <span>активность</span> на любой вкус
          </h2>
        </div>
      </div>

      {/* Curtain Stage — на всю ширину */}
      <div
        ref={stageRef}
        className={`rental-stage w-full ${activeIndex !== null ? 'rental-stage-active' : ''}`}
      >
        {rentals.slice(0, 5).map((item, i) => (
          <div
            key={item.title + i}
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
            <div className="rental-panel-label-vertical">{item.title.slice(0, 12)}{item.title.length > 12 ? '…' : ''}</div>

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
                <button className="rental-panel-cta">
                  Забронировать
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


    </section>
  )
}
