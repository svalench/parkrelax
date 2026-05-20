import { useEffect, useState } from 'react'
import { addDays, startOfToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { DateRange, Matcher, OnSelectHandler } from 'react-day-picker'
import { Calendar as CalendarIcon } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatShortDate, selectDateRangeStep } from '@/lib/dateRange'
import { useDateRangeHover } from '@/hooks/use-date-range-hover'
import { cn } from '@/lib/utils'

type DateRangePickerProps = {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  disabled?: Matcher | Matcher[]
  /** Светлая панель в фильтрах или компактный триггер на Hero. */
  variant?: 'default' | 'hero'
  label?: string
  side?: 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  triggerClassName?: string
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
  variant = 'default',
  label,
  side = 'bottom',
  align = 'start',
  open: openControlled,
  onOpenChange: onOpenChangeControlled,
  className,
  triggerClassName,
}: DateRangePickerProps) {
  const [openInternal, setOpenInternal] = useState(false)
  const open = openControlled ?? openInternal
  const setOpen = onOpenChangeControlled ?? setOpenInternal

  // Второй месяц только на широком десктопе — иначе попап слишком широкий
  const [calendarMonths, setCalendarMonths] = useState(1)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)')
    const sync = () => setCalendarMonths(mq.matches ? 2 : 1)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const { hoverModifiers, onDayMouseEnter, onDayMouseLeave } = useDateRangeHover(value)

  const handleRangeSelect: OnSelectHandler<DateRange | undefined> = (
    _range,
    triggerDate,
  ) => {
    if (!triggerDate) return
    const { range, shouldClose } = selectDateRangeStep(value, triggerDate)
    onChange(range)
    if (shouldClose) {
      queueMicrotask(() => setOpen(false))
    }
  }

  const trigger =
    variant === 'hero' ? (
      <button
        type="button"
        className={cn(
          'group flex w-full min-w-0 items-center gap-2.5 rounded-xl bg-transparent px-2 py-1.5 text-left outline-none transition-all duration-200',
          'hover:bg-white/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4)]',
          'focus-visible:ring-2 focus-visible:ring-brand cursor-pointer',
          triggerClassName,
        )}
      >
        <CalendarIcon className="w-5 h-5 text-brand shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/75 sm:hidden">
            Даты
          </span>
          <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white tabular-nums">
            <span className="truncate">{formatShortDate(value?.from)}</span>
            <span className="text-white/50 shrink-0">—</span>
            <span className="truncate">{formatShortDate(value?.to)}</span>
          </div>
        </div>
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          'flex h-11 w-full items-center gap-3 rounded-xl border border-input bg-transparent px-3 text-left outline-none transition-all',
          'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
          triggerClassName,
        )}
      >
        <CalendarIcon className="w-5 h-5 text-brand shrink-0" />
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="font-medium truncate">{formatShortDate(value?.from)}</span>
          <span className="text-muted-foreground shrink-0">—</span>
          <span className="font-medium truncate">{formatShortDate(value?.to)}</span>
        </div>
      </button>
    )

  return (
    <div className={cn(className)}>
      {label && variant === 'default' && (
        <label className="text-sm font-medium text-dark mb-1.5 block">{label}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align={align}
          side={side}
          sideOffset={variant === 'hero' ? 12 : 8}
          collisionPadding={12}
          className={cn(
            'w-max overflow-hidden rounded-xl border border-border/70 bg-popover p-0 shadow-lg ring-1 ring-black/5',
            calendarMonths === 1
              ? 'max-w-[min(calc(100vw-1.5rem),16.5rem)]'
              : 'max-w-[min(calc(100vw-1.5rem),33rem)]',
          )}
        >
          <Calendar
            mode="range"
            locale={ru}
            showOutsideDays={false}
            numberOfMonths={calendarMonths}
            selected={value}
            onSelect={handleRangeSelect}
            disabled={disabled ?? { before: startOfToday() }}
            defaultMonth={value?.from ?? addDays(startOfToday(), 1)}
            modifiers={hoverModifiers}
            onDayMouseEnter={onDayMouseEnter}
            onDayMouseLeave={onDayMouseLeave}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
