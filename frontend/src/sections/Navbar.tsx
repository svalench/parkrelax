import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Menu, X, Phone, MapPin, Check, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchContacts } from '@/lib/contacts'

const navLinks = [
  { label: 'Главная', href: '/' },
  { label: 'О комплексе', href: '/#about' },
  { label: 'Аренда', href: '/#accommodation' },
  { label: 'Услуги', href: '/#rental' },
  { label: 'Галерея', href: '/#gallery' },
  { label: 'Контакты', href: '/#contacts' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [headerPhone, setHeaderPhone] = useState<string>('+375 (29) 500-50-29')
  const [phones, setPhones] = useState<string[]>([])
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetchContacts()
      .then((data) => {
        const allPhones = data.phones.map((p) => p.number)
        setPhones(allPhones)
        const header = data.phones.find((p) => p.isVisibleInHeader)
        if (header) {
          setHeaderPhone(header.number)
        } else if (data.phones.length > 0) {
          setHeaderPhone(data.phones[0].number)
        }
      })
      .catch(() => {
        // keep fallback
      })
  }, [])

  const handleAddressClick = async () => {
    const coords = '52.056778, 25.833198'
    try {
      await navigator.clipboard.writeText(coords)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
    window.open(
      'https://yandex.ru/maps/?ll=25.833198,52.056778&z=16&pt=25.833198,52.056778',
      '_blank'
    )
  }

  const headerBase =
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300'
  const headerLooksSolid = scrolled || mobileOpen
  const headerHome = headerLooksSolid
    ? 'bg-white/95 backdrop-blur-md shadow-sm'
    : 'bg-transparent'
  const headerInner = 'bg-white shadow-sm'

  const textHome = headerLooksSolid ? 'text-dark' : 'text-white'
  const textSolid = 'text-dark'

  const linkHome = headerLooksSolid
    ? 'text-dark hover:text-brand'
    : 'text-white/90 hover:text-white'
  const linkSolid = 'text-dark hover:text-brand'

  const addressBtnHome = headerLooksSolid
    ? 'border-brand text-brand hover:bg-brand-light'
    : 'border-white text-white hover:bg-white/10'
  const addressBtnSolid = 'border-brand text-brand hover:bg-brand-light'

  const userBtnHomeSolid = 'text-dark hover:text-brand'
  const userBtnHomeTransparent = 'text-white hover:text-white/80'

  const mobileContactIcon =
    isHome && !headerLooksSolid
      ? 'text-white hover:bg-white/15 active:bg-white/20'
      : 'text-dark hover:bg-black/5 active:bg-black/10'

  const phoneHref = `tel:${headerPhone.replace(/\s/g, '').replace(/[()-]/g, '')}`

  return (
    <>
      <header className={`${headerBase} ${isHome ? headerHome : headerInner}`}>
        <div className="relative container-main flex items-center justify-between h-16 md:h-20">
          {/* Слева: гамбургер (моб.) + телефон текстом (md+) */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0 shrink-0">
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors shrink-0 ${
                isHome
                  ? headerLooksSolid
                    ? 'text-dark hover:bg-black/5'
                    : 'text-white hover:bg-white/15'
                  : 'text-dark hover:bg-black/5'
              }`}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <a
              href={phoneHref}
              className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                isHome ? textHome : textSolid
              }`}
            >
              <Phone className="w-4 h-4" />
              {headerPhone}
            </a>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-[calc(50%+2.25rem)] -translate-y-1/2 items-center gap-4 xl:gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isHome ? linkHome : linkSolid
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Справа */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0 justify-end">
            <div className="flex md:hidden items-center gap-0.5">
              <a
                href={phoneHref}
                aria-label="Позвонить"
                className={`p-2 rounded-lg transition-colors ${mobileContactIcon}`}
              >
                <Phone className="w-5 h-5" />
              </a>
              <button
                type="button"
                aria-label={
                  copied ? 'Координаты скопированы' : 'Открыть адрес на Яндекс.Картах'
                }
                onClick={handleAddressClick}
                className={`p-2 rounded-lg transition-colors ${mobileContactIcon}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddressClick}
              title={
                copied ? 'Координаты скопированы' : 'Пинский район, д. Кончицы — на карте'
              }
              aria-label={
                copied
                  ? 'Координаты скопированы'
                  : 'Пинский район, д. Кончицы — открыть на Яндекс.Картах'
              }
              className={`hidden md:inline-flex items-center justify-center shrink-0 rounded-xl text-sm font-semibold border transition-all duration-200 px-2.5 py-2 xl:px-5 ${
                isHome ? addressBtnHome : addressBtnSolid
              }`}
            >
              {copied ? (
                <Check className="w-4 h-4 shrink-0 xl:mr-1.5" />
              ) : (
                <MapPin className="w-4 h-4 shrink-0 xl:mr-1.5" />
              )}
              <span className="hidden xl:inline">
                {copied ? 'Скопировано!' : 'Пинский район, д. Кончицы'}
              </span>
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors ${
                  isHome
                    ? headerLooksSolid
                      ? userBtnHomeSolid
                      : userBtnHomeTransparent
                    : userBtnHomeSolid
                }`}
              >
                <User className="w-4 h-4" />
                Личный кабинет
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors ${
                  isHome
                    ? headerLooksSolid
                      ? userBtnHomeSolid
                      : userBtnHomeTransparent
                    : userBtnHomeSolid
                }`}
              >
                <User className="w-4 h-4" />
                Вход
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 animate-in slide-in-from-right duration-300">
          <nav className="relative flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-lg font-medium py-2 block text-dark"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {phones.length > 0 ? (
              <div className="flex flex-col gap-2 mt-4">
                {phones.map((p, i) => (
                  <a
                    key={i}
                    href={`tel:${p.replace(/\s/g, '').replace(/[()-]/g, '')}`}
                    className="flex items-center gap-2 font-semibold text-brand"
                  >
                    <Phone className="w-5 h-5" />
                    {p}
                  </a>
                ))}
              </div>
            ) : (
              <a
                href={phoneHref}
                className="flex items-center gap-2 font-semibold mt-4 text-brand"
              >
                <Phone className="w-5 h-5" />
                {headerPhone}
              </a>
            )}
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); navigate('/profile') }}
                className="flex items-center gap-2 font-semibold mt-4 text-brand"
              >
                <User className="w-5 h-5" />
                Личный кабинет
              </button>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); navigate('/login') }}
                className="flex items-center gap-2 font-semibold mt-4 text-brand"
              >
                <User className="w-5 h-5" />
                Вход
              </button>
            )}
            <button
              onClick={() => {
                setMobileOpen(false)
                handleAddressClick()
              }}
              className="btn-brand text-center mt-2 flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Пинский район, д. Кончицы
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
