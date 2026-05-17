import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { format, addDays, startOfToday, compareAsc, startOfDay, isSameDay, isAfter, isBefore, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DateRange, OnSelectHandler } from 'react-day-picker'
import {
  Baby,
  CalendarIcon,
  Users,
  BedDouble,
  Minus,
  Plus,
  ArrowLeft,
  Loader2,
  Home,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { plainTextFromHtml } from '@/lib/safeHtml'

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
}

function ImageSlider({
  images,
  alt,
  badge,
}: {
  images: string[]
  alt: string
  badge: string
}) {
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
      <div className="aspect-[16/10] overflow-hidden relative group/slider cursor-pointer">
        {images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`${alt} — фото ${idx + 1}`}
            onClick={() => {
              setCurrent(idx)
              setLightboxOpen(true)
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 transition-opacity duration-300 ${
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

function formatShortDate(d: Date | undefined): string {
  if (!d) return '—'
  return format(d, 'dd.MM.yyyy')
}

function formatGuestsLabel(adults: number, children: number): string {
  const adultWord = adults % 10 === 1 && adults % 100 !== 11 ? 'взрослый' : 'взрослых'
  if (children === 0) {
    return `${adults} ${adultWord}`
  }
  let childWord: string
  if (children % 10 === 1 && children % 100 !== 11) {
    childWord = 'ребёнок'
  } else if (children % 10 >= 2 && children % 10 <= 4 && (children % 100 < 10 || children % 100 >= 20)) {
    childWord = 'ребёнка'
  } else {
    childWord = 'детей'
  }
  return `${adults} ${adultWord}, ${children} ${childWord}`
}

export default function AccommodationTypePage() {
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
  const [adults, setAdults] = useState<number>(2)
  const [children, setChildren] = useState<number>(0)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined)
  const [bookedDates, setBookedDates] = useState<Date[]>([])

  const hoverFrom = dateRange?.from && !dateRange?.to && hoverDate
    ? (compareAsc(startOfDay(dateRange.from), startOfDay(hoverDate)) > 0
        ? startOfDay(hoverDate)
        : startOfDay(dateRange.from))
    : undefined
  const hoverTo = dateRange?.from && !dateRange?.to && hoverDate
    ? (compareAsc(startOfDay(dateRange.from), startOfDay(hoverDate)) > 0
        ? startOfDay(dateRange.from)
        : startOfDay(hoverDate))
    : undefined

  const [calendarMonths, setCalendarMonths] = useState(1)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setCalendarMonths(mq.matches ? 2 : 1)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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

  // Determine if user has changed filters from defaults
  const isFiltered = useMemo(() => {
    const t = startOfToday()
    const defaultFrom = addDays(t, 1)
    const defaultTo = addDays(t, 2)
    const isDefaultDates = dateRange?.from && dateRange?.to &&
      isSameDay(dateRange.from, defaultFrom) &&
      isSameDay(dateRange.to, defaultTo)
    const isDefaultGuests = adults === 2 && children === 0
    return !(isDefaultDates && isDefaultGuests)
  }, [dateRange, adults, children])

  // Load availability or all objects
  const loadData = useCallback(async () => {
    if (!typeId) return
    setLoading(true)

    if (!isFiltered) {
      const params = new URLSearchParams()
      params.set('typeId', String(typeId))
      params.set('activeOnly', 'true')
      try {
        const res = await fetch(`${API_BASE}/accommodation/objects?${params.toString()}`)
        const data: Accommodation[] = await res.json()
        setObjects(data)
      } catch {
        setObjects([])
      } finally {
        setLoading(false)
      }
      return
    }

    const params = new URLSearchParams()
    params.set('typeId', String(typeId))
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
    params.set('adults', String(adults))
    params.set('children', String(children))

    try {
      const res = await fetch(`${API_BASE}/accommodation/availability?${params.toString()}`)
      const data: Accommodation[] = await res.json()
      setObjects(data)
    } catch {
      setObjects([])
    } finally {
      setLoading(false)
    }
  }, [typeId, isFiltered, dateRange, adults, children])

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
    setAdults(2)
    setChildren(0)
  }

  const handleRangeSelect: OnSelectHandler<DateRange | undefined> = (
    _range,
    triggerDate,
  ) => {
    if (!triggerDate) return
    const day = startOfDay(triggerDate)

    let shouldClose = false
    setDateRange((prev) => {
      let next: DateRange | undefined
      if (prev?.from && prev?.to) {
        next = { from: day, to: undefined }
      } else if (prev?.from && !prev.to) {
        let from = startOfDay(prev.from)
        let to = day
        if (compareAsc(from, to) > 0) {
          const t = from
          from = to
          to = t
        }
        next = { from, to }
        shouldClose = true
      } else {
        next = { from: day, to: undefined }
      }
      return next
    })

    if (shouldClose) {
      queueMicrotask(() => setDatesOpen(false))
    }
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
          style={{ backgroundImage: `url(${type.imageUrl || '/assets/asset_7.jpg'})` }}
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

            {/* Dates */}
            <div className="flex-[1_1_280px] min-w-[280px]">
              <label className="text-sm font-medium text-dark mb-1.5 block">Даты размещения</label>
              <Popover open={datesOpen} onOpenChange={setDatesOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-input bg-transparent px-3 py-2.5 text-left outline-none transition-all hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CalendarIcon className="w-5 h-5 text-brand shrink-0" />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{formatShortDate(dateRange?.from)}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="font-medium">{formatShortDate(dateRange?.to)}</span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  className="w-auto max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/70 bg-popover p-0 shadow-2xl"
                >
                  <Calendar
                    mode="range"
                    locale={ru}
                    numberOfMonths={calendarMonths}
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    disabled={[...bookedDates, { before: startOfToday() }]}
                    defaultMonth={dateRange?.from ?? addDays(startOfToday(), 1)}
                    modifiers={{
                      hoverStart: (d) => hoverFrom ? isSameDay(d, hoverFrom) : false,
                      hoverMiddle: (d) => hoverFrom && hoverTo ? (isAfter(d, hoverFrom) && isBefore(d, hoverTo)) : false,
                      hoverEnd: (d) => hoverTo ? isSameDay(d, hoverTo) : false,
                    }}
                    onDayMouseEnter={(day) => {
                      if (dateRange?.from && !dateRange?.to) {
                        setHoverDate(day)
                      }
                    }}
                    onDayMouseLeave={() => setHoverDate(undefined)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests */}
            <div className="flex-[1_1_200px] min-w-[200px]">
              <label className="text-sm font-medium text-dark mb-1.5 block">Гости</label>
              <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-input bg-transparent px-3 py-2.5 text-left outline-none transition-all hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Users className="w-5 h-5 text-brand shrink-0" />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{formatGuestsLabel(adults, children)}</span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-80 rounded-2xl border border-border/70 bg-white p-5 shadow-2xl"
                >
                  <div className="text-sm font-semibold text-dark mb-4">Количество гостей</div>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-dark">Взрослые</div>
                          <div className="text-xs text-graytext">от 18 лет</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={adults <= 1}
                          onClick={() => setAdults((a) => Math.max(1, a - 1))}
                          aria-label="Уменьшить число взрослых"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{adults}</span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={adults >= 20}
                          onClick={() => setAdults((a) => Math.min(20, a + 1))}
                          aria-label="Увеличить число взрослых"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                          <Baby className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-dark">Дети</div>
                          <div className="text-xs text-graytext">до 18 лет</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={children <= 0}
                          onClick={() => setChildren((c) => Math.max(0, c - 1))}
                          aria-label="Уменьшить число детей"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{children}</span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={children >= 10}
                          onClick={() => setChildren((c) => Math.min(10, c + 1))}
                          aria-label="Увеличить число детей"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

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
            <p className="text-graytext">Попробуйте изменить даты или количество гостей</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-graytext">
              Найдено {objects.length} {objects.length === 1 ? 'вариант' : objects.length < 5 ? 'варианта' : 'вариантов'} на {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className="group bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
                >
                  <ImageSlider
                    images={(() => {
                      const cover = obj.imageUrl || '/assets/asset_7.jpg'
                      const gallery = (obj.images || []).map((i) => i.imageUrl).filter((url) => url !== cover)
                      return [cover, ...gallery]
                    })()}
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
                      <button
                        onClick={() => {
                          const params = new URLSearchParams()
                          params.set('accommodationId', String(obj.id))
                          if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
                          if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
                          params.set('adults', String(adults))
                          params.set('children', String(children))
                          window.location.href = `/booking/form?${params.toString()}`
                        }}
                        className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Забронировать
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
