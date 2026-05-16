import { useEffect, useState } from 'react'
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
import { Loader2, Calendar, Users, ArrowLeft, Home, Phone, Mail, User, CheckCircle } from 'lucide-react'

const API_BASE = '/api'

interface Accommodation {
  id: number
  name: string
  imageUrl?: string
  type?: { name: string; capacity: number; pricePerNight: number }
}

export default function BookingFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const accommodationId = Number(searchParams.get('accommodationId'))
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')

  const [accommodation, setAccommodation] = useState<Accommodation | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [adults, setAdults] = useState(Number(searchParams.get('adults') || '2'))
  const [children, setChildren] = useState(Number(searchParams.get('children') || '0'))
  const [privacyConsent, setPrivacyConsent] = useState(false)

  useEffect(() => {
    if (!accommodationId || !checkIn || !checkOut) {
      setError('Не указаны параметры бронирования')
      return
    }
    setLoading(true)
    fetch(`${API_BASE}/accommodation/objects?activeOnly=true`)
      .then((r) => r.json())
      .then((data: Accommodation[]) => {
        const found = data.find((a) => a.id === accommodationId)
        if (found) setAccommodation(found)
        else setError('Размещение не найдено')
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false))
  }, [accommodationId, checkIn, checkOut])

  const nights = checkIn && checkOut ? Math.max(1, differenceInDays(new Date(checkOut), new Date(checkIn))) : 0
  const totalPrice = accommodation?.type?.pricePerNight ? nights * accommodation.type.pricePerNight : 0

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
          status: 'pending_confirmation',
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

          {accommodation && (
            <div className="flex items-start gap-4 mt-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <img
                src={accommodation.imageUrl || '/assets/asset_7.jpg'}
                alt={accommodation.name}
                className="w-24 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-dark">{accommodation.name}</h3>
                <p className="text-sm text-graytext">{accommodation.type?.name}</p>
                <div className="flex items-center gap-3 text-sm text-graytext mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{nights} ночей</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />до {accommodation.type?.capacity} чел.</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-graytext">Заезд</p>
              <p className="font-semibold text-dark">{checkIn ? format(new Date(checkIn), 'dd.MM.yyyy') : '—'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-graytext">Выезд</p>
              <p className="font-semibold text-dark">{checkOut ? format(new Date(checkOut), 'dd.MM.yyyy') : '—'}</p>
            </div>
          </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adults" className="text-sm font-medium text-dark">Взрослые</Label>
                <Input id="adults" type="number" min={1} required value={adults} onChange={(e) => setAdults(Number(e.target.value))} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="children" className="text-sm font-medium text-dark">Дети</Label>
                <Input id="children" type="number" min={0} required value={children} onChange={(e) => setChildren(Number(e.target.value))} className="mt-1.5" />
              </div>
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

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              На главную
            </Button>
            <Button onClick={() => navigate('/profile')} className="w-full bg-brand hover:bg-brand-hover text-white">
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
              <User className="w-5 h-5 text-brand shrink-0" />
              <div>
                <p className="text-sm text-graytext">Гость</p>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Users className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Взрослые / Дети</p>
                  <p className="font-semibold text-dark">{adults} / {children}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-sm text-graytext">Ночей</p>
                  <p className="font-semibold text-dark">{nights}</p>
                </div>
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
