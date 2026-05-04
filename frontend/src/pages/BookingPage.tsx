import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { format, addDays, startOfToday, compareAsc, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DateRange, OnSelectHandler } from 'react-day-picker'
import {
  CalendarIcon,
  Users,
  BedDouble,
} from 'lucide-react'

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

const API_BASE = '/api'

interface AccommodationType {
  id: number
  name: string
  description?: string
  capacity: number
  pricePerNight: number
  imageUrl?: string
  isActive: boolean
  sortOrder: number
}

interface Accommodation {
  id: number
  name: string
  description?: string
  typeId: number
  imageUrl?: string
  isActive: boolean
  sortOrder: number
  type?: AccommodationType
}

function formatShortDate(d: Date | undefined): string {
  if (!d) return '—'
  return format(d, 'dd.MM.yyyy')
}

export default function BookingPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [types, setTypes] = useState<AccommodationType[]>([])
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
  const [datesOpen, setDatesOpen] = useState(false)
  const [page, setPage] = useState(Number(searchParams.get('page') || '1'))

  const pageSize = 10

  // Load types
  useEffect(() => {
    fetch(`${API_BASE}/accommodation/types`)
      .then((r) => r.json())
      .then((data) => setTypes(data))
      .catch(() => setTypes([]))
  }, [])

  // Load availability
  const loadAvailability = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (typeId && typeId !== 'all') params.set('typeId', typeId)
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))

    fetch(`${API_BASE}/accommodation/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((data: Accommodation[]) => {
        setObjects(data)
        // Approximate total pages from response length; backend doesn't return total count in this simplified setup
        setTotalPages(Math.max(1, Math.ceil(data.length / pageSize) + (data.length === pageSize ? 1 : 0)))
      })
      .catch(() => setObjects([]))
      .finally(() => setLoading(false))
  }, [typeId, dateRange, page])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (typeId && typeId !== 'all') params.set('typeId', typeId)
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
    if (page > 1) params.set('page', String(page))
    setSearchParams(params, { replace: true })
  }, [typeId, dateRange, page, setSearchParams])

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

  return (
    <div className="min-h-screen bg-lightgray">
        <main className="container-main py-8 md:py-12 pt-24 md:pt-28">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2">Бронирование проживания</h1>
          <p className="text-graytext">Выберите даты и тип размещения, чтобы найти свободные варианты</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
            {/* Type selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-dark mb-1.5 block">Тип проживания</label>
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
            <div className="flex-1 min-w-[280px]">
              <label className="text-sm font-medium text-dark mb-1.5 block">Даты проживания</label>
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
                    disabled={{ before: startOfToday() }}
                    defaultMonth={dateRange?.from ?? addDays(startOfToday(), 1)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search button */}
            <Button
              className="h-11 px-8 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl"
              onClick={() => { setPage(1); loadAvailability() }}
            >
              Найти
            </Button>
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
            <p className="text-graytext">Попробуйте изменить даты или тип проживания</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className="group bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={obj.imageUrl || '/assets/asset_7.jpg'}
                      alt={obj.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-black/40 backdrop-blur-md border border-white/20">
                        {obj.type?.name || 'Проживание'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-dark mb-1">{obj.name}</h3>
                    {obj.description && (
                      <p className="text-sm text-graytext mb-3 line-clamp-2">{obj.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-graytext">
                        {obj.type?.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            До {obj.type.capacity} чел.
                          </span>
                        )}
                        {obj.type?.pricePerNight && (
                          <span className="font-medium text-dark">
                            {obj.type.pricePerNight.toLocaleString('ru-RU')} ₽/ночь
                          </span>
                        )}
                      </div>
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
