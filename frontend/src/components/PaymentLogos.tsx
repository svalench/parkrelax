/** Логотипы платёжных систем и провайдера — требования БАПБ п. 11 */
type PaymentLogosProps = {
  showProvider?: boolean
  compact?: boolean
}

export default function PaymentLogos({ showProvider = true, compact = false }: PaymentLogosProps) {
  return (
    <div className={compact ? 'space-y-3' : 'mb-8 space-y-4 px-1'}>
      <div className="mx-auto flex max-w-5xl justify-center">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-black/10">
          <img
            src="/images/payments/bapb-payment-logos.png"
            alt="Visa, Visa Secure, Mastercard, Mastercard ID Check, Белкарт, Белкарт ИнтернетПароль, bePaid, G Pay"
            className="h-10 w-auto max-w-[54rem] object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      {showProvider && (
        <div className="flex justify-center text-center">
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-white/65`}>
            Платежи принимаются через систему интернет-платежей{' '}
            <a
              href="https://bepaid.by"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 underline hover:text-white"
            >
              bePaid
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
