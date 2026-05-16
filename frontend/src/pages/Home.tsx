import { useEffect } from 'react'
import { useLocation } from 'react-router'
import Hero from '../sections/Hero'
import About from '../sections/About'
import Amenities from '../sections/Amenities'
import Accommodation from '../sections/Accommodation'
import Rental from '../sections/Rental'
import AreaBooking from '../sections/AreaBooking'

import Gallery from '../sections/Gallery'
import Contacts from '../sections/Contacts'
import Reviews from '../sections/Reviews'
import Footer from '../sections/Footer'

export default function Home() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== '/') return
    const id = location.hash.replace(/^#/, '')
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [location.pathname, location.hash])

  return (
    <div className="relative">
      <main>
        <Hero />
        <About />
        <Accommodation />
        <AreaBooking />
        <Rental />
        <Amenities />

        <Gallery />
        <Contacts />
        <Reviews />
      </main>
      <Footer />
    </div>
  )
}
