import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'

const galleryImages = [
  '/assets/asset_17.jpg',
  '/assets/asset_18.jpg',
  '/assets/asset_19.jpg',
  '/assets/asset_20.jpg',
  '/assets/asset_21.jpg',
  '/assets/asset_22.jpg',
]

const thumbs = [
  '/assets/asset_18.jpg',
  '/assets/asset_19.jpg',
  '/assets/asset_20.jpg',
  '/assets/asset_21.jpg',
  '/assets/asset_22.jpg',
]

export default function Gallery() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((c) => (c === 0 ? galleryImages.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === galleryImages.length - 1 ? 0 : c + 1))
  const goTo = (i: number) => setCurrent(i)

  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="container-main">
        <SectionHeader
          label="ГАЛЕРЕЯ"
          title="Атмосфера, в которую хочется вернуться"
          subtitle="Тёплые вечера, лес, озёра и уютные — всё для вашего идеального отдыха"
          buttonText="Смотреть все фото"
          variant="outline"
        />

        {/* Main Gallery */}
        <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[21/9]">
          <img
            src={galleryImages[current]}
            alt={`Галерея Парк Relax — фото ${current + 1}`}
            className="w-full h-full object-cover transition-opacity duration-500"
          />

          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-brand hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-brand hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
            aria-label="Следующее фото"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {thumbs.map((thumb, i) => (
            <button
              key={i}
              onClick={() => goTo(i + 1)}
              className={`relative flex-shrink-0 w-[180px] rounded-xl overflow-hidden aspect-[16/10] transition-all duration-200 ${
                current === i + 1 ? 'ring-2 ring-brand opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={thumb}
                alt={`Миниатюра ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Caption */}
        <p className="text-center text-sm text-graytext mt-6 italic">
          Каждый уголок Парк Relax создан для вашего комфорта и вдохновения
        </p>
      </div>
    </section>
  )
}
