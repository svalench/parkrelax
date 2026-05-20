import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Loader2 } from 'lucide-react'
import { getLucideIcon } from '@/lib/icons'

interface AmenitySection {
  id: number | null
  label: string
  title: string
  description: string
}

interface QuickTag {
  id: number
  iconName: string
  label: string
  link: string
}

interface AmenityItem {
  id: number
  title: string
  link: string
}

interface Category {
  id: number
  iconName: string
  title: string
  items: AmenityItem[]
}

interface AmenitiesData {
  section: AmenitySection
  quickTags: QuickTag[]
  categories: Category[]
}

export default function Amenities() {
  const [data, setData] = useState<AmenitiesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/amenities')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load amenities')
        return r.json()
      })
      .then((payload: AmenitiesData) => setData(payload))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section id="amenities" className="py-20 bg-lightgray">
        <div className="container-main flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      </section>
    )
  }

  if (!data) return null

  const { section, quickTags, categories } = data

  return (
    <section id="amenities" className="py-20 bg-lightgray">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <span className="section-label mb-3 block">{section.label}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            {section.title}
          </h2>
          <p
            className="text-graytext leading-relaxed"
            dangerouslySetInnerHTML={{ __html: section.description }}
          />
        </div>

        {/* Quick tags */}
        {quickTags.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-14">
            {quickTags.map((tag) => {
              const Icon = getLucideIcon(tag.iconName)
              return (
                <Link
                  key={tag.id}
                  to={tag.link}
                  className="inline-flex items-center gap-2 bg-white border border-border/60 text-dark text-sm font-medium px-4 py-2 rounded-full shadow-sm no-underline"
                >
                  {Icon && <Icon className="w-4 h-4 text-brand shrink-0" />}
                  {tag.label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Category cards */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {categories.map((cat) => {
              const Icon = getLucideIcon(cat.iconName)
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-border/40 p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                      {Icon && <Icon className="w-5 h-5 text-brand" />}
                    </div>
                    <h3 className="text-base font-semibold text-dark">
                      {cat.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item) => (
                      <Link
                        key={item.id}
                        to={item.link}
                        className="inline-block text-xs text-dark bg-lightgray px-2.5 py-1 rounded-full no-underline"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
