import { useEffect, useState, useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { format, addDays, startOfToday } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import {
  Users,
  BedDouble,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import { DateRangePicker } from '@/components/DateRangePicker'
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

import { AccommodationCard } from '@/components/AccommodationCard'

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
  isBookedForDates?: boolean
}

/** Склонение для строки гостей «N человек». */
function formatGuestsLabel(people: number): string {
  let word: string
  if (people % 10 === 1 && people % 100 !== 11) {
    word = 'человек'
  } else if (people % 10 >= 2 && people % 10 <= 4 && (people % 100 < 10 || people % 100 >= 20)) {
    word = 'человека'
  } else {
    word = 'человек'
  }
  return `${people} ${word}`
}

export default function BookingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  type BookingRedirectState = {
    bookingSessionExpired?: boolean
    accommodationOccupied?: boolean
  }

  const redirectState = location.state as BookingRedirectState | null
  const [sessionExpiredBanner, setSessionExpiredBanner] = useState(
    () => Boolean(redirectState?.bookingSessionExpired),
  )
  const [occupiedBanner, setOccupiedBanner] = useState(
    () => Boolean(redirectState?.accommodationOccupied),
  )

  useEffect(() => {
    if (redirectState?.bookingSessionExpired || redirectState?.accommodationOccupied) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }
  }, [location.pathname, location.search, redirectState, navigate])

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
  const [people, setPeople] = useState<number>(Number(searchParams.get('people') || '2'))
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [page, setPage] = useState(Number(searchParams.get('page') || '1'))
  const [bookedDates, setBookedDates] = useState<Date[]>([])

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

  // Загрузка списка с учётом занятости на выбранные даты
  const loadData = useCallback(async () => {
    await Promise.resolve()
    const cabin = searchParams.get('cabin')
    if (cabin && cabinToTypeName[cabin] && !typesReady) {
      return
    }
    if (!dateRange?.from || !dateRange?.to) {
      setObjects([])
      return
    }

    setLoading(true)

    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (resolvedTypeId && resolvedTypeId !== 'all') params.set('typeId', resolvedTypeId)
    params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
    params.set('people', String(people))

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
  }, [resolvedTypeId, dateRange, page, people, typesReady, searchParams])

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
        params.set('people', String(people))
        return params
      },
      { replace: true },
    )
  }, [typeId, dateRange, page, people, setSearchParams])

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
    setPeople(2)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-lightgray">
        <main className="container-main py-8 md:py-12 pt-24 md:pt-28">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2">Бронирование размещения</h1>
          <p className="text-graytext">Выберите даты и тип размещения, чтобы найти свободные варианты</p>
        </div>

        {sessionExpiredBanner && (
          <div
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            <p>Сессия бронирования истекла. Выберите размещение и заполните форму заново.</p>
            <button
              type="button"
              className="shrink-0 text-amber-700 hover:text-amber-900"
              aria-label="Закрыть"
              onClick={() => setSessionExpiredBanner(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {occupiedBanner && (
          <div
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            <p>К сожалению, на выбранные даты это размещение уже занято. Выберите другие даты или другой вариант.</p>
            <button
              type="button"
              className="shrink-0 text-red-700 hover:text-red-900"
              aria-label="Закрыть"
              onClick={() => setOccupiedBanner(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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

            <DateRangePicker
              label="Даты размещения"
              value={dateRange}
              onChange={(range) => {
                setDateRange(range)
                setPage(1)
              }}
              disabled={[...bookedDates, { before: startOfToday() }]}
              className="flex-[1_1_240px] min-w-[200px]"
            />

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
                      <span className="font-medium">{formatGuestsLabel(people)}</span>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-80 rounded-2xl border border-border/70 bg-white p-5 shadow-2xl"
                >
                  <div className="text-sm font-semibold text-dark mb-4">Количество человек</div>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-dark">Гости</div>
                          <div className="text-xs text-graytext">всего человек</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={people <= 1}
                          onClick={() => { setPeople((p) => Math.max(1, p - 1)); setPage(1) }}
                          aria-label="Уменьшить число человек"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{people}</span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={people >= 30}
                          onClick={() => { setPeople((p) => Math.min(30, p + 1)); setPage(1) }}
                          aria-label="Увеличить число человек"
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
                <AccommodationCard
                  key={obj.id}
                  obj={obj}
                  showCalendar
                  isBooked={Boolean(obj.isBookedForDates)}
                  onBookClick={
                    obj.isBookedForDates
                      ? undefined
                      : () => {
                          const params = new URLSearchParams()
                          params.set('accommodationId', String(obj.id))
                          if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
                          if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
                          params.set('people', String(people))
                          window.location.href = `/booking/form?${params.toString()}`
                        }
                  }
                />
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
