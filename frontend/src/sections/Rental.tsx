import SectionHeader from '../components/SectionHeader'

const rentals = [
  {
    image: '/assets/catamaran.webp',
    title: 'Катамаран',
    info: 'До 4 человек',
  },
  {
    image: '/assets/beach_.webp',
    title: 'Лодка с веслами',
    info: 'До 3 человек',
  },
  {
    image: '/assets/asset_13.jpg',
    title: 'Велосипед',
    info: 'Почасовой прокат',
  },
  {
    image: '/assets/asset_14.jpg',
    title: 'SUP-доски',
    info: 'Активный отдых',
  },
]

export default function Rental() {
  return (
    <section id="rental" className="py-20 bg-white">
      <div className="container-main">
        <SectionHeader
          label="ПРОКАТ"
          title="Выберите инвентарь для отдыха"
          subtitle="Катамараны, лодки, велосипеды и SUP-доски для активного досуга на природе"
          buttonText="Забронировать прокат"
        />

        <div className="grid md:grid-cols-2 gap-5">
          {rentals.map((item, i) => (
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
