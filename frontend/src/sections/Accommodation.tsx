import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { plainTextFromHtml } from '../lib/safeHtml'

interface AccommodationItem {
  id: number
  name: string
  description?: string
  typeId: number
  imageUrl?: string
  capacity: number
  pricePerNight: number
  isActive: boolean
  showOnMain: boolean
  sortOrder: number
}

const MORE_CARD: AccommodationItem = {
  id: -1,
  name: 'Смотреть больше',
  description: 'Все варианты размещения',
  typeId: 0,
  imageUrl: '',
  capacity: 0,
  pricePerNight: 0,
  isActive: true,
  showOnMain: true,
  sortOrder: 999,
}

const fallbackAccommodations: AccommodationItem[] = [
  {
    id: 1,
    name: 'Коттедж',
    description: 'До 8 человек · 4 комнаты · с камином',
    typeId: 1,
    imageUrl: '/assets/asset_7.jpg',
    capacity: 8,
    pricePerNight: 8500,
    isActive: true,
    showOnMain: true,
    sortOrder: 0,
  },
  {
    id: 2,
    name: 'Апартаменты',
    description: 'До 4 человек · 2 комнаты · с балконом',
    typeId: 2,
    imageUrl: '/assets/asset_8.jpg',
    capacity: 4,
    pricePerNight: 5200,
    isActive: true,
    showOnMain: true,
    sortOrder: 1,
  },
  {
    id: 3,
    name: 'Летние домики',
    description: 'До 6 человек · 3 комнаты · терраса',
    typeId: 3,
    imageUrl: '/assets/asset_9.jpg',
    capacity: 6,
    pricePerNight: 4800,
    isActive: true,
    showOnMain: true,
    sortOrder: 2,
  },
  {
    id: 4,
    name: 'Терраса с баней',
    description: 'До 10 человек · баня · мини-бассейн',
    typeId: 4,
    imageUrl: '/assets/asset_10.jpg',
    capacity: 10,
    pricePerNight: 12000,
    isActive: true,
    showOnMain: true,
    sortOrder: 3,
  },
  MORE_CARD,
]

export default function Accommodation() {
  const navigate = useNavigate()
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([])
  const [active, setActive] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(0)

  useEffect(() => {
    fetch('/api/accommodation/objects?showOnMain=true')
      .then((r) => r.json())
      .then((data: AccommodationItem[]) => {
        const items =
          Array.isArray(data) && data.length > 0
            ? [...data, MORE_CARD]
            : fallbackAccommodations
        setAccommodations(items)
      })
      .catch(() => setAccommodations(fallbackAccommodations))
  }, [])

  useEffect(() => {
    function updateWidth() {
      if (stageRef.current) setStageWidth(stageRef.current.offsetWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const goTo = useCallback(
    (index: number) => {
      const N = accommodations.length
      if (N === 0) return
      setActive(Math.max(0, Math.min(index, N - 1)))
    },
    [accommodations.length]
  )

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  // Drag / touch
  const dragStartX = useRef(0)
  const dragging = useRef(false)

  const onStart = useCallback((x: number) => {
    dragStartX.current = x
    dragging.current = true
    if (stageRef.current) stageRef.current.style.cursor = 'grabbing'
  }, [])

  const onMove = useCallback((x: number) => {
    if (!dragging.current) return
    if (Math.abs(x - dragStartX.current) > 8) dragging.current = true
  }, [])

  const onEnd = useCallback(
    (x: number) => {
      if (!dragging.current) return
      dragging.current = false
      if (stageRef.current) stageRef.current.style.cursor = ''
      const diff = dragStartX.current - x
      if (Math.abs(diff) > 50) {
        goTo(active + (diff > 0 ? 1 : -1))
      }
    },
    [active, goTo]
  )

  // Compute card styles
  const getCardStyle = (index: number): React.CSSProperties => {
    const diff = index - active
    const absDiff = Math.abs(diff)
    const dir = Math.sign(diff)
    const W = stageWidth || 1200

    const SIDE_OFFSET = W * 0.14
    const SIDE_SCALE = 0.82
    const SIDE_ROTATE = 6
    const FAR_OFFSET = W * 0.26
    const FAR_SCALE = 0.68
    const FAR_ROTATE = 12

    let tx = 0,
      scale = 1,
      rotate = 0,
      opacity = 1,
      zIndex = 10

    if (diff === 0) {
      tx = 0
      scale = 1
      rotate = 0
      zIndex = 20
      opacity = 1
    } else if (absDiff === 1) {
      tx = dir * SIDE_OFFSET
      scale = SIDE_SCALE
      rotate = dir * SIDE_ROTATE
      zIndex = 15
      opacity = 1
    } else if (absDiff === 2) {
      tx = dir * FAR_OFFSET
      scale = FAR_SCALE
      rotate = dir * FAR_ROTATE
      zIndex = 10
      opacity = 0.75
    } else {
      tx = dir * W * 0.65
      scale = 0.55
      rotate = dir * 18
      zIndex = 5
      opacity = 0
    }

    return {
      transform: `translate(-50%, -50%) translateX(${tx}px) rotate(${rotate}deg) scale(${scale})`,
      zIndex,
      opacity,
    }
  }

  const handleBook = (itemTypeId: number) => {
    navigate(`/booking?typeId=${itemTypeId}`)
  }

  const N = accommodations.length

  return (
    <section id="accommodation" className="acc-section">
      <div className="acc-header">
        <div className="acc-eyebrow">Где остановиться</div>
        <h2 className="acc-title">
          Выбери своё <span>жильё</span>
        </h2>
      </div>

      <div
        className="acc-stage"
        ref={stageRef}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={(e) => onEnd(e.clientX)}
        onMouseLeave={(e) => { if (dragging.current) onEnd(e.clientX) }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX)}
      >
        <div className="acc-track">
          {accommodations.map((item, i) => {
            const isMore = item.id === -1
            return (
            <div
              key={item.id}
              className={`acc-card ${i === active ? 'is-center' : ''} ${isMore ? 'acc-card-more' : ''}`}
              style={getCardStyle(i)}
              onClick={() => {
                if (i !== active) goTo(i)
                else if (isMore) navigate('/booking')
              }}
            >
              {!isMore && (
                <div className="acc-num">
                  {String(i + 1).padStart(2, '0')}
                </div>
              )}
              {!isMore && (
                <img
                  src={item.imageUrl || '/assets/asset_7.jpg'}
                  alt={item.name}
                  draggable={false}
                />
              )}
              <div className="acc-info">
                <div className="acc-info-title">{item.name}</div>
                {!isMore && (
                  <div className="acc-info-sub">
                    {plainTextFromHtml(item.description) ||
                      `До ${item.capacity} человек`}
                  </div>
                )}
                {!isMore && item.pricePerNight > 0 && (
                  <div className="acc-info-price">
                    {item.pricePerNight.toLocaleString('ru-RU')} ₽ / ночь
                  </div>
                )}
                <button
                  className="acc-info-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isMore) navigate('/booking')
                    else handleBook(item.typeId)
                  }}
                >
                  {isMore ? 'Все варианты →' : 'Забронировать'}
                </button>
              </div>
              <div className="acc-label-side">{item.name}</div>
            </div>
            )
          })}
        </div>

        {N > 1 && (
          <>
            <button
              className="acc-arrow acc-arrow--l"
              onClick={goPrev}
              disabled={active === 0}
              aria-label="Назад"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="acc-arrow acc-arrow--r"
              onClick={goNext}
              disabled={active === N - 1}
              aria-label="Вперёд"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {N > 1 && (
        <div className="acc-dots">
          {accommodations.map((_, i) => (
            <button
              key={i}
              className={`acc-dot ${i === active ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={i === accommodations.length - 1 ? 'Все варианты' : `Жильё ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
