import { MapPin, Phone, Mail, Check, Navigation, Plus, Minus } from 'lucide-react'

export default function Contacts() {
  return (
    <section id="contacts" className="py-20 bg-lightgray">
      <div className="container-main">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left — Text */}
          <div>
            <span className="section-label mb-3 block">КОНТАКТЫ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-dark mb-3">
              Всегда на связи и легко добраться
            </h2>
            <p className="text-graytext leading-relaxed mb-6">
              Свяжитесь по указанным данным, поможем подобрать формат размещения и быстро оформить бронирование
            </p>

            {/* Check list */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-dark bg-white px-4 py-2 rounded-full">
                <Check className="w-4 h-4 text-brand" />
                Гостеприимный персонал 24/7
              </div>
              <div className="flex items-center gap-2 text-sm text-dark bg-white px-4 py-2 rounded-full">
                <Check className="w-4 h-4 text-brand" />
                Удобный подъезд в любое время года
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm text-graytext">Адрес</div>
                  <div className="text-dark font-medium">д. Островцы, Брестская область</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm text-graytext">Телефон</div>
                  <a href="tel:+375295005029" className="text-dark font-medium hover:text-brand transition-colors block">
                    +375 (29) 500-50-29
                  </a>
                  <a href="tel:+375295005008" className="text-dark font-medium hover:text-brand transition-colors block">
                    +375 (29) 500-50-08
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm text-graytext">Email</div>
                  <a href="mailto:park_office@mail.ru" className="text-dark font-medium hover:text-brand transition-colors">
                    park_office@mail.ru
                  </a>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <a href="tel:+375295005029" className="btn-brand inline-flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Позвонить
              </a>
              <a href="mailto:park_office@mail.ru" className="btn-brand-outline inline-flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Написать
              </a>
            </div>
          </div>

          {/* Right — Map */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/assets/asset_23.jpg"
              alt="Карта расположения Парк Relax"
              className="w-full h-[400px] object-cover"
            />
            {/* Map controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Plus className="w-4 h-4 text-dark" />
              </button>
              <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Minus className="w-4 h-4 text-dark" />
              </button>
              <button className="w-8 h-8 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Navigation className="w-4 h-4 text-dark" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
