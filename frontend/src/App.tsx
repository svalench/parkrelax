import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import Navbar from './sections/Navbar'
import Home from './pages/Home'
import CookieBanner from './components/CookieBanner'
import { Loader2 } from 'lucide-react'
import { BOOKING_PUBLIC_ENABLED } from './config/features'

const LegalPage = lazy(() => import('./pages/LegalPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const BookingFormPage = lazy(() => import('./pages/BookingFormPage'))
const BookingComingSoonPage = lazy(() => import('./pages/BookingComingSoonPage'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AccommodationGalleryPage = lazy(() => import('./pages/AccommodationGalleryPage'))
const PriceListPage = lazy(() => import('./pages/PriceListPage'))
const AccommodationTypePage = lazy(() => import('./pages/AccommodationTypePage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lightgray">
      <Loader2 className="w-8 h-8 animate-spin text-brand" />
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/admin-panel'

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/booking"
            element={BOOKING_PUBLIC_ENABLED ? <BookingPage /> : <BookingComingSoonPage />}
          />
          <Route
            path="/booking/form"
            element={BOOKING_PUBLIC_ENABLED ? <BookingFormPage /> : <BookingComingSoonPage />}
          />
          <Route
            path="/payment"
            element={BOOKING_PUBLIC_ENABLED ? <PaymentPage /> : <BookingComingSoonPage />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/admin-panel" element={<AdminDashboardPage />} />
          <Route path="/admin-panel/accommodation-gallery" element={<AccommodationGalleryPage />} />
          <Route path="/prices" element={<PriceListPage />} />
          <Route path="/accommodation/:id" element={<AccommodationTypePage />} />
        </Routes>
      </Suspense>
      <CookieBanner />
    </>
  )
}

export default function App() {
  return <AppContent />
}
