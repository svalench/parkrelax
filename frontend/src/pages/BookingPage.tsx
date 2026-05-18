import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { format, addDays, startOfToday, compareAsc, startOfDay, isSameDay, isAfter, isBefore } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DateRange, OnSelectHandler } from 'react-day-picker'
import {
  Baby,
  CalendarIcon,
  Users,
  BedDouble,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

import { plainTextFromHtml } from '@/lib/safeHtml'

const API_BASE = '/api'
const cabinToTypeName: Record<string, string> = {
  cottage: 'Коттедж',
  apartments: 'Апартаменты',
  summer: 'Летние домики',
  terrace: 'Терраса с баней',
}

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

function formatShortDate(d: Date | undefined): string {
  if (!d) return '—'
  return format(d, 'dd.MM.yyyy')
}

/** Склонение для строки гостей «N взрослых, M детей». */
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

export default function BookingPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [types, setTypes] = useState<AccommodationType[]>([])
  /** После ответа /types (успех или ошибка) — иначе при ?cabin= нельзя бесконечно ждать пустой список. */
  const [typesReady, setTypesReady] = useState(false)
  const [objects, setObjects] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  const [typeId, setTypeId] = useState<string>(searchParams.get('typeId') || 'all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    if (checkIn && checkOut) {
      return { from: new Date(checkIn), to: new Date(checkOut) }
    }
    const t = startOfToday()
    return { from: addDays(t, 1), to: addDays(t, 2) }
  })
  const [adults, setAdults] = useState<number>(Number(searchParams.get('adults') || '2'))
  const [children, setChildren] = useState<number>(Number(searchParams.get('children') || '0'))
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(Number(searchParams.get('page') || '1'))
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

  const pageSize = 10

  // Load types
  useEffect(() => {
    fetch(`${API_BASE}/accommodation/types`)
      .then((r) => r.json())
      .then((data) => {
        setTypes(Array.isArray(data) ? data : [])
      })
      .catch(() => setTypes([]))
      .finally(() => setTypesReady(true))
  }, [])

  /** Пока типы не пришли, ?cabin= из Hero ещё не отражён в typeId — вычисляем id для запроса. */
  const resolvedTypeId = useMemo(() => {
    if (types.length === 0) return typeId
    const cabin = searchParams.get('cabin')
    if (cabin && cabinToTypeName[cabin]) {
      const expectedName = cabinToTypeName[cabin]
      const found = types.find(
        (t: AccommodationType) => t.name.toLowerCase() === expectedName.toLowerCase(),
      )
      if (found) return String(found.id)
    }
    return typeId
  }, [typeId, types, searchParams])

  // Синхронизация фильтра с ?cabin= / ?typeId= (в т.ч. переход с футера)
  useEffect(() => {
    if (types.length === 0) return
    const cabin = searchParams.get('cabin')
    if (cabin && cabinToTypeName[cabin]) {
      const expectedName = cabinToTypeName[cabin]
      const found = types.find(
        (t: AccommodationType) => t.name.toLowerCase() === expectedName.toLowerCase()
      )
      if (found) setTypeId(String(found.id))
      return
    }
    const tid = searchParams.get('typeId')
    if (tid) setTypeId(tid)
  }, [types, searchParams])

  // Determine if user has changed filters from defaults
  const isFiltered = useMemo(() => {
    const t = startOfToday()
    const defaultFrom = addDays(t, 1)
    const defaultTo = addDays(t, 2)
    const isDefaultType = typeId === 'all'
    const isDefaultDates = dateRange?.from && dateRange?.to &&
      isSameDay(dateRange.from, defaultFrom) &&
      isSameDay(dateRange.to, defaultTo)
    const isDefaultGuests = adults === 2 && children === 0
    return !(isDefaultType && isDefaultDates && isDefaultGuests)
  }, [typeId, dateRange, adults, children])

  // Load availability or all objects
  const loadData = useCallback(async () => {
    await Promise.resolve()
    const cabin = searchParams.get('cabin')
    if (cabin && cabinToTypeName[cabin] && !typesReady) {
      return
    }
    setLoading(true)

    if (!isFiltered) {
      const params = new URLSearchParams()
      if (resolvedTypeId && resolvedTypeId !== 'all') params.set('typeId', resolvedTypeId)
      params.set('activeOnly', 'true')
      try {
        const res = await fetch(`${API_BASE}/accommodation/objects?${params.toString()}`)
        const data: Accommodation[] = await res.json()
        setObjects(data)
        setTotalPages(1)
      } catch {
        setObjects([])
      } finally {
        setLoading(false)
      }
      return
    }

    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (resolvedTypeId && resolvedTypeId !== 'all') params.set('typeId', resolvedTypeId)
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
    params.set('adults', String(adults))
    params.set('children', String(children))

    try {
      const res = await fetch(`${API_BASE}/accommodation/availability?${params.toString()}`)
      const data: Accommodation[] = await res.json()
      setObjects(data)
      setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) + (data.length === pageSize ? 1 : 0)))
    } catch {
      setObjects([])
    } finally {
      setLoading(false)
    }
  }, [isFiltered, resolvedTypeId, dateRange, page, adults, children, typesReady, searchParams])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Update URL params (мержим с текущим query, чтобы не терять ?cabin= до загрузки типов)
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (typeId && typeId !== 'all') {
          params.set('typeId', typeId)
          params.delete('cabin')
        } else {
          params.delete('typeId')
        }
        if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
        else params.delete('checkIn')
        if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
        else params.delete('checkOut')
        if (page > 1) params.set('page', String(page))
        else params.delete('page')
        params.set('adults', String(adults))
        params.set('children', String(children))
        return params
      },
      { replace: true },
    )
  }, [typeId, dateRange, page, adults, children, setSearchParams])

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

  const [calendarMonths, setCalendarMonths] = useState(1)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setCalendarMonths(mq.matches ? 2 : 1)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
  }

  // Fetch booked dates for disabled calendar days
  useEffect(() => {
    const typeIdNum = resolvedTypeId && resolvedTypeId !== 'all' ? Number(resolvedTypeId) : null
    if (!typeIdNum || isNaN(typeIdNum)) {
      setBookedDates([])
      return
    }
    fetch(`${API_BASE}/accommodation/booked-dates?typeId=${typeIdNum}`)
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
  }, [resolvedTypeId])

  const handleResetFilters = () => {
    setTypeId('all')
    const t = startOfToday()
    setDateRange({ from: addDays(t, 1), to: addDays(t, 2) })
    setAdults(2)
    setChildren(0)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-lightgray">
        <main className="container-main py-8 md:py-12 pt-24 md:pt-28">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2">Бронирование размещения</h1>
          <p className="text-graytext">Выберите даты и тип размещения, чтобы найти свободные варианты</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:flex-wrap items-stretch lg:items-end gap-4">
            {/* Type selector */}
            <div className="flex-[1_1_200px] min-w-[200px]">
              <label className="text-sm font-medium text-dark mb-1.5 block">Тип размещения</label>
              <Select value={typeId} onValueChange={(v) => { setTypeId(v); setPage(1) }}>
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                          onClick={() => { setAdults((a) => Math.max(1, a - 1)); setPage(1) }}
                          aria-label="Уменьшить число взрослых"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{adults}</span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={adults >= 20}
                          onClick={() => { setAdults((a) => Math.min(20, a + 1)); setPage(1) }}
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
                          onClick={() => { setChildren((c) => Math.max(0, c - 1)); setPage(1) }}
                          aria-label="Уменьшить число детей"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{children}</span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={children >= 10}
                          onClick={() => { setChildren((c) => Math.min(10, c + 1)); setPage(1) }}
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
                onClick={() => { setPage(1); loadData() }}
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
          <div className="text-center py-16">
            <BedDouble className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dark mb-2">Нет доступных вариантов</h3>
            <p className="text-graytext">Попробуйте изменить даты или тип размещения</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className="group bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[16/10] overflow-hidden relative bg-gray-100">
                    {obj.images && obj.images.length > 0 ? (
                      <Carousel className="w-full h-full">
                        <CarouselContent className="h-full">
                          {obj.images.map((img) => (
                            <CarouselItem key={img.id} className="h-full pl-0">
                              <img
                                src={img.imageUrl}
                                alt={obj.name}
                                className="w-full h-full object-contain"
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 size-7 bg-white/70 hover:bg-white border-0 text-dark" />
                        <CarouselNext className="right-2 top-1/2 -translate-y-1/2 size-7 bg-white/70 hover:bg-white border-0 text-dark" />
                      </Carousel>
                    ) : (
                      <img
                        src={obj.imageUrl || '/assets/asset_7.webp'}
                        alt={obj.name}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20">
                        {obj.type?.name || 'Размещение'}
                      </span>
                    </div>
                  </div>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page - 1) }}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); handlePageChange(i + 1) }}
                        isActive={page === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(page + 1) }}
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>
    </div>
  )
}
