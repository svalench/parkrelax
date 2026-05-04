import { Star } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'

const reviews = [
  {
    name: 'Ольга',
    avatar: '/assets/avatar_olga.jpg',
    rating: 5,
    text: 'Была вчера в Парке Relax, это было просто волшебно! Очень чисто, уютно, красиво. Атмосфера располагает к отдыху. Персонал очень вежливый, внимательный. Всё продумано до мелочей. Обязательно вернёмся ещё. Спасибо!',
  },
  {
    name: 'Марина',
    avatar: '/assets/avatar_marina.jpg',
    rating: 5,
    text: 'Любимое место для отдыха нашей семьи. Здесь волшебная природа, уютные домики, чистейший воздух. Можно отдохнуть душой и телом, насладиться тишиной, побыть наедине с природой.',
  },
  {
    name: 'Екатерина',
    avatar: '/assets/avatar_ekaterina.jpg',
    rating: 5,
    text: 'Отдыхали большой компанией, всё понравилось, есть всё необходимое, мангалы, беседки, детская площадка. Дети были в восторге! Прекрасное место для семейного отдыха.',
  },
  {
    name: 'Ксения',
    avatar: '/assets/avatar_ksenia.jpg',
    rating: 5,
    text: 'Отличное место для семейного отдыха. Всё есть, чисто, красиво, развлечения для детей.',
  },
  {
    name: 'Ден',
    avatar: '/assets/avatar_den.jpg',
    rating: 5,
    text: 'Место невероятное. 30 км от города. Есть баня, сауна, беседки, можно заказать еду. Всё для отдыха. Очень спокойное место. Есть где погулять, озеро и катамараны. Отдыхали в выходные.',
  },
  {
    name: 'Ирина',
    avatar: '/assets/avatar_irina.jpg',
    rating: 5,
    text: 'Отличный чистый пляж, хорошее место для отдыха с детьми.',
  },
]

export default function Reviews() {
  return (
    <section id="reviews" className="py-20 bg-white">
      <div className="container-main">
        <SectionHeader
          label="ОТЗЫВЫ ГОСТЕЙ"
          title="Что говорят о Парк Relax"
          subtitle="Мы бережно собираем обратную связь, чтобы каждый следующий отдых был ещё лучше"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <div
              key={review.name}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-brand/30 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-dark text-sm">{review.name}</div>
                  <div className="text-xs text-graytext">{['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь'][i % 6]} 2024</div>
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
      </div>
    </section>
  )
}
