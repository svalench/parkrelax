import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, requestPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [privacyConsent, setPrivacyConsent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!privacyConsent) {
      setError('Необходимо дать согласие на обработку персональных данных')
      return
    }
    setLoading(true)
    setMessage('')
    const ok = await login(email, password)
    setLoading(false)
    if (ok) {
      navigate('/profile')
    } else {
      setError('Неверный email или пароль')
    }
  }

  const handleRequestPassword = async () => {
    if (!email) {
      setError('Введите email')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')
    const ok = await requestPassword(email)
    setLoading(false)
    if (ok) {
      setMessage('Если указанный email зарегистрирован, новый пароль будет отправлен')
    } else {
      setError('Не удалось отправить запрос')
    }
  }

  return (
    <div className="min-h-screen bg-lightgray flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-graytext hover:text-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <h1 className="text-2xl font-bold text-dark mb-2">Вход в личный кабинет</h1>
        <p className="text-graytext mb-6">Введите email и пароль, отправленный на почту при бронировании</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-dark">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-dark">Пароль</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="pl-10"
              />
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
          {message && <p className="text-sm text-green-600">{message}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Войти'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleRequestPassword}
            className="text-sm text-brand hover:underline"
            type="button"
          >
            Выслать новый пароль на почту
          </button>
        </div>
      </div>
    </div>
  )
}
