export interface ContactLinks {
  tel: string
  whatsapp: string
  viber: string
  telegram: string
}

/** Нормализует номер для tel:/viber: ссылок */
export function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, '').replace(/[()-]/g, '')
}

/** Формирует ссылки для звонка и мессенджеров из одного номера */
export function buildContactLinks(phone: string): ContactLinks {
  const normalized = normalizePhone(phone)
  const digits = normalized.replace(/^\+/, '')
  const withPlus = normalized.startsWith('+') ? normalized : `+${normalized}`

  return {
    tel: `tel:${normalized}`,
    whatsapp: `https://wa.me/${digits}`,
    viber: `viber://chat?number=${encodeURIComponent(withPlus)}`,
    telegram: `https://t.me/+${digits}`,
  }
}
