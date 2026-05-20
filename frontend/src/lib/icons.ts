import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Bed,
  CircleCheck,
  PartyPopper,
  Bike,
  Flame,
  Anchor,
  Waves,
  Wifi,
  Umbrella,
  Car,
  Baby,
  Fish,
  Ship,
  UtensilsCrossed,
  Refrigerator,
  Tv,
  PawPrint,
  Droplets,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Home,
  Bed,
  CircleCheck,
  PartyPopper,
  Bike,
  Flame,
  Anchor,
  Waves,
  Wifi,
  Umbrella,
  Car,
  Baby,
  Fish,
  Ship,
  UtensilsCrossed,
  Refrigerator,
  Tv,
  PawPrint,
  Droplets,
}

export function getLucideIcon(name: string): LucideIcon | undefined {
  return iconMap[name]
}
