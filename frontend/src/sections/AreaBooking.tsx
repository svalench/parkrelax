import SectionHeader from '../components/SectionHeader'

const areas = [
  {
    image: '/assets/asset_15.jpg',
    title: 'Беседки у пляжа',
    info: '8 мест',
  },
  {
    image: '/assets/asset_16.jpg',
    title: 'Зона пляжа',
    info: 'Стол, шезлонги, мангал',
  },
]

export default function AreaBooking() {
  return (
    <section id="area" className="py-20 bg-lightgray">
      <div className="container-main">
        <SectionHeader
          label="АРЕНДА"
          title="Забронируйте зону отдыха"
          subtitle="Беседки у пляжа и пляжные зоны с базовым оборудованием для вашей компании"
          buttonText="Забронировать аренду"
        />

        <div className="grid md:grid-cols-2 gap-5">
          {areas.map((item, i) => (
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/80">{item.info}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
