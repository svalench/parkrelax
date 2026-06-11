import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react'
import PaymentLogos from '@/components/PaymentLogos'

const API_BASE = '/api'

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

interface PaymentInitData {
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

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState('')
  const [paymentData, setPaymentData] = useState<PaymentInitData | null>(null)

  const confirmPayment = useCallback(async (token?: string, secret?: string) => {
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
      setLoading(false)
    }
  }, [bookingId, navigate])

  useEffect(() => {
    if (!bookingId) {
      setError('Не указан номер бронирования')
      setLoading(false)
      return
    }

    if (returnStatus === 'successful' && returnToken) {
      confirmPayment(returnToken)
      return
    }

    if (returnStatus && returnStatus !== 'successful') {
      const messages: Record<string, string> = {
        declined: 'Оплата отклонена банком',
        failed: 'Оплата не прошла',
        cancelled: 'Оплата отменена',
      }
      setError(messages[returnStatus] || 'Оплата не завершена')
      setLoading(false)
      return
    }

    let cancelled = false

    async function init() {
      const csrf = await fetchCsrfToken()
      if (cancelled) return
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
      if (!cancelled) {
        if (data.amount !== undefined) {
          setAmount(data.amount)
          setPaymentData({
            amount: data.amount,
            paymentMode: data.paymentMode || 'mock',
            clientSecret: data.clientSecret,
            redirectUrl: data.redirectUrl,
            paymentToken: data.paymentToken,
          })
        } else {
          setError(data.detail || 'Не удалось инициализировать оплату')
        }
        setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [bookingId, returnStatus, returnToken, confirmPayment])

  const handlePay = async () => {
    if (!paymentData) return

    if (paymentData.paymentMode === 'bepaid' && paymentData.redirectUrl) {
      window.location.href = paymentData.redirectUrl
      return
    }

    if (paymentData.clientSecret) {
      await confirmPayment(undefined, paymentData.clientSecret)
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

  const isBepaid = paymentData?.paymentMode === 'bepaid'

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
            disabled={processing || !paymentData}
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

          <p className="text-xs text-graytext leading-relaxed">
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
