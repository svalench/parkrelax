import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface SiteSettingsContextValue {
  bookingPublicEnabled: boolean
  loading: boolean
  refetch: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null)

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider')
  }
  return ctx
}

/** Публичное онлайн-бронирование включено (из БД, по умолчанию false). */
export function useBookingPublicEnabled(): boolean {
  return useSiteSettings().bookingPublicEnabled
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [bookingPublicEnabled, setBookingPublicEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/site-settings')
      if (res.ok) {
        const data = await res.json()
        setBookingPublicEnabled(Boolean(data.bookingPublicEnabled))
      } else {
        setBookingPublicEnabled(false)
      }
    } catch {
      setBookingPublicEnabled(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return (
    <SiteSettingsContext.Provider
      value={{
        bookingPublicEnabled,
        loading,
        refetch: fetchSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  )
}
