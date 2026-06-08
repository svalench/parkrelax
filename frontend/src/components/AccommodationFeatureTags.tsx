import { Tag } from 'lucide-react'
import { getLucideIcon } from '@/lib/icons'

export interface AccommodationFeature {
  id?: number
  iconName: string
  label: string
  sortOrder?: number
  isActive?: boolean
}

interface AccommodationFeatureTagsProps {
  features?: AccommodationFeature[]
  className?: string
}

export function AccommodationFeatureTags({ features, className = '' }: AccommodationFeatureTagsProps) {
  const visibleFeatures = features?.filter((f) => f.label?.trim()) ?? []
  if (!visibleFeatures.length) return null

  return (
    <div className={`flex flex-wrap gap-2 mb-3 ${className}`.trim()}>
      {visibleFeatures.map((feature) => {
        const Icon = getLucideIcon(feature.iconName) ?? Tag
        const label = feature.label.trim()
        const key = feature.id ?? `${feature.iconName}-${label}`
        return (
          <span
            key={key}
            title={label}
            className="inline-flex items-center gap-1.5 bg-lightgray border border-border/60 text-dark text-xs font-medium px-3 py-1.5 rounded-full"
          >
            <Icon className="w-3.5 h-3.5 text-brand shrink-0" />
            {label}
          </span>
        )
      })}
    </div>
  )
}
