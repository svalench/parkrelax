import { cn } from '@/lib/utils'

export const MESSENGER_ICON_SRC = {
  whatsapp: '/images/messengers/whatsapp.svg',
  viber: '/images/messengers/viber.svg',
  telegram: '/images/messengers/telegram.svg',
} as const

export type MessengerName = keyof typeof MESSENGER_ICON_SRC

/** Брендовые иконки мессенджеров из public/images/messengers */
export function MessengerBrandIcon({
  name,
  className,
}: {
  name: MessengerName
  className?: string
}) {
  return (
    <img
      src={MESSENGER_ICON_SRC[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('block h-4 w-4 shrink-0 object-contain', className)}
    />
  )
}
