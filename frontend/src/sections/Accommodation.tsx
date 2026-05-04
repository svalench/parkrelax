import SectionHeader from '../components/SectionHeader'

const accommodations = [
  {
    image: '/assets/asset_7.jpg',
    title: 'Коттедж',
    capacity: 'До 8 человек',
  },
  {
    image: '/assets/asset_8.jpg',
    title: 'Апартаменты',
    capacity: 'До 4 человек',
  },
  {
    image: '/assets/asset_9.jpg',
    title: 'Летние домики',
    capacity: 'До 6 человек',
  },
  {
    image: '/assets/asset_10.jpg',
    title: 'Терраса с баней и мини бассейном',
    capacity: 'До 10 человек',
  },
]

export default function Accommodation() {
  return (
    <section id="accommodation" className="py-20 bg-lightgray">
      <div className="container-main">
        <SectionHeader
          label="ПРОЖИВАНИЕ"
          title="Выберите формат отдыха"
          subtitle="Уютные домики, просторные апартаменты и весёлый благоустроенный отдых для любой компании"
          buttonText="Забронировать проживание"
        />

        <div className="grid md:grid-cols-2 gap-5">
          {accommodations.map((item, i) => (
            <div
              key={item.title}
              className="group relative rounded-xl overflow-hidden cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Text */}
              <div className="absolute bottom-0 left-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/80">{item.capacity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
