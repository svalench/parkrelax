import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { X, Cookie } from 'lucide-react'

const STORAGE_KEY = 'cookie_consent'

export function hasCookieConsent(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function revokeCookieConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasCookieConsent()) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="container-main py-4 md:py-5">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Cookie className="w-6 h-6 text-brand shrink-0 hidden md:block" />
          <div className="flex-1 text-sm text-dark leading-relaxed">
            <p>
              Мы используем файлы cookie и похожие технологии для улучшения работы сайта,
              анализа трафика и персонализации контента. Продолжая использовать сайт,
              вы соглашаетесь с{' '}
              <Link
                to="/legal/cookie-policy"
                className="text-brand hover:underline font-medium"
                target="_blank"
              >
                Условиями использования файлов cookies
              </Link>
              {' '}и{' '}
              <Link
                to="/legal/privacy-policy"
                className="text-brand hover:underline font-medium"
                target="_blank"
              >
                Политикой конфиденциальности
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleAccept}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Принять
            </button>
            <button
              onClick={handleAccept}
              aria-label="Закрыть"
              className="p-2 text-graytext hover:text-dark transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
