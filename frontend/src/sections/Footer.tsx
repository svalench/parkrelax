import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { fetchContacts } from '@/lib/contacts'

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
      { label: 'О базе отдыха', sectionId: 'about' },
      { label: 'Контакты', sectionId: 'contacts' },
      { label: 'Галерея', sectionId: 'gallery' },
    ],
  },
  {
    title: 'Юридическая информация',
    links: [
      { label: 'Политика конфиденциальности', to: '/legal/privacy-policy' },
      { label: 'Условия использования файлов cookies', to: '/legal/cookie-policy' },
      { label: 'Условия размещения и возврата', to: '/legal/rental-terms' },
      { label: 'Правила возврата средств', to: '/legal/refund-policy' },
      { label: 'Публичная оферта', to: '/legal/public-offer' },
    ],
  },
]

export default function Footer() {
  const [rentalTypes, setRentalTypes] = useState<AccommodationType[]>([])
  const [phones, setPhones] = useState<string[]>([])
  const [emails, setEmails] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: AccommodationType[]) => {
        if (Array.isArray(data)) {
          setRentalTypes(
            data
              .filter((t) => t.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder)
          )
        }
      })
      .catch(() => setRentalTypes([]))

    fetchContacts()
      .then((data) => {
        setPhones(data.phones.map((p) => p.number))
        setEmails(data.emails.map((e) => e.email))
      })
      .catch(() => {
        // keep defaults
      })
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

        {/* Способы оплаты — SVG в public/images/payments */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {(
            [
              { src: '/images/payments/visa.svg', alt: 'Visa' },
              { src: '/images/payments/mastercard.svg', alt: 'Mastercard' },
              { src: '/images/payments/mir.svg', alt: 'Мир' },
              { src: '/images/payments/belkart.svg', alt: 'Белкарт' },
            ] as const
          ).map(({ src, alt }) => (
            <div
              key={src}
              className="flex h-9 items-center rounded-md bg-white/95 px-2.5 shadow-sm ring-1 ring-white/10"
            >
              <img src={src} alt={alt} className="h-6 w-auto max-w-[4.75rem] object-contain" loading="lazy" />
            </div>
          ))}
        </div>

        {/* Юридическая информация */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-white/50 leading-relaxed">
            {/* Левая колонка */}
            <div className="space-y-1">
              <p className="text-white/80 font-semibold text-sm mb-2">ООО «ПриватСтандарт»</p>
              <p>
                <span className="text-white/70">Юр. адрес:</span>{' '}
                220038, г. Минск, пр-д Бетонный, д. 17, каб. 11
              </p>
              <p>
                <span className="text-white/70">Почтовый адрес:</span>{' '}
                220012, г. Минск, пер. Калининградский, д. 18Б, ком. 105
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
                <span className="text-white/80 font-medium">BY93BPSB30121811780119330000</span>
              </p>
              <p>
                <span className="text-white/70">БИК:</span>{' '}
                <span className="text-white/80 font-medium">BPSBBY2X</span>
              </p>
              <p>
                <span className="text-white/70">Банк:</span>{' '}
                <span className="text-white/80 font-medium">ОАО «БПС-Сбербанк», г. Минск, ул. Чкалова, 18/2</span>
              </p>
              <p>
                <span className="text-white/70">Телефон:</span>{' '}
                {phones.length > 0 ? (
                  phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s/g, '').replace(/[()-]/g, '')}`} className="text-white/70 hover:text-white transition-colors mr-2">
                      {p}
                    </a>
                  ))
                ) : (
                  <span className="text-white/80 font-medium">+375 (29) 500-50-29</span>
                )}
              </p>
              <p>
                <span className="text-white/70">Email:</span>{' '}
                {emails.length > 0 ? (
                  emails.map((e) => (
                    <a key={e} href={`mailto:${e}`} className="text-white/70 hover:text-white transition-colors mr-2">
                      {e}
                    </a>
                  ))
                ) : (
                  <span className="text-white/80 font-medium">[email@parkrelax.by]</span>
                )}
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
