import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { format, addDays, startOfToday, differenceInDays } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import {
  Users,
  BedDouble,
  ArrowLeft,
  Loader2,
  Home,
  X,
} from 'lucide-react'

import { DateRangePicker } from '@/components/DateRangePicker'
import { Button } from '@/components/ui/button'
import { useBookingPublicEnabled } from '@/contexts/SiteSettingsContext'
import { AccommodationCard } from '@/components/AccommodationCard'

const API_BASE = '/api'

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
  isBookedForDates?: boolean
}

interface PaginatedAccommodationResponse {
  items: Accommodation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function AccommodationTypePage() {
  const bookingPublicEnabled = useBookingPublicEnabled()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const typeId = Number(id)

  const [type, setType] = useState<AccommodationType | null>(null)
  const [typeLoading, setTypeLoading] = useState(true)
  const [typeError, setTypeError] = useState('')

  const [objects, setObjects] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(false)

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const t = startOfToday()
    return { from: addDays(t, 1), to: addDays(t, 2) }
  })
  const [bookedDates, setBookedDates] = useState<Date[]>([])

  // Load type info
  useEffect(() => {
    if (!typeId) {
      setTypeError('Неверный ID типа размещения')
      setTypeLoading(false)
      return
    }
    setTypeLoading(true)
    fetch(`${API_BASE}/accommodation/types/${typeId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Не найден')
        return r.json()
      })
      .then((data: AccommodationType) => {
        setType(data)
        setTypeError('')
      })
      .catch(() => setTypeError('Тип размещения не найден'))
      .finally(() => setTypeLoading(false))
  }, [typeId])

  // Загрузка списка с учётом занятости на выбранные даты
  const loadData = useCallback(async () => {
    if (!typeId) return
    if (!dateRange?.from || !dateRange?.to) {
      setObjects([])
      return
    }

    setLoading(true)

    const params = new URLSearchParams()
    params.set('typeId', String(typeId))
    params.set('page', '1')
    params.set('pageSize', '100')
    params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))

    try {
      const res = await fetch(`${API_BASE}/accommodation/availability?${params.toString()}`)
      const data: PaginatedAccommodationResponse = await res.json()
      setObjects(data.items)
    } catch {
      setObjects([])
    } finally {
      setLoading(false)
    }
  }, [typeId, dateRange])

  useEffect(() => {
    if (type && !typeError) {
      loadData()
    }
  }, [type, typeError, loadData])

  // Fetch booked dates for disabled calendar days
  useEffect(() => {
    if (!typeId) {
      setBookedDates([])
      return
    }
    fetch(`${API_BASE}/accommodation/booked-dates?typeId=${typeId}`)
      .then((r) => r.json())
      .then((data: Array<{ startDate: string; endDate: string }>) => {
        const dates: Date[] = []
        for (const range of data) {
          const start = new Date(range.startDate)
          const end = new Date(range.endDate)
          const d = new Date(start)
          while (d < end) {
            dates.push(new Date(d))
            d.setDate(d.getDate() + 1)
          }
        }
        setBookedDates(dates)
      })
      .catch(() => setBookedDates([]))
  }, [typeId])

  const handleResetFilters = () => {
    const t = startOfToday()
    setDateRange({ from: addDays(t, 1), to: addDays(t, 2) })
  }

  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0
    return Math.max(1, differenceInDays(dateRange.to, dateRange.from))
  }, [dateRange])

  if (typeLoading) {
    return (
      <div className="min-h-screen bg-lightgray flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    )
  }

  if (typeError || !type) {
    return (
      <div className="min-h-screen bg-lightgray flex flex-col items-center justify-center gap-4 px-4">
        <BedDouble className="w-16 h-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-dark">{typeError || 'Не найдено'}</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lightgray">
      {/* Hero */}
      <section className="relative min-h-[400px] md:min-h-[500px] flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${type.imageUrl || '/assets/asset_7.webp'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="relative container-main pb-12 pt-32 md:pt-40">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {type.name}
          </h1>
          {type.description && (
            <div
              className="text-white/90 text-base md:text-lg max-w-2xl leading-relaxed"
              dangerouslySetInnerHTML={{ __html: type.description }}
            />
          )}
          <div className="flex items-center gap-4 mt-4 text-white/80 text-sm">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              До {type.capacity} чел.
            </span>
            <span className="flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              {type.pricePerNight.toLocaleString('ru-RU')} Br/{type.priceUnit || 'ночь'}
            </span>
          </div>
        </div>
      </section>

      {/* Search panel */}
      <main className="container-main py-8 md:py-12">
        <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
            {/* Fixed type */}
            <div className="flex-[1_1_200px] min-w-[200px]">
              <label className="text-sm font-medium text-dark mb-1.5 block">Тип размещения</label>
              <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-input bg-gray-50 text-sm text-dark">
                <BedDouble className="w-4 h-4 text-brand shrink-0" />
                <span className="font-medium">{type.name}</span>
              </div>
            </div>

            <DateRangePicker
              label="Даты размещения"
              value={dateRange}
              onChange={setDateRange}
              disabled={[...bookedDates, { before: startOfToday() }]}
              className="flex-[1_1_240px] min-w-[200px]"
            />

            {/* Buttons */}
            <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
              <Button
                className="h-11 px-8 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl"
                onClick={loadData}
              >
                Найти
              </Button>
              <Button
                variant="outline"
                className="h-11 px-4 rounded-xl border-gray-200 text-graytext hover:text-dark hover:border-gray-300"
                onClick={handleResetFilters}
              >
                <X className="w-4 h-4 mr-1.5" />
                Сбросить фильтры
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border shadow-sm animate-pulse">
                <div className="aspect-[16/10] bg-gray-200" />
                <div className="p-5 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : objects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border shadow-sm">
            <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">Нет доступных вариантов</h3>
            <p className="text-graytext">Попробуйте изменить даты</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-graytext">
              Найдено {objects.length} {objects.length === 1 ? 'вариант' : objects.length < 5 ? 'варианта' : 'вариантов'} на {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {objects.map((obj) => (
                <AccommodationCard
                  key={obj.id}
                  obj={obj}
                  showCalendar
                  showStubButton={!bookingPublicEnabled}
                  isBooked={Boolean(obj.isBookedForDates)}
                  onBookClick={
                    obj.isBookedForDates
                      ? undefined
                      : () => {
                          const params = new URLSearchParams()
                          params.set('accommodationId', String(obj.id))
                          if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
                          if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
                          window.location.href = `/booking/form?${params.toString()}`
                        }
                  }
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
