import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { addDays, compareAsc, format, isAfter, isBefore, isSameDay, startOfDay, startOfToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DateRange, OnSelectHandler } from 'react-day-picker'
import { Calendar as CalendarIcon, ChevronDown, Minus, Plus, Users } from 'lucide-react'

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

const MAX_ADULTS = 20
const MAX_CHILDREN = 10

const cabinOptions = [
  { value: 'any', label: 'Любой' },
  { value: 'cottage', label: 'Коттедж' },
  { value: 'apartments', label: 'Апартаменты' },
  { value: 'summer', label: 'Летние домики' },
  { value: 'terrace', label: 'Терраса с баней' },
]

/** Короткий формат даты как на макете: 25.06.2025 */
function formatShortDate(d: Date | undefined): string {
  if (!d) return '—'
  return format(d, 'dd.MM.yyyy')
}

/** Склонение для строки «N взрослых». */
function formatAdultsLabel(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} взрослый`
  return `${n} взрослых`
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
  const [cabin, setCabin] = useState('any')

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
    if (cabin !== 'any') params.set('cabin', cabin)
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
          alt="Озеро с деревянным мостком в Парк Relax"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      </div>

      {/* Логотип в правом верхнем углу — на небе */}
      <div className="hidden lg:block absolute top-16 right-6 xl:right-12 z-10 pointer-events-none">
        <img
          src="/images/logo.svg"
          alt="Парк Relax"
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
                    alt="Парк Relax — лучший комплекс отдыха и проживания на природе"
                    className="relative w-full max-w-[min(100%,420px)] h-auto object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] mx-auto md:mx-0"
                  />
                </span>
                <span className="hidden md:block text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.15]">
                  Парк Relax —
                  <br />
                  лучший комплекс
                  <br />
                  отдыха и проживания
                  <br />
                  на природе
                </span>
              </h1>
              <p className="md:hidden text-xl sm:text-2xl font-extrabold text-white leading-snug sm:leading-tight mb-4 max-w-[min(100%,28rem)] mx-auto md:mx-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] text-center sm:text-left tracking-tight">
                Отдохните от городской суеты — наслаждайтесь природой в Парк Relax!
              </p>
              <p className="hidden md:block text-base md:text-lg text-white/90 leading-relaxed mb-3 max-w-[520px] mx-auto md:mx-0 text-center sm:text-left">
                Комфортные домики, чистый воздух, живописная природа и всё для незабываемого отдыха с семьёй и друзьями.
              </p>
              <p className="hidden md:block text-base md:text-lg text-white/90 leading-relaxed max-w-[520px]">
                Отдохните от городской суеты — наслаждайтесь природой в Парк Relax!
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Панель бронирования */}
      <div className="relative z-20 w-full pb-8 md:pb-10">
        <div className="container-main">
          <div className="bg-white/20 backdrop-blur-2xl backdrop-blur-[20px] backdrop-saturate-[1.8] backdrop-contrast-125 rounded-2xl border border-white/25 shadow-inner p-5 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4 drop-shadow-lg">
              Бронирование проживания
            </h3>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
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
                          {formatAdultsLabel(adults)}
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-600 shrink-0" />
                    </button>
                  </PopoverTrigger>
                </div>
                <PopoverContent
                  align="end"
                  side="top"
                  sideOffset={12}
                  className="w-72 rounded-2xl border border-border/70 p-4 shadow-2xl shadow-black/15 ring-1 ring-black/5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-dark">Взрослые</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={adults <= 1}
                          onClick={() => setAdults((a) => Math.max(1, a - 1))}
                          aria-label="Уменьшить число взрослых"
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">
                          {adults}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={adults >= MAX_ADULTS}
                          onClick={() => setAdults((a) => Math.min(MAX_ADULTS, a + 1))}
                          aria-label="Увеличить число взрослых"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-dark">Дети</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={childrenCount <= 0}
                          onClick={() =>
                            setChildrenCount((c) => Math.max(0, c - 1))
                          }
                          aria-label="Уменьшить число детей"
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">
                          {childrenCount}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={childrenCount >= MAX_CHILDREN}
                          onClick={() =>
                            setChildrenCount((c) => Math.min(MAX_CHILDREN, c + 1))
                          }
                          aria-label="Увеличить число детей"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Домик */}
              <div className="flex items-center gap-3 lg:border-l border-gray-100 lg:pl-4 min-w-[160px]">
                <div className="flex w-full flex-col">
                  <label className="text-sm text-white/90 font-semibold mb-0.5 drop-shadow-sm">Домик</label>
                  <Select value={cabin} onValueChange={setCabin}>
                    <SelectTrigger className="w-full border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 text-lg font-extrabold text-white drop-shadow-md hover:bg-white/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer">
                      <SelectValue placeholder="Любой" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabinOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Кнопка */}
              <button
                type="button"
                className="w-full lg:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                onClick={handleBook}
              >
                Найти доступные
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
