import { MapPin, TreePine, Home, Bike, PartyPopper, Car, WavesIcon, VolleyballIcon } from 'lucide-react'

const categories = [
  {
    icon: Home,
    title: 'Размещение и комфорт',
    desc: 'Уютные коттеджи, апартаменты и летние домики с современным оборудованием',
  },
  {
    icon: Bike,
    title: 'Отдых и активность',
    desc: 'Прокат, прогулки на лодках, катамаранах и SUP, спортивные площадки, велосипеды',
  },
  {
    icon: TreePine,
    title: 'Природа и рекреация',
    desc: 'Окно в мир природы: озеро, лес, баня, бассейны, и многое другое на свежем воздухе',
  },
  {
    icon: PartyPopper,
    title: 'Мероприятия и праздники',
    desc: 'Идеальное место для дней рождения, свадеб, корпоративов и любых особых событий',
  },
]

export default function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container-main">
        {/* Main 2-col */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Text */}
          <div>
            <span className="section-label mb-3 block">О НАС</span>
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">
              Комплекс отдыха
              <br />
              Парк Relax
            </h2>
            <p className="text-graytext leading-relaxed mb-6">
              Парк Relax расположен в живописном уголке в деревне Кончицы. Это место, где можно отдохнуть от городской суеты, насладиться тишиной, свежим воздухом и красотой природы.
            </p>

            {/* Info row */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-dark">
                <MapPin className="w-4 h-4 text-brand"/>
                20 км от Пинска
              </div>
              <div className="flex items-center gap-2 text-sm text-dark">
                <MapPin className="w-4 h-4 text-brand"/>
                3 км от центра
              </div>
              <div className="flex items-center gap-2 text-sm text-dark">
                <Car className="w-4 h-4 text-brand"/>
                Удобный подъезд
              </div>
              <div className="flex items-center gap-2 text-sm text-dark">
                <TreePine className="w-4 h-4 text-brand"/>
                Озеро и лес
              </div>
              <div className="flex items-center gap-2 text-sm text-dark">
                <VolleyballIcon className="w-4 h-4 text-brand"/>
                Активный отдых
              </div>
              <div className="flex items-center gap-2 text-sm text-dark">
                <WavesIcon className="w-4 h-4 text-brand"/>
                Пляж
              </div>
            </div>

            {/* How to get there */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dark mb-2">
                КАК ДОБРАТЬСЯ
              </h3>
              <p className="text-sm text-graytext leading-relaxed">
                Из Минска через магистральный центр Минск — сторону Пинска. Из Бреста по шоссейной дороге, поворот направо у ст. Островцы.
              </p>
            </div>
          </div>

          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src="/assets/asset_2.jpg"
              alt="Домики в Парк Relax"
              className="w-full h-[360px] object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-sm">
              Парк Relax
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <div
              key={cat.title}
              className="text-center p-4 rounded-xl hover:bg-lightgray transition-colors duration-300"
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
  )
}
