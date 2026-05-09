import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

type FooterHashLink = { label: string; sectionId: string }
type FooterRouteLink = { label: string; to: string }
type FooterLinkItem = FooterHashLink | FooterRouteLink

function isHashLink(link: FooterLinkItem): link is FooterHashLink {
  return 'sectionId' in link
}

function FooterSectionLink({
  sectionId,
  className,
  children,
}: {
  sectionId: string
  className: string
  children: ReactNode
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <a
      href={`/#${sectionId}`}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        if (pathname !== '/') {
          navigate({ pathname: '/', hash: `#${sectionId}` })
        } else {
          document.getElementById(sectionId)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      }}
    >
      {children}
    </a>
  )
}

const linkClass =
  'text-sm text-white/60 hover:text-white transition-colors duration-200 cursor-pointer'

const footerColumns: { title: string; links: FooterLinkItem[] }[] = [
  {
    title: 'Инфо',
    links: [
      { label: 'О базе отдыха', sectionId: 'about' },
      { label: 'Контакты', sectionId: 'contacts' },
      { label: 'Галерея', sectionId: 'gallery' },
    ],
  },
  {
    title: 'Аренда',
    links: [
      { label: 'Коттедж', to: '/booking?cabin=cottage' },
      { label: 'Апартаменты', to: '/booking?cabin=apartments' },
      { label: 'Летние домики', to: '/booking?cabin=summer' },
    ],
  },
  {
    title: 'Юридическая информация',
    links: [
      { label: 'Политика конфиденциальности', to: '/legal/privacy-policy' },
      { label: 'Условия использования файлов cookies', to: '/legal/cookie-policy' },
      { label: 'Условия аренды и возврата', to: '/legal/rental-terms' },
      { label: 'Публичная оферта', to: '/legal/public-offer' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="container-main py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-12">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {isHashLink(link) ? (
                      <FooterSectionLink sectionId={link.sectionId} className={linkClass}>
                        {link.label}
                      </FooterSectionLink>
                    ) : (
                      <Link to={link.to} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment icons */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 grayscale opacity-70">
          <div className="h-8 flex items-center">
            <span className="text-sm font-bold tracking-wider">WebPay</span>
          </div>
          <div className="h-8 flex items-center">
            <svg viewBox="0 0 48 32" className="h-6">
              <rect width="48" height="32" rx="4" fill="white" />
              <text x="8" y="21" fill="#1A1F71" fontSize="12" fontWeight="bold" fontFamily="Arial">VISA</text>
            </svg>
          </div>
          <div className="h-8 flex items-center">
            <svg viewBox="0 0 48 32" className="h-6">
              <rect width="48" height="32" rx="4" fill="white" />
              <text x="6" y="21" fill="#EB001B" fontSize="10" fontWeight="bold" fontFamily="Arial">Mastercard</text>
            </svg>
          </div>
          <div className="h-8 flex items-center">
            <span className="text-sm font-bold tracking-wider text-white">БЕЛКАРТ</span>
          </div>
          <div className="h-8 flex items-center">
            <span className="text-sm font-bold tracking-wider text-white">МИР</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-white/40">
          ООО «Комплекс отдыха Парк Relax» — © 2024
        </div>
      </div>
    </footer>
  )
}
