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

export default function Accommodation() {
  const navigate = useNavigate()
  const [types, setTypes] = useState<AccommodationType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: AccommodationType[]) => {
        if (Array.isArray(data)) {
          setTypes(data)
        }
      })
      .catch(() => {
        setTypes([])
      })
      .finally(() => setLoading(false))
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/60 bg-white shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : types.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-graytext text-lg">Размещения скоро появятся</p>
          </div>
        ) : (
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
                    width="1472"
                    height="704"
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
        )}
      </div>
    </section>
  )
}
