import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowLeft, FileText } from 'lucide-react'
import Footer from '../sections/Footer'
import { sanitizeRichHtml } from '../lib/safeHtml'

interface LegalPageData {
  id: number
  slug: string
  title: string
  content: string
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

const API_BASE = '/api/legal-pages'

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState<LegalPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const ac = new AbortController()
    void (async () => {
      await Promise.resolve()
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/${slug}`, { signal: ac.signal })
        if (!res.ok) {
          if (res.status === 404) throw new Error('Страница не найдена')
          throw new Error('Ошибка загрузки страницы')
        }
        const data: LegalPageData = await res.json()
        if (ac.signal.aborted) return
        setPage(data)
      } catch (err) {
        if (ac.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Ошибка загрузки страницы')
      } finally {
        setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [slug])

  const lastUpdated = page?.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString('ru-BY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      <main className="flex-1 pt-24 pb-16">
        <div className="container-main">
          {/* Back link */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-graytext hover:text-brand transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-graytext/40 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-dark mb-2">
                {error === 'Страница не найдена' ? 'Страница не найдена' : 'Ошибка загрузки'}
              </h2>
              <p className="text-graytext mb-6">
                {error === 'Страница не найдена'
                  ? 'Запрашиваемая юридическая страница не существует или временно недоступна.'
                  : 'Не удалось загрузить содержимое страницы. Попробуйте позже.'}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-brand hover:text-brand-hover font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Вернуться на главную
              </Link>
            </div>
          )}

          {!loading && !error && page && (
            <article className="max-w-3xl mx-auto">
              <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-dark mb-3">
                  {page.title}
                </h1>
                {lastUpdated && (
                  <p className="text-sm text-graytext">
                    Последнее обновление: {lastUpdated}
                  </p>
                )}
              </header>

              <div
                className="prose prose-lg max-w-none text-dark/90
                  prose-headings:text-dark prose-headings:font-semibold
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:leading-relaxed prose-p:mb-4
                  prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                  prose-li:mb-1.5 prose-li:marker:text-brand
                  prose-strong:text-dark prose-strong:font-semibold
                  prose-a:text-brand hover:prose-a:text-brand-hover
                  prose-hr:my-8"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.content) }}
              />
            </article>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
