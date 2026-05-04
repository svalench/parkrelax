import { Routes, Route } from 'react-router'
import Navbar from './sections/Navbar'
import Home from './pages/Home'
import LegalPage from './pages/LegalPage'
import BookingPage from './pages/BookingPage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
      </Routes>
    </>
  )
}
