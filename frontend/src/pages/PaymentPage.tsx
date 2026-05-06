import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, CheckCircle, ArrowLeft } from 'lucide-react'

const API_BASE = '/api'

export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = Number(searchParams.get('bookingId'))

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingId) {
      setError('Не указан номер бронирования')
      setLoading(false)
      return
    }
    fetch(`${API_BASE}/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.amount !== undefined) {
          setAmount(data.amount)
        } else {
          setError('Не удалось инициализировать оплату')
        }
      })
      .catch(() => setError('Ошибка сети'))
      .finally(() => setLoading(false))
  }, [bookingId])

  const handlePay = async () => {
    setProcessing(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, clientSecret: `secret_${bookingId}_mock` }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => navigate('/profile'), 2000)
      } else {
        setError(data.detail || 'Оплата не прошла')
      }
    } catch {
      setError('Ошибка сети')
    } finally {
      setProcessing(false)
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

  return (
    <div className="min-h-screen bg-lightgray pt-24 md:pt-28 pb-12">
      <div className="container-main max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-graytext hover:text-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold text-dark mb-2">Оплата бронирования</h1>
          <p className="text-graytext mb-6">Тестовая оплата (без реальных средств)</p>

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
            disabled={processing}
            className="w-full h-12 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl text-base"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Оплатить'}
          </Button>
        </div>
      </div>
    </div>
  )
}
