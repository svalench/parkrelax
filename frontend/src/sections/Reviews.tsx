import { useEffect, useState } from 'react'
import { Star, User } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'

interface Review {
  id: number
  name: string
  avatarUrl: string | null
  rating: number
  text: string
  createdAt: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/review')
      .then((res) => res.json())
      .then((data: Review[]) => {
        setReviews(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const displayReviews = reviews.length > 0 ? reviews : []

  return (
    <section id="reviews" className="py-20 bg-white">
      <div className="container-main">
        <SectionHeader
          label="ОТЗЫВЫ ГОСТЕЙ"
          title="Что говорят о Комплексе отдыха Парк Relax"
          subtitle="Мы заботимся о Вашем отдыхе"
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayReviews.length === 0 ? (
          <div className="text-center text-graytext py-12">
            Пока нет отзывов. Скоро добавим!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayReviews.map((review, i) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-brand/30 transition-all duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  {review.avatarUrl ? (
                    <img
                      src={review.avatarUrl}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-dark text-sm">{review.name}</div>
                    <div className="text-xs text-graytext">{formatDate(review.createdAt)}</div>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className={`w-4 h-4 ${
                        si < review.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-sm text-graytext leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
