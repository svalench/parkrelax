/** Обязательное раскрытие bePaid — требование платёжной системы */
type BepaidPaymentDisclosureProps = {
  variant?: 'footer' | 'inline'
}

const BEPAID_HOW_TO_PAY_URL = 'https://bepaid.by/kak-oplatit'

export default function BepaidPaymentDisclosure({ variant = 'footer' }: BepaidPaymentDisclosureProps) {
  const isFooter = variant === 'footer'

  return (
    <p
      className={
        isFooter
          ? 'mx-auto max-w-3xl text-center text-xs leading-relaxed text-white/50'
          : 'text-sm leading-relaxed text-graytext'
      }
    >
      Платежи по банковским картам осуществляются через систему электронных платежей{' '}
      <a
        href={BEPAID_HOW_TO_PAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={
          isFooter
            ? 'text-white/70 underline hover:text-white'
            : 'text-brand underline hover:text-brand-hover'
        }
      >
        bePaid
      </a>
      . Платежная страница bePaid отвечает всем требованиям безопасности передачи данных (PCI DSS
      Level 1). Все конфиденциальные данные хранятся в зашифрованном виде и максимально устойчивы к
      взлому. Доступ к авторизационным страницам осуществляется с использованием протокола,
      обеспечивающего безопасную передачу данных в Интернете (SSL/TLS).
    </p>
  )
}
