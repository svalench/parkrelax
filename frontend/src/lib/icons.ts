import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const SKIP_ICON_KEYS = new Set(['createLucideIcon', 'default', 'icons', 'Icon'])

/** Приводит kebab/snake/lowercase к PascalCase (как в админке lucide_icons.html). */
function toPascalCase(name: string): string {
  const camel = name.replace(/^([A-Z])|[\s-_]+(\w)/g, (_, p1, p2) => {
    return p2 ? p2.toUpperCase() : (p1 ?? '').toLowerCase()
  })
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

function resolveIcon(name: string): LucideIcon | undefined {
  const mod = LucideIcons as unknown as Record<string, LucideIcon>
  const candidate = mod[name]
  if (candidate && !SKIP_ICON_KEYS.has(name)) {
    return candidate
  }
  return undefined
}

export function getLucideIcon(name: string): LucideIcon | undefined {
  const trimmed = name?.trim()
  if (!trimmed) return undefined

  return resolveIcon(trimmed) ?? resolveIcon(toPascalCase(trimmed))
}
