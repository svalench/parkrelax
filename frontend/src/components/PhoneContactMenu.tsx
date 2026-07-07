import { type ReactNode } from 'react'
import { ChevronDown, Phone } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessengerBrandIcon } from '@/components/MessengerBrandIcon'
import { buildContactLinks } from '@/lib/contactLinks'
import { cn } from '@/lib/utils'

/** Фиксированный слот — иконки выровнены по центру */
function MenuIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center', className)}>
      {children}
    </span>
  )
}

interface PhoneContactMenuProps {
  phone: string
  variant?: 'text' | 'icon' | 'menu'
  triggerClassName?: string
  textClassName?: string
}

export default function PhoneContactMenu({
  phone,
  variant = 'text',
  triggerClassName,
  textClassName,
}: PhoneContactMenuProps) {
  const links = buildContactLinks(phone)

  const menuItems = [
    {
      label: 'Позвонить',
      href: links.tel,
      icon: (
        <MenuIcon>
          <Phone className="h-4 w-4" strokeWidth={2} />
        </MenuIcon>
      ),
      external: false,
      ariaLabel: `Позвонить ${phone}`,
    },
    {
      label: 'WhatsApp',
      href: links.whatsapp,
      icon: (
        <MenuIcon>
          <MessengerBrandIcon name="whatsapp" className="h-[18px] w-[18px]" />
        </MenuIcon>
      ),
      external: true,
      ariaLabel: `Написать в WhatsApp ${phone}`,
    },
    {
      label: 'Viber',
      href: links.viber,
      icon: (
        <MenuIcon>
          <MessengerBrandIcon name="viber" className="h-[18px] w-[18px]" />
        </MenuIcon>
      ),
      external: false,
      ariaLabel: `Написать в Viber ${phone}`,
    },
    {
      label: 'Telegram',
      href: links.telegram,
      icon: (
        <MenuIcon>
          <MessengerBrandIcon name="telegram" className="h-[18px] w-[18px]" />
        </MenuIcon>
      ),
      external: true,
      ariaLabel: `Написать в Telegram ${phone}`,
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Способы связи"
        className={cn(
          'outline-none',
          variant === 'text' && 'hidden min-w-0 truncate md:flex items-center gap-1.5 text-xs font-medium transition-colors duration-300 xl:text-sm',
          variant === 'icon' && 'p-2 rounded-lg transition-colors',
          variant === 'menu' && 'flex items-center gap-2 font-semibold text-brand w-full',
          triggerClassName,
        )}
      >
        <Phone className={cn('shrink-0', variant === 'text' ? 'w-4 h-4' : 'w-5 h-5')} />
        {(variant === 'text' || variant === 'menu') && (
          <span className={cn('truncate', textClassName)}>{phone}</span>
        )}
        {(variant === 'text' || variant === 'menu') && (
          <ChevronDown className={cn('shrink-0 opacity-70', variant === 'text' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[70] min-w-[11rem]">
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.label} asChild>
            <a
              href={item.href}
              aria-label={item.ariaLabel}
              className="flex items-center gap-2.5"
              {...(item.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {item.icon}
              <span className="leading-none">{item.label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
