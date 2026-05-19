import { Link } from 'react-router'
import { CalendarClock, Home } from 'lucide-react'

export default function BookingComingSoonPage() {
  return (
    <div className="min-h-screen bg-lightgray flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <CalendarClock className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3">
            Онлайн-бронирование скоро появится
          </h1>
          <p className="text-graytext mb-8 leading-relaxed">
            Мы готовим удобную запись на размещение через сайт. Пока вы можете связаться с нами
            по телефону или в разделе контактов — поможем подобрать домик и даты.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/#contacts"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors"
            >
              Связаться с нами
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-dark border border-border bg-white hover:bg-slate-50 transition-colors"
            >
              <Home className="h-4 w-4" aria-hidden />
              На главную
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
