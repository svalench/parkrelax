import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { plainTextFromHtml } from '../lib/safeHtml'

interface AccommodationType {
  id: number
  name: string
  description?: string
  capacity: number
  pricePerNight: number
  priceUnit?: string
  imageUrl?: string
  isActive: boolean
  sortOrder: number
}

const fallbackTypes: AccommodationType[] = [
  {
    id: 1,
    name: 'Коттедж',
    description: 'Просторный двухэтажный коттедж с камином, террасой и панорамными окнами. Идеально для большой компании или семейного праздника.',
    capacity: 8,
    pricePerNight: 8500,
    priceUnit: 'ночь',
    imageUrl: '/assets/asset_7.jpg',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 2,
    name: 'Апартаменты',
    description: 'Современные апартаменты с балконом, полностью оборудованной кухней и уютной гостиной. Комфорт как дома, но среди природы.',
    capacity: 4,
    pricePerNight: 5200,
    priceUnit: 'ночь',
    imageUrl: '/assets/asset_8.jpg',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 3,
    name: 'Летние домики',
    description: 'Уютные A-образные домики у озера с террасой и видом на воду. Идеальный выбор для романтического getaway или тихого отдыха.',
    capacity: 6,
    pricePerNight: 4800,
    priceUnit: 'ночь',
    imageUrl: '/assets/asset_9.jpg',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 4,
    name: 'Терраса с баней',
    description: 'Большая терраса с русской баней, мини-бассейном и обеденной зоной. Отличное место для вечеринок и корпоративного отдыха.',
    capacity: 10,
    pricePerNight: 12000,
    priceUnit: 'ночь',
    imageUrl: '/assets/asset_10.jpg',
    isActive: true,
    sortOrder: 3,
  },
]

export default function Accommodation() {
  const navigate = useNavigate()
  const [types, setTypes] = useState<AccommodationType[]>([])

  useEffect(() => {
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: AccommodationType[]) => {
        const items =
          Array.isArray(data) && data.length > 0 ? data : fallbackTypes
        setTypes(items)
      })
      .catch(() => setTypes(fallbackTypes))
  }, [])

  return (
    <section id="accommodation" className="py-20 bg-white">
      <div className="container-main mb-10 md:mb-12">
        <div className="max-w-xl">
          <span className="section-label mb-3 block">Где остановиться</span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-3">
            Выбери своё <span className="text-brand">жильё</span>
          </h2>
        </div>
      </div>

      <div className="container-main">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {types.map((type) => (
            <div
              key={type.id}
              onClick={() => navigate(`/accommodation/${type.id}`)}
              className="group cursor-pointer rounded-2xl overflow-hidden border border-border/60 bg-white shadow-sm hover:shadow-xl hover:border-brand/30 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={type.imageUrl || '/assets/asset_7.jpg'}
                  alt={type.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-dark mb-1">
                  {type.name}
                </h3>
                <p className="text-sm text-graytext mb-3">
                  {plainTextFromHtml(type.description) ||
                    `До ${type.capacity} человек`}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-brand font-bold">
                    {type.pricePerNight.toLocaleString('ru-RU')} Br{' '}
                    <span className="text-sm text-graytext font-normal">
                      / {type.priceUnit || 'ночь'}
                    </span>
                  </span>
                  <span className="text-sm text-brand font-medium group-hover:underline">
                    Смотреть →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
