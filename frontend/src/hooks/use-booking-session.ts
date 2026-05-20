import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { BOOKING_SESSION_MS, formatSessionCountdown } from '@/lib/bookingSession'

type BookingSessionParams = {
  accommodationId: number
  checkIn: string
  checkOut: string
  people: number
}

type UseBookingSessionOptions = {
  enabled: boolean
  onExpireNavigateTo: string
}

/**
 * Таймер 15 минут на странице оформления.
 * При каждом заходе/обновлении страницы отсчёт начинается заново (без sessionStorage).
 */
export function useBookingSession(
  params: BookingSessionParams | null,
  options: UseBookingSessionOptions,
) {
  const navigate = useNavigate()
  const expiredRef = useRef(false)
  const startedAtRef = useRef<number | null>(null)
  const [msLeft, setMsLeft] = useState(BOOKING_SESSION_MS)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!options.enabled || !params?.accommodationId || !params.checkIn || !params.checkOut) {
      setActive(false)
      startedAtRef.current = null
      return
    }

    expiredRef.current = false
    startedAtRef.current = Date.now()
    setActive(true)
    setMsLeft(BOOKING_SESSION_MS)

    const startedAt = startedAtRef.current

    const tick = () => {
      const left = BOOKING_SESSION_MS - (Date.now() - startedAt)
      if (left <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true
          navigate(options.onExpireNavigateTo, {
            replace: true,
            state: { bookingSessionExpired: true },
          })
        }
        setMsLeft(0)
        return
      }
      setMsLeft(left)
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [
    options.enabled,
    options.onExpireNavigateTo,
    params?.accommodationId,
    params?.checkIn,
    params?.checkOut,
    params?.people,
    navigate,
  ])

  return {
    active,
    msLeft,
    countdown: formatSessionCountdown(msLeft),
    isUrgent: msLeft > 0 && msLeft <= 3 * 60 * 1000,
  }
}
