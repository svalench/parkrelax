import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react'
import { slugify } from '@/lib/slugify'

interface PriceItem {
  category: string
  name: string
  price: string
  isNote?: boolean
}

interface PriceListData {
  id: number
  data: PriceItem[]
  updatedAt: string | null
}

export default function PriceListPage() {
  const [priceList, setPriceList] = useState<PriceListData | null>(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  // Group by category
  const grouped: Record<string, PriceItem[]> = {}
  priceList?.data.forEach((item) => {
    const cat = item.category || 'Разное'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  })

  const categories = Object.keys(grouped)

  useEffect(() => {
    fetch('/api/price-list')
      .then((r) => r.json())
      .then((data: PriceListData) => {
        setPriceList(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (categories.length === 0) return
    const hash = decodeURIComponent(location.hash.replace('#', ''))
    if (!hash) return
    const scrollToHash = () => {
      const el = document.getElementById(hash)
      if (el) {
        const headerOffset = 96 // pt-24 = 96px
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }
    // Несколько попыток: сразу после рендера, 100мс и 300мс
    const timers = [0, 100, 300].map((d) => setTimeout(scrollToHash, d))
    return () => timers.forEach(clearTimeout)
  }, [categories.length, location.hash])

  return (
    <div className="min-h-screen bg-lightgray pt-24 md:pt-28 pb-12">
      <div className="container-main max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-graytext hover:text-dark mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-dark mb-2">
            Прайс-лист
          </h1>
          <p className="text-graytext">
            Актуальные цены на услуги и прокат комплекса отдыха Парк Relax
          </p>
          {priceList?.updatedAt && (
            <p className="text-xs text-graytext mt-1">
              Обновлено: {new Date(priceList.updatedAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark mb-2">
              Прайс-лист обновляется
            </h3>
            <p className="text-graytext text-sm">
              Информация о ценах появится в ближайшее время. Свяжитесь с нами по телефону для уточнения стоимости.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const items = grouped[category]
              const notes = items.filter((i) => i.isNote)
              const rows = items.filter((i) => !i.isNote)

              return (
                <section
                  key={category}
                  id={slugify(category)}
                  className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden scroll-mt-28"
                >
                  {/* Category header */}
                  <div className="px-6 py-4 bg-brand/5 border-b border-border/40">
                    <h2 className="text-lg font-bold text-dark">{category}</h2>
                  </div>

                  {/* Table */}
                  {rows.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-gray-50/50">
                            <th className="text-left px-6 py-3 font-semibold text-dark w-full">
                              Наименование
                            </th>
                            <th className="text-right px-6 py-3 font-semibold text-dark whitespace-nowrap">
                              Цена
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((item, idx) => (
                            <tr
                              key={idx}
                              id={slugify(item.name)}
                              className="border-b border-border/20 last:border-b-0 hover:bg-gray-50/50 transition-colors scroll-mt-24"
                            >
                              <td className="px-6 py-3 text-dark">{item.name}</td>
                              <td className="px-6 py-3 text-right font-semibold text-brand whitespace-nowrap">
                                {item.price}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Notes */}
                  {notes.length > 0 && (
                    <div className="px-6 py-4 bg-amber-50/60 border-t border-amber-100">
                      {notes.map((note, idx) => (
                        <p key={idx} className="text-xs text-amber-800 leading-relaxed">
                          {note.name}
                        </p>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-graytext text-sm mb-4">
            Остались вопросы по ценам? Свяжитесь с нами — мы поможем подобрать оптимальный вариант.
          </p>
          <Link
            to="/#contacts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors"
          >
            <Download className="w-4 h-4" />
            Связаться с нами
          </Link>
        </div>
      </div>
    </div>
  )
}
