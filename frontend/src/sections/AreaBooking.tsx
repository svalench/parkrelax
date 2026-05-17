import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import SectionHeader from '../components/SectionHeader'

interface AreaItem {
  id: number
  title: string
  info: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
}

const fallbackAreas = [
  {
    imageUrl: '/assets/asset_15.webp',
    title: 'Беседки у пляжа',
    info: '8 мест',
  },
  {
    imageUrl: '/assets/asset_16.webp',
    title: 'Зона пляжа',
    info: 'Стол, шезлонги, мангал',
  },
]

export default function AreaBooking() {
  const [items, setItems] = useState<AreaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/area-items')
      .then((r) => r.json())
      .then((data: AreaItem[]) => {
        const active = Array.isArray(data)
          ? data.filter((i) => i.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
          : []
        setItems(active)
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLoading(false)
      })
  }, [])

  const areas =
    items.length > 0
      ? items.map((i) => ({
          imageUrl: i.imageUrl || '/assets/asset_15.webp',
          title: i.title,
          info: i.info || '',
        }))
      : fallbackAreas

  return (
    <section id="area" className="py-20 bg-lightgray">
      <div className="container-main">
        <SectionHeader
          label="АРЕНДА"
          title="Забронируйте зону отдыха"
          subtitle="Беседки у пляжа и пляжные зоны с базовым оборудованием для вашей компании"
        />

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-gray-100 animate-pulse aspect-[16/10]"
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {areas.map((item, i) => (
              <div
                key={item.title + i}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    width="1472"
                    height="704"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/80 mb-3">{item.info}</p>
                  <Link
                    to="/prices#аренда-время-работы-ежедневно-с-900-до-2000"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-dark text-sm font-medium hover:bg-white transition-colors"
                  >
                    Узнать цену
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
