import { Users } from 'lucide-react'
import { AccommodationImageSlider } from './AccommodationImageSlider'
import { AccommodationAvailabilityCalendar } from './AccommodationAvailabilityCalendar'
import { BookingStubButton } from './BookingStubButton'
import { plainTextFromHtml } from '@/lib/safeHtml'

interface AccommodationType {
  id: number
  name: string
  description?: string
  capacity: number
  pricePerNight: number
  priceUnit?: string
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
}

interface AccommodationCardProps {
  obj: Accommodation
  showCalendar?: boolean
  showStubButton?: boolean
  /** Занято на выбранные даты — без кнопки бронирования */
  isBooked?: boolean
  onBookClick?: () => void
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-graytext">
            {(obj.capacity || obj.type?.capacity) && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                До {obj.capacity || obj.type?.capacity} чел.
              </span>
            )}
            {(obj.pricePerNight || obj.type?.pricePerNight) && (
              <span className="font-medium text-dark">
                {(obj.pricePerNight || obj.type?.pricePerNight || 0).toLocaleString('ru-RU')} Br/{obj.type?.priceUnit || 'ночь'}
              </span>
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
