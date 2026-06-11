import type { ReactNode } from 'react'

/** Логотипы платёжных систем и провайдера — требования БАПБ п. 11 */
type PaymentLogoItem =
  | {
      type: 'image'
      label: string
      src: string
      imageClassName: string
    }
  | {
      type: 'custom'
      label: string
      content: ReactNode
    }

const logos: PaymentLogoItem[] = [
  {
    type: 'custom',
    label: 'Белкарт',
    content: (
      <span className="text-[18px] font-extrabold tracking-wide text-[#008A3D]">
        БЕЛКАРТ
      </span>
    ),
  },
  {
    type: 'image',
    label: 'Mastercard',
    src: '/images/payments/mastercard.svg',
    imageClassName: 'h-8 w-auto max-w-[5.4rem]',
  },
  {
    type: 'image',
    label: 'Visa',
    src: '/images/payments/visa.svg',
    imageClassName: 'h-8 w-auto max-w-[5.6rem]',
  },
  {
    type: 'custom',
    label: 'Visa Secure',
    content: (
      <span className="inline-flex h-8 min-w-[7.2rem] items-center justify-center rounded-md bg-[#1A1F71] px-3 text-white">
        <span className="mr-2 text-[13px] font-extrabold tracking-wide">VISA</span>
        <span className="text-[11px] font-semibold text-[#F7B600]">Secure</span>
      </span>
    ),
  },
  {
    type: 'custom',
    label: 'Mastercard ID Check',
    content: (
      <span className="inline-flex h-8 min-w-[7.2rem] items-center justify-center rounded-md bg-black px-3 text-white">
        <span className="relative mr-3 inline-flex h-5 w-8 items-center">
          <span className="absolute left-0 h-5 w-5 rounded-full bg-[#EB001B]" />
          <span className="absolute left-3 h-5 w-5 rounded-full bg-[#F79E1B]/90" />
        </span>
        <span className="text-[11px] font-semibold">ID Check</span>
      </span>
    ),
  },
  {
    type: 'custom',
    label: 'Белкарт ИнтернетПароль',
    content: (
      <span className="inline-flex h-8 min-w-[9.8rem] items-center justify-center rounded-md bg-[#006633] px-3 text-[11px] font-semibold text-white">
        Белкарт ИнтернетПароль
      </span>
    ),
  },
]

function LogoCard({ item }: { item: PaymentLogoItem }) {
  return (
    <div
      className="flex h-14 min-w-[9.4rem] items-center justify-center rounded-2xl bg-white px-4 shadow-sm ring-1 ring-black/10"
      aria-label={item.label}
    >
      {item.type === 'image' ? (
        <img
          src={item.src}
          alt={item.label}
          className={`${item.imageClassName} object-contain object-center`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        item.content
      )}
    </div>
  )
}

type PaymentLogosProps = {
  showProvider?: boolean
  compact?: boolean
}

export default function PaymentLogos({ showProvider = true, compact = false }: PaymentLogosProps) {
  return (
    <div className={compact ? 'space-y-4' : 'mb-8 space-y-5 px-1'}>
      <div className="mx-auto grid max-w-3xl grid-cols-1 place-items-center gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {logos.map((item) => (
          <LogoCard key={item.label} item={item} />
        ))}
      </div>
      {showProvider && (
        <div className="flex flex-col items-center gap-3 text-center">
          <a
            href="https://bepaid.by"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 min-w-[10.5rem] items-center justify-center rounded-2xl bg-white px-5 shadow-sm ring-1 ring-black/10 transition-transform hover:-translate-y-0.5"
            aria-label="bePaid"
          >
            <span className="rounded-lg bg-[#2D2D2D] px-6 py-2 text-base font-extrabold text-[#7ED321]">
              bePaid
            </span>
          </a>
          <p className={`${compact ? 'text-xs' : 'text-sm'} max-w-xl text-white/65`}>
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
