import { Routes, Route } from 'react-router'
import Navbar from './sections/Navbar'
import Home from './pages/Home'
import LegalPage from './pages/LegalPage'
import BookingPage from './pages/BookingPage'
import BookingFormPage from './pages/BookingFormPage'
import PaymentPage from './pages/PaymentPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/form" element={<BookingFormPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
      </Routes>
    </>
  )
}
