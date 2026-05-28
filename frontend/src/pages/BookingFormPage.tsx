import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { format, differenceInDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Calendar, Users, ArrowLeft, Home, Phone, Mail, User, CheckCircle, Clock } from 'lucide-react'
import { useBookingSession } from '@/hooks/use-booking-session'
import { useAuth } from '@/contexts/AuthContext'
import { AccommodationFeatureTags, type AccommodationFeature } from '@/components/AccommodationFeatureTags'

const API_BASE = '/api'

interface AccommodationTypeInfo {
  name: string
  capacity: number
  pricePerNight: number
  priceUnit?: string
  pricingModel?: string
  childPricePerNight?: number | null
}

interface Accommodation {
  id: number
  name: string
  imageUrl?: string
  type?: AccommodationTypeInfo
  features?: AccommodationFeature[]
  isBookedForDates?: boolean
}

export default function BookingFormPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const accommodationId = Number(searchParams.get('accommodationId'))
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formReady, setFormReady] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)

  useEffect(() => {
    if (!user) return
    if (user.name && !name) setName(user.name)
    if (user.email && !email) setEmail(user.email)
  }, [user, name, email])

  const sessionParams = useMemo(() => {
    if (!accommodationId || !checkIn || !checkOut) return null
    return { accommodationId, checkIn, checkOut }
  }, [accommodationId, checkIn, checkOut])

  const bookingListUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    const q = params.toString()
    return q ? `/booking?${q}` : '/booking'
  }, [checkIn, checkOut])

  const { active: sessionActive, countdown, isUrgent } = useBookingSession(sessionParams, {
    enabled: formReady && Boolean(sessionParams),
    onExpireNavigateTo: bookingListUrl,
  })

  const backToBookingSelection = () => {
    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    navigate(`/booking?${params.toString()}`)
  }

  useEffect(() => {
    if (!accommodationId || !checkIn || !checkOut) {
      setError('Не указаны параметры бронирования')
      setFormReady(false)
      setAccommodation(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    setFormReady(false)
    setAccommodation(null)

    const params = new URLSearchParams()
    params.set('checkIn', checkIn)
    params.set('checkOut', checkOut)
    params.set('adults', String(adults))
    params.set('children', String(children))

    fetch(`${API_BASE}/accommodation/objects/${accommodationId}/availability-check?${params.toString()}`)
      .then(async (r) => {
        const data = await r.json()
        if (cancelled) return

        if (!r.ok) {
          setError(typeof data.detail === 'string' ? data.detail : 'Не удалось проверить доступность')
          return
        }

        const result = data as { available: boolean; accommodation?: Accommodation }
        if (!result.available || !result.accommodation) {
          navigate(bookingListUrl, {
            replace: true,
            state: { accommodationOccupied: true },
          })
          return
        }

        setAccommodation(result.accommodation)
        setFormReady(true)
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить данные')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [accommodationId, checkIn, checkOut, adults, children, bookingListUrl, navigate])

  const isPerPerson = accommodation?.type?.pricingModel === 'per_person'
  const nights = checkIn && checkOut ? Math.max(1, differenceInDays(new Date(checkOut), new Date(checkIn))) : 0
  const totalPrice = useMemo(() => {
    if (!accommodation?.type?.pricePerNight || nights <= 0) return 0
    if (isPerPerson) {
      const adultPrice = accommodation.type.pricePerNight
      const childPrice = accommodation.type.childPricePerNight ?? adultPrice
      return nights * (adults * adultPrice + children * childPrice)
    }
    return nights * accommodation.type.pricePerNight
  }, [accommodation, adults, children, isPerPerson, nights])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!privacyConsent) {
      setError('Необходимо дать согласие на обработку персональных данных')
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          startDate: checkIn,
          endDate: checkOut,
          adults,
          children,
          accommodationId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Не удалось создать бронирование')
        setShowConfirm(false)
      } else {
        setBookingId(data.id ?? null)
        setShowConfirm(false)
        setShowSuccess(true)
      }
    } catch {
      setError('Ошибка сети')
      setShowConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lightgray flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  if (error && !accommodation) {
    return (
      <div className="min-h-screen bg-lightgray pt-24 md:pt-28 pb-12">
        <div className="container-main max-w-2xl">
          <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 text-center">
            <p className="text-red-500 mb-6">{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={backToBookingSelection}
            >
              Вернуться к выбору
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lightgray pt-24 md:pt-28 pb-12">
      <div className="container-main max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-graytext hover:text-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">Оформление бронирования</h1>

          {sessionActive && (
            <div
              className={`flex items-center gap-2 mt-3 mb-1 rounded-lg px-3 py-2 text-sm ${
                isUrgent
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-gray-50 text-graytext border border-gray-100'
              }`}
              role="status"
              aria-live="polite"
            >
              <Clock className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-amber-600' : 'text-brand'}`} />
              <span>
                Сессия бронирования: осталось <strong className="tabular-nums text-dark">{countdown}</strong>
              </span>
            </div>
          )}

          {accommodation && (
            <div className="flex items-start gap-4 mt-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <img
                src={accommodation.imageUrl || '/assets/asset_7.webp'}
                alt={accommodation.name}
                className="w-24 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-dark">{accommodation.name}</h3>
                <p className="text-sm text-graytext">{accommodation.type?.name}</p>
                <div className="flex items-center gap-3 text-sm text-graytext mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{nights} ночей</span>
                  {isPerPerson ? (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      до {accommodation.type?.capacity} чел/сутки
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      до {accommodation.type?.capacity} чел.
                    </span>
                  )}
                </div>
                <AccommodationFeatureTags features={accommodation.features} className="mt-2 mb-0" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6" aria-label="Параметры бронирования (нельзя изменить)">
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <Calendar className="w-4 h-4 text-brand shrink-0" />
              <span className="text-graytext">Заезд</span>
              <span className="font-semibold text-dark tabular-nums">
                {checkIn ? format(new Date(checkIn), 'dd.MM.yyyy') : '—'}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
              <Calendar className="w-4 h-4 text-brand shrink-0" />
              <span className="text-graytext">Выезд</span>
              <span className="font-semibold text-dark tabular-nums">
                {checkOut ? format(new Date(checkOut), 'dd.MM.yyyy') : '—'}
              </span>
            </div>
          </div>

          {isPerPerson && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="adults" className="text-sm font-medium text-dark">Взрослые</Label>
                <Input
                  id="adults"
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={adults}
                  onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="children" className="text-sm font-medium text-dark">Дети (3–12 лет)</Label>
                <Input
                  id="children"
                  type="number"
                  min={0}
                  max={50}
                  required
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          {totalPrice > 0 && (
            <div className="mb-6 text-right">
              <p className="text-sm text-graytext">Итого за {nights} ночей</p>
              <p className="text-2xl font-bold text-brand">{totalPrice.toLocaleString('ru-RU')} Br</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-dark">Имя и фамилия</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-dark">Телефон</Label>
              <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" placeholder="+375..." />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-dark">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="your@email.com" />
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <input
                id="privacyConsent"
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand cursor-pointer"
              />
              <label htmlFor="privacyConsent" className="text-xs text-graytext leading-relaxed cursor-pointer">
                Я согласен на обработку персональных данных в соответствии с{' '}
                <a
                  href="/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Политикой конфиденциальности
                </a>
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-base"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Отправить заявку'}
            </Button>
          </form>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-brand" />
            </div>
            <DialogTitle className="text-center">Заявка отправлена!</DialogTitle>
            <DialogDescription className="text-center">
              С вами скоро свяжутся для уточнения заказа по указанным контактам.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Телефон</p>
                  <p className="font-semibold text-dark">{phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Email</p>
                  <p className="font-semibold text-dark">{email || '—'}</p>
                </div>
              </div>
            </div>

            {accommodation && (
              <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl text-center">
                <p className="text-sm text-graytext">Номер заявки</p>
                <p className="text-lg font-bold text-brand">#{bookingId ?? '—'}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate('/')} className="w-full sm:w-auto">
              На главную
            </Button>
            <Button onClick={() => navigate('/profile')} className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white">
              Перейти в профиль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Проверьте данные бронирования</DialogTitle>
            <DialogDescription>
              Пожалуйста, перепроверьте информацию перед отправкой заявки.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {accommodation && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Home className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Размещение</p>
                  <p className="font-semibold text-dark">{accommodation.name} ({accommodation.type?.name})</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Заезд</p>
                  <p className="font-semibold text-dark">{checkIn ? format(new Date(checkIn), 'dd.MM.yyyy') : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Выезд</p>
                  <p className="font-semibold text-dark">{checkOut ? format(new Date(checkOut), 'dd.MM.yyyy') : '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Users className="w-5 h-5 text-brand shrink-0" />
              <div>
                <p className="text-sm text-graytext">Гости</p>
                <p className="font-semibold text-dark">
                  {isPerPerson ? `${adults} взр., ${children} дет.` : `${adults + children} чел.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-brand shrink-0" />
              <div>
                <p className="text-sm text-graytext">Контакт</p>
                <p className="font-semibold text-dark">{name || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Телефон</p>
                  <p className="font-semibold text-dark">{phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Email</p>
                  <p className="font-semibold text-dark">{email || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar className="w-5 h-5 text-brand shrink-0" />
              <div>
                <p className="text-sm text-graytext">Ночей</p>
                <p className="font-semibold text-dark">{nights}</p>
              </div>
            </div>

            {totalPrice > 0 && (
              <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl text-center">
                <p className="text-sm text-graytext">Итого за {nights} ночей</p>
                <p className="text-xl font-bold text-brand">{totalPrice.toLocaleString('ru-RU')} Br</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="w-full sm:w-auto">
              Изменить
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Подтвердить бронирование'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
