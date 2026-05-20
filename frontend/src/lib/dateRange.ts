import { compareAsc, format, startOfDay } from 'date-fns'
import type { DateRange } from 'react-day-picker'

/** Короткий формат: 25.06.2025 */
export function formatShortDate(d: Date | undefined): string {
  if (!d) return '—'
  return format(d, 'dd.MM.yyyy')
}

/** Следующий шаг выбора диапазона: 1-й клик — заезд, 2-й — выезд. */
export function selectDateRangeStep(
  prev: DateRange | undefined,
  triggerDate: Date,
): { range: DateRange; shouldClose: boolean } {
  const day = startOfDay(triggerDate)

  if (prev?.from && prev?.to) {
    return { range: { from: day, to: undefined }, shouldClose: false }
  }

  if (prev?.from && !prev.to) {
    let from = startOfDay(prev.from)
    let to = day
    if (compareAsc(from, to) > 0) {
      const t = from
      from = to
      to = t
    }
    return { range: { from, to }, shouldClose: true }
  }

  return { range: { from: day, to: undefined }, shouldClose: false }
}
