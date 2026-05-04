import Navbar from '../sections/Navbar'
import Hero from '../sections/Hero'
import About from '../sections/About'
import Accommodation from '../sections/Accommodation'
import Rental from '../sections/Rental'
import AreaBooking from '../sections/AreaBooking'
import Gallery from '../sections/Gallery'
import Contacts from '../sections/Contacts'
import Reviews from '../sections/Reviews'
import Footer from '../sections/Footer'

export default function Home() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Accommodation />
        <Rental />
        <AreaBooking />
        <Gallery />
        <Contacts />
        <Reviews />
      </main>
      <Footer />
    </div>
  )
}
