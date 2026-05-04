import { CalendarDays } from 'lucide-react'

interface SectionHeaderProps {
  label: string
  title: string
  subtitle: string
  buttonText?: string
  onButtonClick?: () => void
  variant?: 'default' | 'outline'
}

export default function SectionHeader({
  label,
  title,
  subtitle,
  buttonText,
  onButtonClick,
  variant = 'default',
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
      <div className="max-w-xl">
        <span className="section-label mb-3 block">{label}</span>
        <h2 className="text-3xl md:text-4xl font-bold text-dark mb-3">{title}</h2>
        <p className="text-graytext leading-relaxed">{subtitle}</p>
      </div>
      {buttonText && (
        <button
          onClick={onButtonClick}
          className={
            variant === 'outline'
              ? 'btn-brand-outline flex items-center gap-2 shrink-0'
              : 'btn-brand flex items-center gap-2 shrink-0'
          }
        >
          <CalendarDays className="w-4 h-4" />
          {buttonText}
        </button>
      )}
    </div>
  )
}
