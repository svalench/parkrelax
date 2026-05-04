import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import SectionHeader from '../components/SectionHeader'

interface AccommodationType {
  id: number
  name: string
  description?: string
  capacity: number
  pricePerNight: number
  imageUrl?: string
  isActive: boolean
  sortOrder: number
}

// Fallback data for when API returns empty (demo / initial state)
const fallbackAccommodations: AccommodationType[] = [
  {
    id: 1,
    name: 'Коттедж',
    description: 'До 8 человек',
    capacity: 8,
    pricePerNight: 0,
    imageUrl: '/assets/asset_7.jpg',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 2,
    name: 'Апартаменты',
    description: 'До 4 человек',
    capacity: 4,
    pricePerNight: 0,
    imageUrl: '/assets/asset_8.jpg',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 3,
    name: 'Летние домики',
    description: 'До 6 человек',
    capacity: 6,
    pricePerNight: 0,
    imageUrl: '/assets/asset_9.jpg',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 4,
    name: 'Терраса с баней и мини бассейном',
    description: 'До 10 человек',
    capacity: 10,
    pricePerNight: 0,
    imageUrl: '/assets/asset_10.jpg',
    isActive: true,
    sortOrder: 3,
  },
]

export default function Accommodation() {
  const navigate = useNavigate()
  const [accommodations, setAccommodations] = useState<AccommodationType[]>([])

  useEffect(() => {
    fetch('/api/accommodation/types')
      .then((r) => r.json())
      .then((data: AccommodationType[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAccommodations(data)
        } else {
          setAccommodations(fallbackAccommodations)
        }
      })
      .catch(() => setAccommodations(fallbackAccommodations))
  }, [])

  const handleCardClick = (typeId: number) => {
    navigate(`/booking?typeId=${typeId}`)
  }

  return (
    <section id="accommodation" className="py-20 bg-lightgray">
      <div className="container-main">
        <SectionHeader
          label="ПРОЖИВАНИЕ"
          title="Выберите формат отдыха"
          subtitle="Уютные домики, просторные апартаменты и весёлый благоустроенный отдых для любой компании"
        />

        <div className="grid md:grid-cols-2 gap-5">
          {accommodations.map((item, i) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={item.imageUrl || '/assets/asset_7.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Glassmorphism badge - top left */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-white/15 backdrop-blur-xl border border-white/25 shadow-lg transition-all duration-300 group-hover:bg-white/25 group-hover:scale-[1.02]">
                  Забронировать
                </span>
              </div>

              {/* Text */}
              <div className="absolute bottom-0 left-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className="text-lg font-semibold text-white mb-1">{item.name}</h3>
                <p className="text-sm text-white/80">
                  {item.description || `До ${item.capacity} человек`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
