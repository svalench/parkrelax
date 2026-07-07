import { useState, useEffect, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Menu, X, MapPin, Check, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchContacts } from '@/lib/contacts'
import PhoneContactMenu from '@/components/PhoneContactMenu'

type NavLink =
  | { label: string; href: string; homeSection?: undefined }
  | { label: string; href: string; homeSection: string }

const navLinks: NavLink[] = [
  { label: 'Главная', href: '/' },
  { label: 'О комплексе', href: '/#about', homeSection: 'about' },
  { label: 'Размещение', href: '/#accommodation', homeSection: 'accommodation' },
  { label: 'Терасса с баней', href: '/banya' },
  { label: 'Аренда', href: '/#area', homeSection: 'area' },
  { label: 'Прокат', href: '/#rental', homeSection: 'rental' },
  { label: 'Прайс', href: '/prices' },
  { label: 'Галерея', href: '/#gallery', homeSection: 'gallery' },
  { label: 'Контакты', href: '/#contacts', homeSection: 'contacts' },
]

function NavItem({
  link,
  className,
  onNavigate,
}: {
  link: NavLink
  className: string
  onNavigate?: () => void
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!link.homeSection) return
    e.preventDefault()
    onNavigate?.()
    if (pathname !== '/') {
      navigate({ pathname: '/', hash: `#${link.homeSection}` })
      return
    }
    document.getElementById(link.homeSection)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <a href={link.href} className={className} onClick={handleClick}>
      {link.label}
    </a>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [headerPhone, setHeaderPhone] = useState<string>('+375 (17) 390-19-50')
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
    'fixed top-0 left-0 right-0 z-[60] transition-all duration-300'
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

  return (
    <>
      <header className={`${headerBase} ${isHome ? headerHome : headerInner}`}>
        <div className="relative mx-auto grid h-16 w-full max-w-[1400px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 px-4 sm:px-6 md:h-20 md:gap-x-3 lg:gap-x-4 lg:px-8">
          {/* Слева: гамбургер (моб.) + телефон текстом (md+) */}
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
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
            <PhoneContactMenu
              phone={headerPhone}
              variant="text"
              triggerClassName={isHome ? textHome : textSolid}
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center justify-center gap-x-2 gap-y-1 whitespace-nowrap xl:gap-x-3 2xl:gap-x-4">
            {navLinks.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                className={`text-xs font-medium transition-colors duration-200 xl:text-sm ${
                  isHome ? linkHome : linkSolid
                }`}
              />
            ))}
          </nav>

          {/* Справа */}
          <div className="flex min-w-max items-center justify-end gap-1 sm:gap-2 md:gap-2.5 lg:gap-3">
            <div className="flex md:hidden items-center gap-0.5">
              <PhoneContactMenu
                phone={headerPhone}
                variant="icon"
                triggerClassName={mobileContactIcon}
              />
              <a
                href="https://www.instagram.com/baza_relax_pinsk/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={`p-2 rounded-lg transition-colors ${mobileContactIcon}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
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

            <a
              href="https://www.instagram.com/baza_relax_pinsk/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={`hidden md:inline-flex items-center justify-center shrink-0 rounded-lg p-2 transition-colors ${
                isHome
                  ? headerLooksSolid
                    ? 'text-dark hover:bg-black/5'
                    : 'text-white hover:bg-white/15'
                  : 'text-dark hover:bg-black/5'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

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
              className={`hidden md:inline-flex shrink-0 items-center justify-center rounded-xl border px-2 py-2 text-xs font-semibold transition-all duration-200 xl:px-2.5 xl:text-sm 2xl:px-5 ${
                isHome ? addressBtnHome : addressBtnSolid
              }`}
            >
              {copied ? (
                <Check className="w-4 h-4 shrink-0 2xl:mr-1.5" />
              ) : (
                <MapPin className="w-4 h-4 shrink-0 2xl:mr-1.5" />
              )}
              <span className="hidden 2xl:inline">
                {copied ? 'Скопировано!' : 'Пинский район, д. Кончицы'}
              </span>
            </button>
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className={`hidden min-w-0 shrink md:flex items-center gap-1.5 text-xs font-medium transition-colors xl:gap-2 xl:text-sm ${
                  isHome
                    ? headerLooksSolid
                      ? userBtnHomeSolid
                      : userBtnHomeTransparent
                    : userBtnHomeSolid
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">Личный кабинет</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`hidden shrink-0 md:flex items-center gap-1.5 text-xs font-medium transition-colors xl:gap-2 xl:text-sm ${
                  isHome
                    ? headerLooksSolid
                      ? userBtnHomeSolid
                      : userBtnHomeTransparent
                    : userBtnHomeSolid
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
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
              <NavItem
                key={link.label}
                link={link}
                className="text-lg font-medium py-2 block text-dark"
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
            <div className="flex flex-col gap-2 mt-4">
              {(phones.length > 0 ? phones : [headerPhone]).map((p, i) => (
                <PhoneContactMenu key={i} phone={p} variant="menu" />
              ))}
            </div>
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
