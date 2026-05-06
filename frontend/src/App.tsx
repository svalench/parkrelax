import { Routes, Route, useLocation } from 'react-router'
import Navbar from './sections/Navbar'
import Home from './pages/Home'
import LegalPage from './pages/LegalPage'
import BookingPage from './pages/BookingPage'
import BookingFormPage from './pages/BookingFormPage'
import PaymentPage from './pages/PaymentPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboardPage from './pages/AdminDashboardPage'

function AppContent() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/admin-panel'

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/form" element={<BookingFormPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
        <Route path="/admin-panel" element={<AdminDashboardPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return <AppContent />
}
