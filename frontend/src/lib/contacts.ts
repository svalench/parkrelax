export interface ContactData {
  id: number
  address: string
  workHours: string | null
  yandexMapEmbed: string | null
  createdAt: string
  updatedAt: string
}

export interface PhoneData {
  id: number
  number: string
  isVisibleInHeader: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface EmailData {
  id: number
  email: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ContactPublicResponse {
  contact: ContactData | null
  phones: PhoneData[]
  emails: EmailData[]
}

export async function fetchContacts(): Promise<ContactPublicResponse> {
  const res = await fetch('/api/contact')
  if (!res.ok) {
    throw new Error('Failed to fetch contacts')
  }
  return res.json()
}
