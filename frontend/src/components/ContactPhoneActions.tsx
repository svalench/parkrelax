import { Phone } from 'lucide-react'
import { MessengerBrandIcon } from '@/components/MessengerBrandIcon'
import { buildContactLinks } from '@/lib/contactLinks'
import { cn } from '@/lib/utils'

interface ContactPhoneActionsProps {
  phone: string
  size?: 'sm' | 'md'
  className?: string
}

/** Кнопки-иконки для звонка и мессенджеров */
export default function ContactPhoneActions({
  phone,
  size = 'md',
  className,
}: ContactPhoneActionsProps) {
  const links = buildContactLinks(phone)
  const btnSize = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'

  const actions = [
    {
      label: 'Позвонить',
      href: links.tel,
      icon: <Phone className={iconSize} strokeWidth={2} />,
      className: 'text-dark hover:bg-brand/10 hover:text-brand',
      external: false,
    },
    {
      label: 'WhatsApp',
      href: links.whatsapp,
      icon: <MessengerBrandIcon name="whatsapp" className={iconSize} />,
      className: 'hover:bg-[#25D366]/10',
      external: true,
    },
    {
      label: 'Viber',
      href: links.viber,
      icon: <MessengerBrandIcon name="viber" className={iconSize} />,
      className: 'hover:bg-[#7360F2]/10',
      external: false,
    },
    {
      label: 'Telegram',
      href: links.telegram,
      icon: <MessengerBrandIcon name="telegram" className={iconSize} />,
      className: 'hover:bg-[#26A5E4]/10',
      external: true,
    },
  ]

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {actions.map((action) => (
        <a
          key={action.label}
          href={action.href}
          title={action.label}
          aria-label={`${action.label} ${phone}`}
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-xl bg-lightgray transition-colors',
            btnSize,
            action.className,
          )}
          {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {action.icon}
        </a>
      ))}
    </div>
  )
}
