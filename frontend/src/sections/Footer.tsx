import { Link } from 'react-router'

const footerColumns = [
  {
    title: 'Инфо',
    links: [
      { label: 'О базе отдыха', to: '/#about' },
      { label: 'Контакты', to: '/#contacts' },
      { label: 'Галерея', to: '/#gallery' },
    ],
  },
  {
    title: 'Размещение',
    links: [
      { label: 'Коттедж', to: '/#accommodation' },
      { label: 'Апартаменты', to: '/#accommodation' },
      { label: 'Летние домики', to: '/#accommodation' },
    ],
  },
  {
    title: 'Активный отдых',
    links: [
      { label: 'Прокат', to: '/#rental' },
      { label: 'Беседки', to: '/#area' },
      { label: 'Баня и терраса', to: '/#accommodation' },
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
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
          ООО «Парк Relax» — © 2024
        </div>
      </div>
    </footer>
  )
}
