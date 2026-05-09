import {
  Home,
  Bed,
  CircleCheck,
  PartyPopper,
  Bike,
  Flame,
  Anchor,
  Waves,
  Wifi,
  Umbrella,
  Car,
  Baby,
  Fish,
  Ship,
  UtensilsCrossed,
  Refrigerator,
  Tv,
  PawPrint,
  Droplets,
} from 'lucide-react'

/** Топовые удобства для быстрого обзора */
const quickTags = [
  { icon: Waves, label: 'Бассейн' },
  { icon: Flame, label: 'Баня и сауна' },
  { icon: Wifi, label: 'Wi-Fi' },
  { icon: Umbrella, label: 'Собственный пляж' },
  { icon: Car, label: 'Парковка' },
  { icon: Baby, label: 'Детская площадка' },
  { icon: Fish, label: 'Рыбалка' },
  { icon: Ship, label: 'Прокат лодок' },
  { icon: Bike, label: 'Велосипеды' },
  { icon: UtensilsCrossed, label: 'Мангал' },
  { icon: Refrigerator, label: 'Холодильник' },
  { icon: Tv, label: 'TV' },
  { icon: PawPrint, label: 'Можно с животными' },
]

const categories = [
  {
    icon: Home,
    title: 'Инфраструктура',
    items: [
      'Бассейн',
      'Мангал',
      'Беседка',
      'Водоём для купания',
      'Баня',
      'Сауна',
      'Wi-Fi',
      'TV',
      'Холодильник',
      'Телефон',
      'Детская площадка',
      'Отопление',
      'Собственный пляж',
    ],
  },
  {
    icon: Bed,
    title: 'Размещение',
    items: [
      'Коттедж',
      'Домик',
      'Треугольный домик',
      '2-местные номера',
      '3-местные номера',
      '4-местные номера',
    ],
  },
  {
    icon: CircleCheck,
    title: 'Для гостей',
    items: [
      'Оплата картой',
      'Парковка',
      'Можно с детьми',
      'Можно с животными',
    ],
  },
  {
    icon: PartyPopper,
    title: 'Активный отдых',
    items: [
      'Рыбалка',
      'Для корпоратива',
      'Для вечеринки',
      'На День Рождения',
      'Прокат лодок',
      'Беседка',
      'Интернет',
      'Мангал',
      'Спутниковое TV',
    ],
  },
  {
    icon: Bike,
    title: 'Спорт',
    items: [
      'Велосипеды',
      'Рыбалка',
      'Спортивная площадка',
    ],
  },
  {
    icon: Flame,
    title: 'Здоровье и SPA',
    items: [
      'Баня на дровах',
      'Бассейн на улице',
      'Русская парная',
      'Сауна',
      'Душ',
    ],
  },
  {
    icon: Droplets,
    title: 'Услуги',
    items: [
      'Детская площадка',
      'Душ',
      'Телефон',
    ],
  },
  {
    icon: Anchor,
    title: 'Дополнительно',
    items: [
      'Водоём',
      'Лодочная станция',
      'Пляж',
    ],
  },
]

export default function Amenities() {
  return (
    <section id="amenities" className="py-20 bg-lightgray">
      <div className="container-main">
        {/* Header */}
        <div className="max-w-2xl mb-10">
          <span className="section-label mb-3 block">УДОБСТВА</span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
            Всё для комфортного отдыха:
            <br />
            инфраструктура Парк Relax
          </h2>
          <p className="text-graytext leading-relaxed">
            На территории базы отдыха в Пинском районе есть всё необходимое: от <strong className="text-dark font-medium">бани на дровах</strong> и <strong className="text-dark font-medium">бассейна на улице</strong> до <strong className="text-dark font-medium">проката лодок</strong>, <strong className="text-dark font-medium">собственного пляжа</strong> и <strong className="text-dark font-medium">детской площадки</strong>. Рыбалка, велосипеды, мангалы, спутниковое TV — отдыхайте с комфортом среди природы.
          </p>
        </div>

        {/* Quick tags */}
        <div className="flex flex-wrap gap-3 mb-14">
          {quickTags.map((tag) => (
            <div
              key={tag.label}
              className="inline-flex items-center gap-2 bg-white border border-border/60 text-dark text-sm font-medium px-4 py-2 rounded-full shadow-sm"
            >
              <tag.icon className="w-4 h-4 text-brand shrink-0" />
              {tag.label}
            </div>
          ))}
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="bg-white rounded-2xl border border-border/40 p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                  <cat.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-base font-semibold text-dark">
                  {cat.title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => (
                  <span
                    key={item}
                    className="inline-block text-xs text-dark bg-lightgray px-2.5 py-1 rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
