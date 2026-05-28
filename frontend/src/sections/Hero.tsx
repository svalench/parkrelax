import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { addDays, format, startOfToday } from 'date-fns'
import type { DateRange } from 'react-day-picker'

import { DateRangePicker } from '@/components/DateRangePicker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** Типы размещения с бэка (как в секции «Размещение» и на странице бронирования). */
interface AccommodationType {
  id: number
  name: string
  isActive: boolean
  showInListing?: boolean
  sortOrder: number
}

export default function Hero() {
  const navigate = useNavigate()

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const t = startOfToday()
    return { from: addDays(t, 1), to: addDays(t, 2) }
  })

  const [datesOpen, setDatesOpen] = useState(false)
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

      {/* Логотип слева на тёмном фоне — на десктопе крупнее, заполняет левую зону градиента */}
      <div className="absolute top-20 left-4 sm:left-6 md:top-24 lg:top-24 lg:left-8 xl:left-10 z-10 pointer-events-none w-[min(68vw,354px)] sm:w-[min(65vw,415px)] md:w-[min(41vw,366px)] lg:w-[min(26vw,519px)] xl:w-[min(27vw,612px)] 2xl:w-[min(28vw,680px)]">
        <img
          src="/images/logo_cater.svg"
          alt="Парк Relax"
          className="w-full h-auto object-contain animate-sun-glow opacity-90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
        />
        <p className="mt-2 text-sm sm:text-base text-white/90 font-medium leading-snug drop-shadow-md">
          все для отдыха на природе
        </p>
      </div>

      {/* Основной контент */}
      <div className="relative z-10 flex-1 flex items-center pt-40 sm:pt-48 md:pt-40 lg:pt-[min(30vh,16rem)] xl:pt-[min(31vh,18rem)]">
        <div className="container-main w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
            <div className="max-w-2xl w-full">
              <p className="text-base md:text-lg text-white/90 leading-relaxed mb-3 max-w-[520px] mx-auto md:mx-0 text-center sm:text-left">
                Чистый лесной воздух, мягкий белоснежный песок и живописная природа — идеальные условия для незабываемого отдыха на берегу лесного озера.
              </p>
              <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-[520px] mx-auto md:mx-0 text-center sm:text-left">
                Отдохните и насладитесь уникальной природой в Комплексе отдыха Парк Relax!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Панель бронирования */}
      <div className="relative z-20 w-full pb-4 md:pb-6">
        <div className="container-main">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
            Бронирование размещения
          </h3>
          <div className="bg-white/[0.08] backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-2.5 md:p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
              <div className="shrink-0 min-w-0 lg:flex-[1_1_200px] lg:border-r lg:border-white/15 lg:pr-3">
                <DateRangePicker
                  variant="hero"
                  value={dateRange}
                  onChange={setDateRange}
                  side="top"
                  align="start"
                  open={datesOpen}
                  onOpenChange={setDatesOpen}
                />
              </div>

              <div className="flex items-start lg:items-center gap-3 lg:border-l border-gray-100 lg:pl-4 min-w-[160px]">
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
