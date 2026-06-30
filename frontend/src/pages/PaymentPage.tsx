import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, CheckCircle, ArrowLeft, ExternalLink, Clock } from 'lucide-react'
import PaymentLogos from '@/components/PaymentLogos'

const API_BASE = '/api'
const HOLD_EXPIRED_MESSAGE = 'Время резервирования истекло. Оформите бронирование заново.'

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

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function parseHoldExpiresAt(value: string | null): number | null {
  if (!value) return null
  const normalized = value.trim()
  // Если сервер прислал naive UTC-строку без tz, считаем её UTC (а не локальным временем)
  const hasTz = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized)
  const withTz = hasTz ? normalized : `${normalized}Z`
  const ms = new Date(withTz).getTime()
  return Number.isNaN(ms) ? null : ms
}

function statusReturnMessage(status: string | null): string | null {
  if (!status) return null
  const messages: Record<string, string> = {
    declined: 'Оплата отклонена банком. Вы можете попробовать ещё раз.',
    failed: 'Оплата не прошла. Проверьте данные карты и попробуйте снова.',
    cancelled: 'Оплата отменена. Вы можете попробовать ещё раз.',
  }
  return messages[status] || 'Оплата не завершена. Вы можете попробовать ещё раз.'
}

interface PaymentInitData {
  paymentId?: number | null
  amount: number
  paymentMode: string
  clientSecret?: string
  redirectUrl?: string
  paymentToken?: string
}

export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = Number(searchParams.get('bookingId'))
  const returnStatus = searchParams.get('status')
  const returnToken = searchParams.get('token')
  const returnPaymentId = Number(searchParams.get('paymentId')) || undefined
  const holdUntilParam = searchParams.get('holdUntil')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState('')
  const [paymentData, setPaymentData] = useState<PaymentInitData | null>(null)
  const [bepaidActive, setBepaidActive] = useState(false)
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(holdUntilParam)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [holdExpired, setHoldExpired] = useState(false)

  const confirmPayment = useCallback(async (token?: string, secret?: string, paymentId?: number) => {
    setProcessing(true)
    setError('')
    try {
      const csrf = await fetchCsrfToken()
      const res = await fetch(`${API_BASE}/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          bookingId,
          paymentId,
          paymentToken: token,
          clientSecret: secret,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => navigate('/profile'), 2000)
      } else {
        setError(data.detail || 'Оплата не подтверждена')
      }
    } catch {
      setError('Ошибка сети')
    } finally {
      setProcessing(false)
    }
  }, [bookingId, navigate])

  useEffect(() => {
    if (!holdExpiresAt) {
      setSecondsLeft(null)
      return
    }

    const updateCountdown = () => {
      const expiresMs = parseHoldExpiresAt(holdExpiresAt)
      if (expiresMs === null) {
        setSecondsLeft(null)
        return
      }
      const diff = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000))
      setSecondsLeft(diff)
      if (diff <= 0) {
        setHoldExpired(true)
        setError(HOLD_EXPIRED_MESSAGE)
      }
    }

    updateCountdown()
    const timer = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(timer)
  }, [holdExpiresAt])

  // Загружаем данные об оплате в любом случае, даже если пользователь вернулся с bePaid.
  useEffect(() => {
    if (!bookingId) {
      setError('Не указан номер бронирования')
      setLoading(false)
      return
    }

    let cancelled = false

    async function init() {
      const [csrf, publicSettingsRes] = await Promise.all([
        fetchCsrfToken(),
        fetch(`${API_BASE}/payment/public-settings`),
      ])
      if (cancelled) return

      if (publicSettingsRes.ok) {
        const publicSettings = await publicSettingsRes.json()
        if (!cancelled) {
          setBepaidActive(Boolean(publicSettings.bepaidActive))
        }
      }

      const res = await fetch(`${API_BASE}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf || '',
        },
        credentials: 'include',
        body: JSON.stringify({ bookingId }),
      })
      if (cancelled) return
      const data = await res.json()
      if (cancelled) return

      if (!res.ok) {
        const detail = typeof data.detail === 'string' ? data.detail : 'Не удалось инициализировать оплату'
        setError(detail)
        if (detail === HOLD_EXPIRED_MESSAGE) {
          setHoldExpired(true)
        }
        setLoading(false)
        return
      }

      if (data.amount !== undefined) {
        setAmount(data.amount)
        if (data.holdExpiresAt) {
          setHoldExpiresAt(data.holdExpiresAt)
        }
        setPaymentData({
          paymentId: data.paymentId,
          amount: data.amount,
          paymentMode: data.paymentMode || 'mock',
          clientSecret: data.clientSecret,
          redirectUrl: data.redirectUrl,
          paymentToken: data.paymentToken,
        })
      } else {
        setError('Не удалось инициализировать оплату')
        setLoading(false)
        return
      }

      // После загрузки данных обрабатываем возврат с bePaid.
      if (returnStatus === 'successful' && (returnToken || returnPaymentId || data.paymentToken)) {
        await confirmPayment(
          returnToken || data.paymentToken || undefined,
          undefined,
          returnPaymentId || data.paymentId || undefined,
        )
      } else if (returnStatus && returnStatus !== 'successful') {
        const message = statusReturnMessage(returnStatus)
        if (message) {
          setError(message)
        }
      }

      setLoading(false)
    }

    init()
    return () => { cancelled = true }
  }, [bookingId, returnStatus, returnToken, returnPaymentId, confirmPayment])

  const handlePay = async () => {
    if (!paymentData || holdExpired) return

    if (paymentData.paymentMode === 'bepaid' && paymentData.redirectUrl) {
      window.location.href = paymentData.redirectUrl
      return
    }

    if (paymentData.clientSecret) {
      await confirmPayment(undefined, paymentData.clientSecret, paymentData.paymentId || undefined)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lightgray flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-lightgray flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-dark mb-2">Оплата прошла успешно!</h1>
          <p className="text-graytext mb-4">Ваше бронирование подтверждено. Сейчас вы будете перенаправлены в личный кабинет.</p>
        </div>
      </div>
    )
  }

  if (holdExpired) {
    return (
      <div className="min-h-screen bg-lightgray flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md w-full">
          <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-dark mb-2">Время резервирования истекло</h1>
          <p className="text-graytext mb-6">
            К сожалению, 60 минут на оплату закончились, и размещение снова доступно для бронирования.
          </p>
          <Button
            onClick={() => navigate('/booking')}
            className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl"
          >
            Оформить заново
          </Button>
        </div>
      </div>
    )
  }

  const isBepaid = paymentData?.paymentMode === 'bepaid' || (bepaidActive && !paymentData)

  return (
    <div className="min-h-screen bg-lightgray pt-24 md:pt-28 pb-12">
      <div className="container-main max-w-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-graytext hover:text-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 mb-6">
          <h1 className="text-2xl font-bold text-dark mb-2">Оплата бронирования</h1>
          <p className="text-graytext mb-4 text-sm">
            {isBepaid
              ? 'Оплата банковской картой через защищённую страницу bePaid (Visa, Mastercard, Белкарт). Валюта операции — BYN.'
              : 'Тестовая оплата (без реальных средств) — режим разработки'}
          </p>

          {secondsLeft !== null && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Размещение зарезервировано на{' '}
                <strong>{formatCountdown(secondsLeft)}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
            <CreditCard className="w-8 h-8 text-brand" />
            <div>
              <p className="text-sm text-graytext">К оплате</p>
              <p className="text-xl font-bold text-dark">{amount.toLocaleString('ru-RU')} Br</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <Button
            onClick={handlePay}
            disabled={processing || !paymentData || holdExpired}
            className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-base mb-4"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isBepaid ? (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Перейти к оплате
              </>
            ) : (
              'Оплатить'
            )}
          </Button>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="flex-1 h-11 rounded-xl"
            >
              В личный кабинет
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/booking')}
              className="flex-1 h-11 rounded-xl"
            >
              К бронированиям
            </Button>
          </div>

          <p className="text-xs text-graytext leading-relaxed mt-4">
            При оплате карточкой возврат денежных средств осуществляется на ту же карточку, с которой была произведена оплата.
            Сохраняйте карт-чеки для сверки с выпиской.{' '}
            <Link to="/legal/payment-info" className="text-brand hover:underline">
              Подробнее об оплате и возврате
            </Link>
          </p>
        </div>

        <div className="bg-dark rounded-2xl p-6">
          <PaymentLogos compact />
        </div>
      </div>
    </div>
  )
}
