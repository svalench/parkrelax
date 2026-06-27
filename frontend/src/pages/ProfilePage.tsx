import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar, Home, Users, LogOut, Mail, User, Shield, Cookie, FileText, CreditCard, XCircle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { Link } from 'react-router'
import { revokeCookieConsent } from '@/components/CookieBanner'

const API_BASE = '/api'

interface BookingItem {
  id: number
  startDate: string
  endDate: string
  status: string
  adults: number
  children: number
  accommodation?: {
    id: number
    name: string
    imageUrl?: string
    type?: { name: string; capacity: number; pricePerNight: number }
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'Ожидает подтверждения',
  pending: 'Ожидает оплаты',
  paid: 'Оплачено',
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'paid':
    case 'confirmed':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'pending_confirmation':
      return 'bg-amber-100 text-amber-800'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [bookingPaymentMode, setBookingPaymentMode] = useState<'manual_confirmation' | 'auto_payment'>('manual_confirmation')

  async function fetchCsrfToken(): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' })
      if (!res.ok) return null
      const data = await res.json()
      return data.csrfToken || null
    } catch {
      return null
    }
  }

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Отменить бронирование? Условия возврата предоплаты — в Правилах возврата средств.')) {
      return
    }
    setCancellingId(bookingId)
    try {
      const csrf = await fetchCsrfToken()
      const res = await fetch(`${API_BASE}/profile/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf || '' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : 'Не удалось отменить бронирование')
      }
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка отмены')
    } finally {
      setCancellingId(null)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }
    setLoadError('')
    fetch(`${API_BASE}/profile/bookings`, { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) {
          const detail = typeof data.detail === 'string' ? data.detail : 'Не удалось загрузить бронирования'
          throw new Error(detail)
        }
        if (!Array.isArray(data)) {
          throw new Error('Некорректный ответ сервера')
        }
        setBookings(data)
      })
      .catch((err: Error) => {
        setBookings([])
        setLoadError(err.message || 'Не удалось загрузить бронирования')
      })
      .finally(() => setLoading(false))
  }, [user, authLoading, navigate])

  useEffect(() => {
    fetch(`${API_BASE}/payment/public-settings`)
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (data.bookingPaymentMode === 'auto_payment') {
          setBookingPaymentMode('auto_payment')
        }
      })
      .catch(() => {
        setBookingPaymentMode('manual_confirmation')
      })
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-lightgray flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-lightgray pt-24 md:pt-28 pb-12">
      <div className="container-main max-w-3xl">
        <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark mb-1">Личный кабинет</h1>
              <div className="flex items-center gap-4 text-sm text-graytext mt-2">
                <span className="flex items-center gap-1"><User className="w-4 h-4" />{user.name || 'Гость'}</span>
                <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{user.email}</span>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand" />
            Приватность и согласия
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm font-medium text-dark">Политика конфиденциальности</p>
                  <p className="text-xs text-graytext">Ознакомьтесь с условиями обработки данных</p>
                </div>
              </div>
              <Link
                to="/legal/privacy-policy"
                target="_blank"
                className="text-sm text-brand hover:underline font-medium shrink-0"
              >
                Открыть
              </Link>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Cookie className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm font-medium text-dark">Файлы cookie</p>
                  <p className="text-xs text-graytext">Отозвать согласие на использование cookie</p>
                </div>
              </div>
              <button
                onClick={() => {
                  revokeCookieConsent()
                  window.location.reload()
                }}
                className="text-sm text-brand hover:underline font-medium shrink-0"
              >
                Отозвать
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-dark mb-4">Мои бронирования</h2>

        {loadError && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 mb-4 text-center">
            <p className="text-red-600 text-sm">{loadError}</p>
          </div>
        )}

        {!loadError && bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-graytext">У вас пока нет бронирований</p>
            <Button
              onClick={() => navigate('/booking')}
              variant="outline"
              className="mt-4 rounded-xl"
            >
              Забронировать размещение
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const nights = Math.max(1, differenceInDays(new Date(b.endDate), new Date(b.startDate)))
              const total = b.accommodation?.type?.pricePerNight ? nights * b.accommodation.type.pricePerNight : 0
              return (
                <div key={b.id} className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col md:flex-row gap-5">
                  <img
                    src={b.accommodation?.imageUrl || '/assets/asset_7.webp'}
                    alt={b.accommodation?.name}
                    className="w-full md:w-40 h-32 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h3 className="font-semibold text-dark text-lg">{b.accommodation?.name || 'Размещение'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusBadgeClass(b.status)}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-graytext">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />
                        {format(new Date(b.startDate), 'dd.MM.yyyy')} — {format(new Date(b.endDate), 'dd.MM.yyyy')}
                      </span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />
                        {b.adults + b.children} гостей ({nights} ночей)
                      </span>
                    </div>
                    {total > 0 && (
                      <p className="mt-3 text-brand font-bold">{total.toLocaleString('ru-RU')} Br</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(b.status === 'pending' || (bookingPaymentMode === 'auto_payment' && b.status === 'pending_confirmation')) && (
                        <Button
                          onClick={() => navigate(`/payment?bookingId=${b.id}`)}
                          className="rounded-xl bg-brand hover:bg-brand-hover text-white"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Оплатить
                        </Button>
                      )}
                      {['pending_confirmation', 'pending', 'paid', 'confirmed'].includes(b.status) && (
                        <Button
                          variant="outline"
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {cancellingId === b.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Отменить
                        </Button>
                      )}
                    </div>
                    {['pending_confirmation', 'pending', 'paid', 'confirmed'].includes(b.status) && (
                      <p className="mt-2 text-xs text-graytext">
                        Условия возврата —{' '}
                        <Link to="/legal/refund-policy" className="text-brand hover:underline">
                          Правила возврата средств
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
