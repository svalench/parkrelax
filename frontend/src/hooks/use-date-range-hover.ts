import { compareAsc, isAfter, isBefore, isSameDay, startOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'

/** Превью диапазона при наведении до выбора даты выезда. */
export function useDateRangeHover(dateRange: DateRange | undefined) {
  const [hoverDate, setHoverDate] = useState<Date | undefined>(undefined)

  const { hoverFrom, hoverTo } = useMemo(() => {
    if (!dateRange?.from || dateRange.to || !hoverDate) {
      return { hoverFrom: undefined, hoverTo: undefined }
    }
    const fromDay = startOfDay(dateRange.from)
    const hoverDay = startOfDay(hoverDate)
    if (compareAsc(fromDay, hoverDay) > 0) {
      return { hoverFrom: hoverDay, hoverTo: fromDay }
    }
    return { hoverFrom: fromDay, hoverTo: hoverDay }
  }, [dateRange?.from, dateRange?.to, hoverDate])

  const hoverModifiers = useMemo(
    () => ({
      hoverStart: (d: Date) => (hoverFrom ? isSameDay(d, hoverFrom) : false),
      hoverMiddle: (d: Date) =>
        hoverFrom && hoverTo ? isAfter(d, hoverFrom) && isBefore(d, hoverTo) : false,
      hoverEnd: (d: Date) => (hoverTo ? isSameDay(d, hoverTo) : false),
    }),
    [hoverFrom, hoverTo],
  )

  const onDayMouseEnter = (day: Date) => {
    if (dateRange?.from && !dateRange?.to) {
      setHoverDate(day)
    }
  }

  const onDayMouseLeave = () => setHoverDate(undefined)

  return { hoverModifiers, onDayMouseEnter, onDayMouseLeave }
}
