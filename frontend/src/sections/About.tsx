import { useState, useEffect } from 'react'
import {
  MapPin,
  TreePine,
  Home,
  Bike,
  PartyPopper,
  Car,
  WavesIcon,
  VolleyballIcon,
  Sun,
  Wind,
  Leaf,
  Flame,
} from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'

const categories = [
  {
    icon: Home,
    title: 'Размещение и комфорт',
    desc: 'Уютные коттеджи, апартаменты и летние домики у озера с современным оснащением для комфортной аренды',
  },
  {
    icon: WavesIcon,
    title: 'Озеро и пляж',
    desc: 'Чистое озеро с белым песчаным пляжем, обустроенная зона для купания и отдыха у воды',
  },
  {
    icon: Bike,
    title: 'Отдых и активность',
    desc: 'Прокат лодок, катамаранов и SUP, велосипеды, рыбалка, спортивные площадки и батуты для всей семьи',
  },
  {
    icon: Flame,
    title: 'Терасса с баней',
    desc: 'Баня на дровах с терассой и бассейном на свежем воздухе',
  },
  {
    icon: TreePine,
    title: 'Природа и рекреация',
    desc: 'SPA-комплекс с баней и подогреваемым бассейном, сосновый лес, озеро и чистейший воздух Полесья',
  },
  {
    icon: PartyPopper,
    title: 'Мероприятия и праздники',
    desc: 'Идеальное место для свадеб, дней рождения, корпоративов и любых особых событий на природе',
  },
]

interface GalleryItem {
  id: number
  imageUrl: string | null
  title: string | null
  category: string
  sortOrder: number
  isActive: boolean
}

const fallbackImages = [
  '/assets/asset_2.jpg',
  '/assets/asset_17.jpg',
  '/assets/asset_18.jpg',
  '/assets/asset_19.jpg',
  '/assets/asset_20.jpg',
]

const polesieFeatures = [
  {
    icon: Wind,
    title: '«Лёгкие Европы»',
    desc: 'Полесье — источник кислорода и чистого воздуха в Европе, на ровне с лесами Амазонки',
  },
  {
    icon: Sun,
    title: 'Солнечный климат',
    desc: 'Юг Беларуси всегда теплее и солнечнее: больше ясных дней для отдыха у воды',
  },
  {
    icon: WavesIcon,
    title: 'Озеро с белым пляжем',
    desc: 'Сосновый лес на берегу озера с белым песчаным пляжем — редкость для Беларуси',
  },
  {
    icon: Leaf,
    title: 'Реликтовая природа',
    desc: 'В шаговой доступности уникальная экосистема с редкими видами растений, птиц и животных',
  },
]

export default function About() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [galleryLoading, setGalleryLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((data: GalleryItem[]) => {
        const active = Array.isArray(data)
          ? data.filter((i) => i.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
          : []
        setGalleryItems(active)
        setGalleryLoading(false)
      })
      .catch(() => {
        setGalleryItems([])
        setGalleryLoading(false)
      })
  }, [])

  const images =
    galleryItems.length > 0
      ? galleryItems.map((i) => i.imageUrl || '/assets/asset_2.jpg')
      : fallbackImages

  return (
    <>
      {/* ─── About / О нас ─── */}
      <section id="about" className="py-20 bg-white">
        <div className="container-main">
          {/* Main 2-col */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* Text */}
            <div>
              <span className="section-label mb-3 block">О НАС</span>
              <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
                База отдыха в сердце
                <br />
                белорусского Полесья
              </h2>
              <p className="text-graytext leading-relaxed mb-4">
                Комплекс отдыха <strong className="text-dark font-semibold">Парк Relax</strong> — уникальный туристический объект в деревне Кончицы, Пинский район. Расположен на берегу живописного озера среди соснового бора с белым песчаным пляжем. Здесь можно снять коттедж или домик у озера, отдохнуть от городской суеты и насладиться чистым воздухом настоящего Полесья.
              </p>
              <p className="text-graytext leading-relaxed mb-6">
                Для размещения гостей предусмотрены уютный коттедж, апартаменты и летние домики с продуманным оснащением. На территории работает SPA-комплекс с террасой, баней и подогреваемым мини-бассейном. Комплекс вмещает до 150 человек — отличный выбор для семейного отдыха, выездных корпоративов и праздников.
              </p>

              {/* Info chips */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { icon: MapPin, text: '20 км от Пинска' },
                  { icon: MapPin, text: 'д. Кончицы, Пинский район' },
                  { icon: Car, text: 'Удобный подъезд' },
                  { icon: TreePine, text: 'Озеро и сосновый лес' },
                  { icon: VolleyballIcon, text: 'Активный отдых' },
                  { icon: WavesIcon, text: 'Белый песчаный пляж' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2 text-sm text-dark bg-lightgray px-3 py-1.5 rounded-full"
                  >
                    <item.icon className="w-4 h-4 text-brand shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>

              {/* How to get there */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-dark mb-3">
                  КАК ДОБРАТЬСЯ
                </h3>
                <div className="space-y-2 text-sm text-graytext leading-relaxed">
                  <p>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-2 align-middle" />
                    <strong className="text-dark">Из Минска</strong> — через исторический центр Пинска, столицы Белорусского Полесья.
                  </p>
                  <p>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-2 align-middle" />
                    <strong className="text-dark">Из Бреста</strong> — по живописной дороге с переправой через реку Пина на пароме.
                  </p>
                </div>
              </div>
            </div>

            {/* 3D Slider */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl h-[460px] md:h-[580px]">
              {galleryLoading ? (
                <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl" />
              ) : images.length === 0 ? (
                <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                  Нет фотографий
                </div>
              ) : (
                <Swiper
                  effect={'coverflow'}
                  grabCursor={true}
                  centeredSlides={true}
                  slidesPerView={'auto'}
                  spaceBetween={20}
                  coverflowEffect={{
                    rotate: 30,
                    stretch: 0,
                    depth: 200,
                    modifier: 1,
                    slideShadows: false,
                  }}
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  loop={images.length > 1}
                  modules={[EffectCoverflow, Pagination, Autoplay]}
                  className="w-full h-full about-3d-slider"
                >
                  {images.map((img, i) => (
                    <SwiperSlide
                      key={i}
                      className="!w-[280px] md:!w-[360px]"
                    >
                      <img
                        src={img}
                        alt={`Фото базы отдыха ${i + 1}`}
                        className="w-full h-full object-cover rounded-2xl"
                        draggable={false}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <div
                key={cat.title}
                className="text-center p-5 rounded-xl hover:bg-lightgray transition-colors duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-light flex items-center justify-center">
                  <cat.icon className="w-6 h-6 text-brand" />
                </div>
                <h4 className="text-sm font-semibold text-dark mb-1">{cat.title}</h4>
                <p className="text-xs text-graytext leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Почему Полесье ─── */}
      <section className="py-20 bg-[#162518] relative overflow-hidden">
        {/* subtle background texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'url(/assets/asset_3.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#162518] via-transparent to-[#162518]" />

        <div className="container-main relative z-10">
          <div className="max-w-2xl mb-12">
            <span className="section-label mb-3 block text-white/50">УНИКАЛЬНОЕ МЕСТО</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Почему именно <span className="text-brand">Полесье</span>?
            </h2>
            <p className="text-white/70 leading-relaxed">
              Пинщина — жемчужина белорусского Полесья. Именно здесь природа создала идеальные условия для восстановления сил и перезагрузки. Сочетание климата, ландшафта и уникальной экосистемы делает этот край по-настоящему целебным.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {polesieFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-brand/30 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-brand/15 flex items-center justify-center group-hover:bg-brand/25 transition-colors">
                  <feature.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
