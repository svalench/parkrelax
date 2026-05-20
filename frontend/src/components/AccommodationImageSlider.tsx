import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

interface AccommodationImageSliderProps {
  images: string[]
  alt: string
  badge: string
}

export function AccommodationImageSlider({
  images,
  alt,
  badge,
}: AccommodationImageSliderProps) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const hasMultiple = images.length > 1

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  }
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))
  }

  return (
    <>
      <div className="aspect-[16/10] overflow-hidden relative group/slider cursor-pointer bg-gray-100">
        {images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`${alt} — фото ${idx + 1}`}
            onClick={() => {
              setCurrent(idx)
              setLightboxOpen(true)
            }}
            className={`absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 transition-opacity duration-300 ${
              idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            loading="lazy"
          />
        ))}

        {/* Badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20">
            {badge}
          </span>
        </div>

        {/* Arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-dark flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-dark flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrent(idx)
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === current ? 'bg-white w-4' : 'bg-white/60 hover:bg-white/80'
                  }`}
                  aria-label={`Фото ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] w-auto max-h-[95vh] p-0 bg-black/95 border-none shadow-2xl overflow-hidden">
          <div className="relative flex items-center justify-center min-h-[60vh] max-h-[90vh]">
            <img
              src={images[current]}
              alt={`${alt} — фото ${current + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
            />

            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-3 right-3 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            {hasMultiple && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
                  {current + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
