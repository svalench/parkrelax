import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'

interface GalleryItem {
  id: number
  imageUrl: string | null
  title: string | null
  category: string
  sortOrder: number
  isActive: boolean
}

const fallbackImages = [
  '/assets/asset_17.jpg',
  '/assets/asset_18.jpg',
  '/assets/asset_19.jpg',
  '/assets/asset_20.jpg',
  '/assets/asset_21.jpg',
  '/assets/asset_22.jpg',
]

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const thumbContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((data: GalleryItem[]) => {
        const active = Array.isArray(data) ? data.filter((i) => i.isActive) : []
        setItems(active)
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLoading(false)
      })
  }, [])

  const images = items.length > 0
    ? items.map((i) => i.imageUrl || '/assets/asset_17.jpg')
    : fallbackImages

  const goTo = useCallback((i: number) => {
    setCurrent(i)
  }, [])

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  }, [images.length])

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))
  }, [images.length])

  // Scroll active thumbnail into view
  useEffect(() => {
    const container = thumbContainerRef.current
    if (!container) return
    const activeThumb = container.children[current] as HTMLElement
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [current])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prev, next])

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
  }

  if (loading) {
    return (
      <section id="gallery" className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container-main">
          <SectionHeader
            label="ГАЛЕРЕЯ"
            title="Атмосфера, в которую хочется вернуться"
            subtitle="Тёплые вечера, лес, озёро и уютные доимки — всё для вашего идеального отдыха"
            buttonText=""
            variant="outline"
          />
          <div className="aspect-[16/9] bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </section>
    )
  }

  if (images.length === 0) {
    return (
      <section id="gallery" className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container-main">
          <SectionHeader
            label="ГАЛЕРЕЯ"
            title="Атмосфера, в которую хочется вернуться"
            subtitle="Тёплые вечера, лес, озёро и уютные доимки — всё для вашего идеального отдыха"
            buttonText=""
            variant="outline"
          />
          <div className="text-center text-graytext py-12">Пока нет фотографий</div>
        </div>
      </section>
    )
  }

  return (
    <section id="gallery" className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container-main">
        <SectionHeader
          label="ГАЛЕРЕЯ"
          title="Атмосфера, в которую хочется вернуться"
          subtitle="Тёплые вечера, лес, озёро и уютные доимки — всё для вашего идеального отдыха"
          buttonText=""
          variant="outline"
        />

        {/* Main Gallery */}
        <div
          className="relative rounded-2xl overflow-hidden mb-4 sm:mb-6 select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="aspect-[4/3] sm:aspect-[3/2] md:aspect-[16/9]">
            {images.map((img, i) => (
              <img
                key={img + i}
                src={img}
                alt={`Галерея Парк Relax — фото ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  i === current ? 'opacity-100' : 'opacity-0'
                }`}
                draggable={false}
              />
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-brand hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-brand hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
            aria-label="Следующее фото"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Dot indicators (mobile only) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === current ? 'bg-white w-4' : 'bg-white/60'
                }`}
                aria-label={`Перейти к фото ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnails — hidden on small mobile, visible from sm */}
        <div
          ref={thumbContainerRef}
          className="hidden sm:flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          {images.map((thumb, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative flex-shrink-0 w-[100px] md:w-[140px] lg:w-[180px] rounded-xl overflow-hidden aspect-[16/10] transition-all duration-200 ${
                current === i
                  ? 'ring-2 ring-brand opacity-100 scale-[1.02]'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={thumb}
                alt={`Миниатюра ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-graytext mt-4 sm:mt-6 italic">
          Каждый уголок Парк Relax создан для вашего комфорта и вдохновения
        </p>
      </div>
    </section>
  )
}
