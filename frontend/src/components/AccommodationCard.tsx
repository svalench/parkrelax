import { Users } from 'lucide-react'
import { AccommodationImageSlider } from './AccommodationImageSlider'
import { AccommodationAvailabilityCalendar } from './AccommodationAvailabilityCalendar'
import { BookingStubButton } from './BookingStubButton'
import { plainTextFromHtml } from '@/lib/safeHtml'
import { AccommodationFeatureTags, type AccommodationFeature } from './AccommodationFeatureTags'

interface AccommodationType {
  id: number
  name: string
  description?: string
  capacity: number
  pricePerNight: number
  priceUnit?: string
  pricingModel?: string
  childPricePerNight?: number | null
  imageUrl?: string
  isActive: boolean
  sortOrder: number
}

interface AccommodationImage {
  id: number
  imageUrl: string
  sortOrder: number
}

interface Accommodation {
  id: number
  name: string
  description?: string
  typeId: number
  imageUrl?: string
  capacity: number
  pricePerNight: number
  isActive: boolean
  sortOrder: number
  type?: AccommodationType
  images?: AccommodationImage[]
  features?: AccommodationFeature[]
}

interface AccommodationCardProps {
  obj: Accommodation
  showCalendar?: boolean
  showStubButton?: boolean
  /** Занято на выбранные даты — без кнопки бронирования */
  isBooked?: boolean
  onBookClick?: () => void
}

function formatPriceLabel(obj: Accommodation): string | null {
  const type = obj.type
  const adultPrice = obj.pricePerNight || type?.pricePerNight
  if (!adultPrice) return null

  if (type?.pricingModel === 'per_person') {
    const childPrice = type.childPricePerNight ?? adultPrice
    return `от ${adultPrice.toLocaleString('ru-RU')} руб/чел/сутки (дети 3–12 — ${childPrice.toLocaleString('ru-RU')} руб)`
  }

  return `${adultPrice.toLocaleString('ru-RU')} Br/${type?.priceUnit || 'ночь'}`
}

export function AccommodationCard({
  obj,
  showCalendar = false,
  showStubButton = false,
  isBooked = false,
  onBookClick,
}: AccommodationCardProps) {
  const images = (() => {
    const cover = obj.imageUrl || '/assets/asset_7.webp'
    const gallery = (obj.images || [])
      .map((i) => i.imageUrl)
      .filter((url) => url !== cover)
    return [cover, ...gallery]
  })()

  const priceLabel = formatPriceLabel(obj)
  const isPerPerson = obj.type?.pricingModel === 'per_person'

  return (
    <div
      className={`group bg-white rounded-xl overflow-hidden border shadow-sm transition-shadow ${
        isBooked ? 'opacity-90' : 'hover:shadow-md'
      }`}
    >
      <AccommodationImageSlider
        images={images}
        alt={obj.name}
        badge={obj.type?.name || 'Размещение'}
      />
      <div className="p-5">
        <h3 className="text-lg font-semibold text-dark mb-1">{obj.name}</h3>
        {obj.description && (
          <p className="text-sm text-graytext mb-3 line-clamp-2">
            {plainTextFromHtml(obj.description)}
          </p>
        )}
        <AccommodationFeatureTags features={obj.features} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-graytext">
            {!isPerPerson && (obj.capacity || obj.type?.capacity) ? (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                До {obj.capacity || obj.type?.capacity} чел.
              </span>
            ) : null}
            {isPerPerson && obj.type?.capacity ? (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                до {obj.type.capacity} чел/сутки
              </span>
            ) : null}
            {priceLabel && (
              <span className="font-medium text-dark">{priceLabel}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showCalendar && (
              <AccommodationAvailabilityCalendar
                accommodationId={obj.id}
                accommodationName={obj.name}
              />
            )}
            {isBooked ? (
              <span className="px-4 py-2 text-sm font-semibold text-graytext bg-gray-100 rounded-lg">
                Забронировано
              </span>
            ) : showStubButton ? (
              <BookingStubButton size="compact" />
            ) : (
              <button
                type="button"
                onClick={onBookClick}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Забронировать
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
