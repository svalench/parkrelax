import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Menu, X, Phone, MapPin, Check, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navLinks = [
  { label: 'Главная', href: '/' },
  { label: 'О комплексе', href: '/#about' },
  { label: 'Проживание', href: '/#accommodation' },
  { label: 'Услуги', href: '/#rental' },
  { label: 'Галерея', href: '/#gallery' },
  { label: 'Контакты', href: '/#contacts' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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
  const headerHome = scrolled
    ? 'bg-white/95 backdrop-blur-md shadow-sm'
    : 'bg-transparent'

  const textHome = scrolled ? 'text-dark' : 'text-white'
  const textInner = 'text-white/90 hover:text-white'

  const linkHome = scrolled
    ? 'text-dark hover:text-brand'
    : 'text-white/90 hover:text-white'
  const linkInner = 'text-white/90 hover:text-white'

  const addressBtnHome = scrolled
    ? 'border-brand text-brand hover:bg-brand-light'
    : 'border-white text-white hover:bg-white/10'
  const addressBtnInner = 'border-white/60 text-white/90 hover:bg-white/10 hover:border-white'

  return (
    <>
      <header
        className={`${headerBase} ${isHome ? headerHome : ''}`}
        style={
          isHome
            ? undefined
            : {
                backgroundImage: "url('/assets/vasil.avif')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
        }
      >
        {!isHome && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[14px]" />
        )}
        <div className="relative container-main flex items-center justify-between h-16 md:h-20">
          {/* Phone */}
          <a
            href="tel:+375295005029"
            className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
              isHome ? textHome : textInner
            }`}
          >
            <Phone className="w-4 h-4" />
            +375 (29) 500-50-29
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isHome ? linkHome : linkInner
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAddressClick}
              className={`hidden md:inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                isHome ? addressBtnHome : addressBtnInner
              }`}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-1.5" />
              ) : (
                <MapPin className="w-4 h-4 mr-1.5" />
              )}
              {copied ? 'Скопировано!' : 'Пинский район, д. Кончицы'}
            </button>
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors ${
                  isHome ? (scrolled ? 'text-dark hover:text-brand' : 'text-white hover:text-white/80') : 'text-white hover:text-white/80'
                }`}
              >
                <User className="w-4 h-4" />
                Личный кабинет
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors ${
                  isHome ? (scrolled ? 'text-dark hover:text-brand' : 'text-white hover:text-white/80') : 'text-white hover:text-white/80'
                }`}
              >
                <User className="w-4 h-4" />
                Вход
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isHome ? (scrolled ? 'text-dark' : 'text-white') : 'text-white'
              }`}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className={`fixed inset-0 z-40 pt-20 px-6 animate-in slide-in-from-right duration-300 ${
            isHome ? 'bg-white' : ''
          }`}
          style={
            isHome
              ? undefined
              : {
                  backgroundImage: "url('/assets/forest.webp')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
          }
        >
          {!isHome && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}
          <nav className="relative flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-lg font-medium py-2 block ${
                  isHome ? 'text-dark' : 'text-white'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="tel:+375295005029"
              className={`flex items-center gap-2 font-semibold mt-4 ${
                isHome ? 'text-brand' : 'text-white'
              }`}
            >
              <Phone className="w-5 h-5" />
              +375 (29) 500-50-29
            </a>
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); navigate('/profile') }}
                className={`flex items-center gap-2 font-semibold mt-4 ${isHome ? 'text-brand' : 'text-white'}`}
              >
                <User className="w-5 h-5" />
                Личный кабинет
              </button>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); navigate('/login') }}
                className={`flex items-center gap-2 font-semibold mt-4 ${isHome ? 'text-brand' : 'text-white'}`}
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
