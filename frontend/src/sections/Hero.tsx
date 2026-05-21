import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { addDays, format, startOfToday } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { ChevronDown, Minus, Plus, Users } from 'lucide-react'

import { DateRangePicker } from '@/components/DateRangePicker'
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

const MAX_PEOPLE = 30

/** Типы размещения с бэка (как в секции «Размещение» и на странице бронирования). */
interface AccommodationType {
  id: number
  name: string
  isActive: boolean
  showInListing?: boolean
  sortOrder: number
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

export default function Hero() {
  const navigate = useNavigate()

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const t = startOfToday()
    return { from: addDays(t, 1), to: addDays(t, 2) }
  })

  const [datesOpen, setDatesOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [people, setPeople] = useState(2)
  /** «Любой» или id типа из админки. */
  const [typeFilterId, setTypeFilterId] = useState<string>('any')
  const [accommodationTypes, setAccommodationTypes] = useState<AccommodationType[]>([])

  // Типы жилья с API (активные, порядок как в админке)
  useEffect(() => {
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = Array.isArray(data)
          ? (data as AccommodationType[]).filter((t) => t.showInListing !== false)
          : []
        setAccommodationTypes(list)
        setTypeFilterId((prev) => {
          if (prev === 'any') return prev
          return list.some((t) => String(t.id) === prev) ? prev : 'any'
        })
      })
      .catch(() => setAccommodationTypes([]))
  }, [])

  const handleBook = () => {
    const params = new URLSearchParams()
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'))
    params.set('people', String(people))
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
              {/* Даты — один триггер и общая логика выбора диапазона */}
              <div className="flex-[1_1_200px] min-w-0 lg:border-r lg:border-white/15 lg:pr-3">
                <DateRangePicker
                  variant="hero"
                  value={dateRange}
                  onChange={setDateRange}
                  side="top"
                  align="start"
                  open={datesOpen}
                  onOpenChange={(open) => {
                    setDatesOpen(open)
                    if (open) setGuestsOpen(false)
                  }}
                />
              </div>

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
                          {formatGuestsLabel(people)}
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
                          onClick={() => setPeople((p) => Math.max(1, p - 1))}
                          aria-label="Уменьшить число человек"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {people}
                        </span>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={people >= MAX_PEOPLE}
                          onClick={() => setPeople((p) => Math.min(MAX_PEOPLE, p + 1))}
                          aria-label="Увеличить число человек"
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
