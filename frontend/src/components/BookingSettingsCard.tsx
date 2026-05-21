import { useState } from 'react'
import { CalendarClock, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { toast } from 'sonner'

const API_BASE = '/api'

/** Глобальный переключатель публичного бронирования на админ-дашборде. */
export function BookingSettingsCard() {
  const { bookingPublicEnabled, loading, refetch } = useSiteSettings()
  const [saving, setSaving] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/site-settings/admin/booking-public`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingPublicEnabled: checked }),
      })
      if (!res.ok) throw new Error('save failed')
      await refetch()
      toast.success(
        checked
          ? 'Онлайн-бронирование включено для посетителей'
          : 'Онлайн-бронирование отключено — только просмотр размещений',
      )
    } catch {
      toast.error('Не удалось сохранить настройку бронирования')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-6 border shadow-sm">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <CalendarClock className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-dark">Онлайн-бронирование</p>
            <p className="text-sm text-graytext mt-0.5">
              {loading || saving ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Загрузка…
                </span>
              ) : bookingPublicEnabled ? (
                'Включено: кнопка «Забронировать» на карточках размещений активна'
              ) : (
                'Выключено: на карточках домов — «Бронирование по телефону», онлайн-заказ отключён'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:shrink-0">
          <span className="text-sm text-graytext">
            {bookingPublicEnabled ? 'Вкл' : 'Выкл'}
          </span>
          <Switch
            checked={bookingPublicEnabled}
            onCheckedChange={handleToggle}
            disabled={loading || saving}
            aria-label="Онлайн-бронирование"
          />
        </div>
      </CardContent>
    </Card>
  )
}
