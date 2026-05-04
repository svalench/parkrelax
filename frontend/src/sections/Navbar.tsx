import { useState, useEffect } from 'react'
import { Menu, X, Phone } from 'lucide-react'

const navLinks = [
  { label: 'Главная', href: '#about' },
  { label: 'О комплексе', href: '#about' },
  { label: 'Проживание', href: '#accommodation' },
  { label: 'Услуги', href: '#rental' },
  { label: 'Галерея', href: '#gallery' },
  { label: 'Цены', href: '#accommodation' },
  { label: 'Контакты', href: '#contacts' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="container-main flex items-center justify-between h-16 md:h-20">
          {/* Phone */}
          <a
            href="tel:+375295005029"
            className={`hidden md:flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
              scrolled ? 'text-dark' : 'text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            +375 (29) 500-50-29
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  scrolled
                    ? 'text-dark hover:text-brand'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-4">
            <a
              href="#accommodation"
              className={`hidden md:inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                scrolled
                  ? 'border-brand text-brand hover:bg-brand-light'
                  : 'border-white text-white hover:bg-white/10'
              }`}
            >
              Забронировать
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                scrolled ? 'text-dark' : 'text-white'
              }`}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 animate-in slide-in-from-right duration-300">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-lg font-medium text-dark py-2 block"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="tel:+375295005029"
              className="flex items-center gap-2 text-brand font-semibold mt-4"
            >
              <Phone className="w-5 h-5" />
              +375 (29) 500-50-29
            </a>
            <a
              href="#accommodation"
              className="btn-brand text-center mt-2"
              onClick={() => setMobileOpen(false)}
            >
              Забронировать
            </a>
          </nav>
        </div>
      )}
    </>
  )
}
