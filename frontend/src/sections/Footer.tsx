import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import PaymentLogos from '@/components/PaymentLogos'

type FooterHashLink = { label: string; sectionId: string }
type FooterRouteLink = { label: string; to: string }
type FooterLinkItem = FooterHashLink | FooterRouteLink

function isHashLink(link: FooterLinkItem): link is FooterHashLink {
  return 'sectionId' in link
}

interface AccommodationType {
  id: number
  name: string
  isActive: boolean
  showInListing?: boolean
  sortOrder: number
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

const staticColumns: { title: string; links: FooterLinkItem[] }[] = [
  {
    title: 'Инфо',
    links: [
      { label: 'О комплексе отдыха', sectionId: 'about' },
      { label: 'Аренда', sectionId: 'area' },
      { label: 'Контакты', sectionId: 'contacts' },
      { label: 'Галерея', sectionId: 'gallery' },
      { label: 'Прайс', to: '/prices' },
    ],
  },
  {
    title: 'Юридическая информация',
    links: [
      { label: 'Оплата и возврат', to: '/legal/payment-info' },
      { label: 'Политика конфиденциальности', to: '/legal/privacy-policy' },
      { label: 'Условия использования файлов cookies', to: '/legal/cookie-policy' },
      { label: 'Публичный договор', to: '/legal/public-offer' },
      { label: 'Правила проживания', to: '/legal/accommodation-rules' },
      { label: 'Правила пребывания', to: '/legal/stay-rules' },
      { label: 'Правила пребывания — БАНЯ', to: '/legal/banya-stay-rules' },
    ],
  },
]

export default function Footer() {
  const [rentalTypes, setRentalTypes] = useState<AccommodationType[]>([])

  useEffect(() => {
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: AccommodationType[]) => {
        if (Array.isArray(data)) {
          setRentalTypes(
            data
              .filter((t) => t.isActive && t.showInListing !== false)
              .sort((a, b) => a.sortOrder - b.sortOrder)
          )
        }
      })
      .catch(() => setRentalTypes([]))
  }, [])

  return (
    <footer className="bg-dark text-white">
      <div className="container-main py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-12">
          {staticColumns.map((col) => (
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

          {/* Размещение — динамически из БД */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Размещение</h4>
            <ul className="space-y-2.5">
              {rentalTypes.length > 0 ? (
                rentalTypes.map((type) => (
                  <li key={type.id}>
                    <Link to={`/booking?typeId=${type.id}`} className={linkClass}>
                      {type.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-white/40">Загрузка...</li>
              )}
            </ul>
          </div>
        </div>

        <PaymentLogos />

        {/* Юридическая информация */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-white/50 leading-relaxed">
            {/* Левая колонка */}
            <div className="space-y-1">
              <p className="text-white/80 font-semibold text-sm mb-2">
                Общество с ограниченной ответственностью «ПриватСтандарт»
              </p>
              <p>
                <span className="text-white/70">Юридический адрес:</span>{' '}
                220036, г. Минск, проезд Бетонный, д. 17, каб. 11
              </p>
              <p>
                <span className="text-white/70">Почтовый адрес:</span>{' '}
                220030, г. Минск, ул.Октябрьская, д. 19Б, каб. 101
              </p>
              <p>
                <span className="text-white/70">Гос. регистрация:</span>{' '}
                Минским городским исполнительным комитетом, 18.04.2017
              </p>
              <p>
                <span className="text-white/70">Объект:</span>{' '}
                Комплекс отдыха «Парк Relax», Пинский район, д. Кончицы, ул. Заозерная, 16
              </p>
              <p>
                <span className="text-white/70">Режим работы:</span>{' '}
                круглосуточно, администрация — с 9:00 до 18:00
              </p>
            </div>

            {/* Правая колонка */}
            <div className="space-y-1">
              <p>
                <span className="text-white/70">УНП:</span>{' '}
                <span className="text-white/80 font-medium">192803799</span>
              </p>
              <p>
                <span className="text-white/70">Р/с:</span>{' '}
                <span className="text-white/80 font-medium">BY03BAPB30128903300100000000</span>
              </p>
              <p>
                <span className="text-white/70">Банк:</span>{' '}
                <span className="text-white/80 font-medium">ОАО «Белагропромбанк», Минск, пр-т Победителей, 119-492</span>
              </p>
              <p>
                <span className="text-white/70">Телефон:</span>{' '}
                <a
                    href="tel:+375173901950"
                    className="text-white/80 font-medium hover:text-white transition-colors"
                >
                  +375 (29) 500-50-29
                </a>
              </p>
              <p>
                <span className="text-white/70">E-mail:</span>{' '}
                <a
                  href="mailto:office@parkrelax.by"
                  className="text-white/80 font-medium hover:text-white transition-colors"
                >
                  office@parkrelax.by
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Копирайт */}
        <div className="text-center text-xs text-white/40">
          <p className="text-white/65">
            Парк Relax <span aria-hidden="true">©</span> 2026
          </p>
        </div>
      </div>
    </footer>
  )
}
