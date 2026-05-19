import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const STUB_HINT = 'Онлайн-бронирование скоро появится'

type BookingStubButtonProps = {
  className?: string
  label?: string
  size?: 'default' | 'compact'
}

/** Неактивная кнопка бронирования с подсказкой «скоро». */
export function BookingStubButton({
  className,
  label = 'Скоро появится',
  size = 'default',
}: BookingStubButtonProps) {
  const sizeClass =
    size === 'compact'
      ? 'px-4 py-2 text-sm rounded-lg'
      : 'px-6 py-2.5 text-sm rounded-xl'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled
          aria-disabled
          title={STUB_HINT}
          className={cn(
            'inline-flex items-center justify-center font-semibold whitespace-nowrap',
            'cursor-not-allowed opacity-70',
            'bg-gray-400 text-white',
            sizeClass,
            className,
          )}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{STUB_HINT}</TooltipContent>
    </Tooltip>
  )
}
