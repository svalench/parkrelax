import { useEffect, useState } from 'react'
import { MapPin, Phone, Mail, Check, Copy, ArrowRight } from 'lucide-react'
import { fetchContacts, type ContactPublicResponse } from '@/lib/contacts'

export default function Contacts() {
  const [data, setData] = useState<ContactPublicResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState(false)

  useEffect(() => {
    fetchContacts()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const contact = data?.contact
  const phones = data?.phones ?? []
  const emails = data?.emails ?? []

  const address = contact?.address ?? 'Пинский район, д. Кончицы'
  const mapEmbed = contact?.yandexMapEmbed ?? ''

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <section id="contacts" className="py-20 md:py-28 bg-lightgray">
      <div className="container-main">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — Text */}
          <div>
            <span className="section-label mb-3 block text-sm tracking-[0.12em]">КОНТАКТЫ</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-4 leading-tight">
              Всегда на связи
              <br className="hidden md:block" /> и легко добраться
            </h2>
            <p className="text-lg text-graytext leading-relaxed mb-8 max-w-lg">
              Свяжитесь по указанным данным, поможем подобрать формат размещения и быстро оформить бронирование
            </p>

            {/* Check list */}
            <div className="flex flex-wrap gap-3 mb-10">
              <div className="flex items-center gap-2 text-base text-dark bg-white px-5 py-2.5 rounded-full shadow-sm">
                <Check className="w-4 h-4 text-brand" />
                Гостеприимный персонал 24/7
              </div>
              <div className="flex items-center gap-2 text-base text-dark bg-white px-5 py-2.5 rounded-full shadow-sm">
                <Check className="w-4 h-4 text-brand" />
                Удобный подъезд в любое время года
              </div>
            </div>

            {/* Contact cards */}
            <div className="space-y-4">
              {/* Address card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold uppercase tracking-wide text-graytext mb-1">
                      Адрес
                    </div>
                    <div className="text-lg md:text-xl font-semibold text-dark leading-snug">
                      {address}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    title={copiedAddress ? 'Скопировано!' : 'Скопировать адрес'}
                    className="shrink-0 w-10 h-10 rounded-xl bg-lightgray hover:bg-brand/10 flex items-center justify-center transition-colors group/copy"
                  >
                    {copiedAddress ? (
                      <Check className="w-5 h-5 text-brand" />
                    ) : (
                      <Copy className="w-5 h-5 text-graytext group-hover/copy:text-brand transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Phones card */}
              {phones.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold uppercase tracking-wide text-graytext mb-2">
                        Телефон
                      </div>
                      <div className="flex flex-col gap-2">
                        {phones.map((p) => (
                          <a
                            key={p.id}
                            href={`tel:${p.number.replace(/\s/g, '').replace(/[()-]/g, '')}`}
                            className="group/link flex items-center justify-between text-lg md:text-xl font-semibold text-dark hover:text-brand transition-colors"
                          >
                            <span>{p.number}</span>
                            <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-graytext group-hover/link:text-brand transition-colors">
                              <Phone className="w-4 h-4" />
                              Позвонить
                              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emails card */}
              {emails.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand/20 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold uppercase tracking-wide text-graytext mb-2">
                        Email
                      </div>
                      <div className="flex flex-col gap-2">
                        {emails.map((e) => (
                          <a
                            key={e.id}
                            href={`mailto:${e.email}`}
                            className="group/link flex items-center justify-between text-lg md:text-xl font-semibold text-dark hover:text-brand transition-colors"
                          >
                            <span className="break-all">{e.email}</span>
                            <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-graytext group-hover/link:text-brand transition-colors shrink-0 ml-3">
                              <Mail className="w-4 h-4" />
                              Написать
                              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Map */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-200 aspect-[4/3] md:aspect-auto md:h-[520px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
              </div>
            ) : mapEmbed ? (
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: mapEmbed }}
                ref={(node) => {
                  if (node) {
                    const iframe = node.querySelector('iframe')
                    if (iframe && !iframe.hasAttribute('title')) {
                      iframe.setAttribute('title', 'Карта расположения комплекса отдыха Парк Relax')
                    }
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-graytext gap-3">
                <MapPin className="w-10 h-10 text-gray-300" />
                <span className="text-lg">Карта скоро появится</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
