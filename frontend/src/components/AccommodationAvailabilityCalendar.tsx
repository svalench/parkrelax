import { useEffect, useState, useMemo } from 'react'
import { format, startOfToday, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'

import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const API_BASE = '/api'

interface BookedRange {
  startDate: string
  endDate: string
}

interface AccommodationAvailabilityCalendarProps {
  accommodationId: number
  accommodationName: string
}

export function AccommodationAvailabilityCalendar({
  accommodationId,
  accommodationName,
}: AccommodationAvailabilityCalendarProps) {
  const [open, setOpen] = useState(false)
  const [bookedDates, setBookedDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${API_BASE}/accommodation/objects/${accommodationId}/booked-dates`)
      .then((r) => r.json())
      .then((data: BookedRange[]) => {
        const dates: Date[] = []
        for (const range of data) {
          const start = parseISO(range.startDate)
          const end = parseISO(range.endDate)
          const d = new Date(start)
          while (d < end) {
            dates.push(new Date(d))
            d.setDate(d.getDate() + 1)
          }
        }
        setBookedDates(dates)
      })
      .catch(() => setBookedDates([]))
      .finally(() => setLoading(false))
  }, [open, accommodationId])

  const bookedSet = useMemo(() => {
    const set = new Set<string>()
    for (const d of bookedDates) {
      set.add(format(d, 'yyyy-MM-dd'))
    }
    return set
  }, [bookedDates])

  const isBooked = (date: Date) => bookedSet.has(format(date, 'yyyy-MM-dd'))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover transition-colors"
        title="Календарь занятости"
      >
        <CalendarIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Календарь</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] w-auto sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold text-dark">
              Занятость: {accommodationName}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Calendar
                  locale={ru}
                  captionLayout="dropdown"
                  defaultMonth={startOfToday()}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 3}
                  disabled={{ before: startOfToday() }}
                  modifiers={{
                    booked: (d) => isBooked(d),
                  }}
                  modifiersClassNames={{
                    booked:
                      'bg-red-100 text-red-600 hover:bg-red-200 rounded-md',
                  }}
                  className="w-full"
                />

                <div className="flex items-center gap-4 mt-4 text-xs text-graytext">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-white border border-gray-200" />
                    <span>Свободно</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
                    <span>Занято</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 opacity-50" />
                    <span>Прошедшие</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
