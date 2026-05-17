import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { addDays, compareAsc, format, isAfter, isBefore, isSameDay, startOfDay, startOfToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DateRange, OnSelectHandler } from 'react-day-picker'
import { Baby, Calendar as CalendarIcon, ChevronDown, Minus, Plus, Users } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
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

const MAX_ADULTS = 20
const MAX_CHILDREN = 10

/** Типы размещения с бэка (как в секции «Размещение» и на странице бронирования). */
interface AccommodationType {
  id: number
  name: string
  isActive: boolean
  sortOrder: number
}

/** Короткий формат даты как на макете: 25.06.2025 */
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

export default function Hero() {
  const navigate = useNavigate()

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const t = startOfToday()
    return { from: addDays(t, 1), to: addDays(t, 2) }
  })

  const [datesOpen, setDatesOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined)

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
  const [adults, setAdults] = useState(2)
  const [childrenCount, setChildrenCount] = useState(0)
  /** «Любой» или id типа из админки. */
  const [typeFilterId, setTypeFilterId] = useState<string>('any')
  const [accommodationTypes, setAccommodationTypes] = useState<AccommodationType[]>([])

  // Типы жилья с API (активные, порядок как в админке)
  useEffect(() => {
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = Array.isArray(data) ? (data as AccommodationType[]) : []
        setAccommodationTypes(list)
        setTypeFilterId((prev) => {
          if (prev === 'any') return prev
          return list.some((t) => String(t.id) === prev) ? prev : 'any'
        })
      })
      .catch(() => setAccommodationTypes([]))
  }, [])

  // Два месяца рядом только на десктопе (lg ≥ 1024px); планшет/мобайл — один месяц
  const [calendarMonths, setCalendarMonths] = useState(1)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setCalendarMonths(mq.matches ? 2 : 1)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /** 1-й клик — начало, 2-й — конец (меньшая дата заезд, большая выезд); при полном диапазоне следующий клик снова задаёт только начало. */
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

  const handleBook = () => {
    const params = new URLSearchParams()
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
    params.set('adults', String(adults))
    params.set('children', String(childrenCount))
    if (typeFilterId !== 'any') params.set('typeId', typeFilterId)
    navigate({
      pathname: '/booking',
      search: `?${params.toString()}`,
    })
  }

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Фон */}
      <div className="absolute inset-0">
        <img
          src="/assets/hero.webp"
          alt="Озеро с деревянным мостком в Комплексе отдыха Парк Relax"
          className="w-full h-full object-cover"
          width="1600"
          height="747"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      </div>

      {/* Логотип в правом верхнем углу — на небе */}
      <div className="hidden lg:block absolute top-16 right-6 xl:right-12 z-10 pointer-events-none">
        <img
          src="/images/logo.svg"
          alt="Комплекс отдыха Парк Relax"
          className="w-[260px] xl:w-[340px] h-auto object-contain animate-sun-glow opacity-90"
        />
      </div>

      {/* Основной контент */}
      <div className="relative z-10 flex-1 flex items-center pt-20 md:pt-24">
        <div className="container-main w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
            {/* Текст слева */}
            <div className="max-w-2xl w-full">
              {/* До md: логотип вместо многострочного заголовка; с планшета/десктопа — прежний h1 */}
              <h1 className="mb-6 text-white">
                <span className="relative block md:hidden mb-4 px-2 py-1">
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-1/2 h-16 w-[48%] -translate-y-1/2 rounded-full bg-white/22 blur-2xl"
                  />
                  <img
                    src="/images/logo.svg"
                    alt="Комплекс отдыха Парк Relax — лучший комплекс отдыха и размещения на природе"
                    className="relative w-full max-w-[min(100%,420px)] h-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] mx-auto md:mx-0"
                  />
                </span>
                <span className="hidden md:block text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.15]">
                  Комплекс отдыха
                  <br />
                  Парк Relax — все
                  <br />
                  для отдыха на природе
                  <br />

                </span>
              </h1>
              <p className="md:hidden text-xl sm:text-2xl font-extrabold text-white leading-snug sm:leading-tight mb-4 max-w-[min(100%,28rem)] mx-auto md:mx-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] text-center sm:text-left tracking-tight">
                Отдохните от городской суеты — наслаждайтесь природой в Комплексе отдыха Парк Relax!
              </p>
              <p className="hidden md:block text-base md:text-lg text-white/90 leading-relaxed mb-3 max-w-[520px] mx-auto md:mx-0 text-center sm:text-left">
                Чистый воздух, мягкий белоснежный песок и живописная природа — идеальные условия для незабываемого отдыха у воды вместе с семьёй и друзьями.
              </p>
              <p className="hidden md:block text-base md:text-lg text-white/90 leading-relaxed max-w-[520px]">
                Отдохните от городской суеты — наслаждайтесь природой в Комплексе отдыха Парк Relax!
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Панель бронирования */}
      <div className="relative z-20 w-full pb-4 md:pb-6">
        <div className="container-main">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 drop-shadow-lg">
            Бронирование размещения
          </h3>
          <div className="bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-3 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Даты */}
              <Popover
                open={datesOpen}
                onOpenChange={(open) => {
                  setDatesOpen(open)
                  if (open) setGuestsOpen(false)
                }}
              >
                <div className="flex flex-col sm:flex-row flex-1 gap-4 sm:gap-0">
                  {/* Заезд */}
                  <div className="flex-1 flex items-center gap-3 sm:border-r border-gray-100 sm:pr-4">
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="group flex w-full items-center gap-3 rounded-xl bg-transparent p-1.5 -m-1.5 text-left outline-none transition-all duration-200 hover:bg-white/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                      >
                        <CalendarIcon className="w-6 h-6 text-brand shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm text-white/90 font-semibold mb-0.5 drop-shadow-sm">Заезд</div>
                          <div className="text-lg font-extrabold text-white drop-shadow-md">
                            {formatShortDate(dateRange?.from)}
                          </div>
                        </div>
                      </button>
                    </PopoverTrigger>
                  </div>
                  {/* Выезд */}
                  <div className="flex-1 flex items-center gap-3 sm:pl-4">
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="group flex w-full items-center gap-3 rounded-xl bg-transparent p-1.5 -m-1.5 text-left outline-none transition-all duration-200 hover:bg-white/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                      >
                        <CalendarIcon className="w-6 h-6 text-brand shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm text-white/90 font-semibold mb-0.5 drop-shadow-sm">Выезд</div>
                          <div className="text-lg font-extrabold text-white drop-shadow-md">
                            {formatShortDate(dateRange?.to)}
                          </div>
                        </div>
                      </button>
                    </PopoverTrigger>
                  </div>
                </div>
                <PopoverContent
                  align="start"
                  side="top"
                  sideOffset={12}
                  className="w-auto max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/70 bg-popover p-0 shadow-2xl shadow-black/15 ring-1 ring-black/5"
                >
                  <Calendar
                    mode="range"
                    locale={ru}
                    numberOfMonths={calendarMonths}
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    disabled={{ before: startOfToday() }}
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

              {/* Гости */}
              <Popover
                open={guestsOpen}
                onOpenChange={(open) => {
                  setGuestsOpen(open)
                  if (open) setDatesOpen(false)
                }}
              >
                <div className="flex items-center gap-3 lg:border-l border-gray-100 lg:pl-4 min-w-[160px]">
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="group flex w-full items-center gap-3 rounded-xl bg-transparent p-1.5 -m-1.5 text-left outline-none transition-all duration-200 hover:bg-white/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
                    >
                      <Users className="w-6 h-6 text-brand shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-white/90 font-semibold mb-0.5 drop-shadow-sm">Гости</div>
                        <div className="text-lg font-extrabold text-white drop-shadow-md">
                          {formatGuestsLabel(adults, childrenCount)}
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-white/70 shrink-0" />
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent
                  align="end"
                  side="top"
                  sideOffset={12}
                  className="w-80 rounded-2xl border border-border/70 bg-white p-5 shadow-2xl shadow-black/15 ring-1 ring-black/5"
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
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {adults}
                        </span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={adults >= MAX_ADULTS}
                          onClick={() => setAdults((a) => Math.min(MAX_ADULTS, a + 1))}
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
                          disabled={childrenCount <= 0}
                          onClick={() => setChildrenCount((c) => Math.max(0, c - 1))}
                          aria-label="Уменьшить число детей"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {childrenCount}
                        </span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={childrenCount >= MAX_CHILDREN}
                          onClick={() => setChildrenCount((c) => Math.min(MAX_CHILDREN, c + 1))}
                          aria-label="Увеличить число детей"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Домик */}
              <div className="flex items-center gap-3 lg:border-l border-gray-100 lg:pl-4 min-w-[160px]">
                <div className="flex w-full flex-col">
                  <label className="text-sm text-white/90 font-semibold mb-0.5 drop-shadow-sm">Домик</label>
                  <Select value={typeFilterId} onValueChange={setTypeFilterId}>
                    <SelectTrigger className="w-full border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 text-lg font-extrabold text-white drop-shadow-md hover:bg-white/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                      <SelectValue placeholder="Любой" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Любой</SelectItem>
                      {accommodationTypes.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Кнопка */}
              <button
                type="button"
                className="w-full lg:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                onClick={handleBook}
              >
                Забронировать
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
