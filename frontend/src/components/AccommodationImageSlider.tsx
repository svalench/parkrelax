import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
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

  useEffect(() => {
    if (!lightboxOpen || !hasMultiple) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
      }
      if (e.key === 'ArrowRight') {
        setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, hasMultiple, images.length])

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
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-dark flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
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
                  type="button"
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
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 z-50 flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-black/95 p-0 shadow-none sm:max-w-none"
        >
          <DialogTitle className="sr-only">
            {alt} — фото {current + 1}
          </DialogTitle>

          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/30 text-white hover:bg-white/50 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-1 items-center justify-center min-h-0 w-full px-14 py-16">
            <img
              src={images[current]}
              alt={`${alt} — фото ${current + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/30 text-white hover:bg-white/50 transition-colors"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/30 text-white hover:bg-white/50 transition-colors"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white">
                {current + 1} / {images.length}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
