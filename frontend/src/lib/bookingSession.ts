/** Длительность сессии оформления бронирования (15 минут). */
export const BOOKING_SESSION_MS = 15 * 60 * 1000

export function formatSessionCountdown(msLeft: number): string {
  const totalSec = Math.max(0, Math.ceil(msLeft / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}
