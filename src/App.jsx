import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import AuthModal from './components/AuthModal';
import BookingReceiptModal from './components/BookingReceiptModal';
import MobileBottomNav from './components/MobileBottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import ExploreHotels from './pages/ExploreHotels';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Hotel Microsite Layout & Pages
import HotelLayout from './pages/hotel/HotelLayout';
import HotelOverview from './pages/hotel/HotelOverview';
import HotelRooms from './pages/hotel/HotelRooms';
import HotelGallery from './pages/hotel/HotelGallery';
import HotelBookingWizard from './pages/hotel/HotelBookingWizard';

function MainLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function BookingRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/hotels/${slug}/book`} replace />;
}

function OpenAuthHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openAuth } = useAuth();

  useEffect(() => {
    if (searchParams.get('openAuth') === 'true') {
      openAuth('signin');
      const next = new URLSearchParams(searchParams);
      next.delete('openAuth');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, openAuth, setSearchParams]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ScrollToTop />
          <OpenAuthHandler />
          <AuthModal />
          <BookingReceiptModal />
          <MobileBottomNav />
          <Routes>
            {/* Main Website Pages */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<ExploreHotels />} />
              <Route path="/hotels" element={<Navigate to="/explore" replace />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Dedicated Dynamic Hotel Microsite */}
            <Route path="/hotels/:slug" element={<HotelLayout />}>
              <Route index element={<HotelOverview />} />
              <Route path="rooms" element={<HotelRooms />} />
              <Route path="gallery" element={<HotelGallery />} />
              <Route path="book" element={<HotelBookingWizard />} />
            </Route>

            {/* Customer Dashboard (strictly role === 'customer') */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:tab"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Hotel Manager Portal (strictly role === 'hotel_manager') */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['hotel_manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/:tab"
              element={
                <ProtectedRoute allowedRoles={['hotel_manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/dashboard"
              element={
                <ProtectedRoute allowedRoles={['hotel_manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Production Administrator Portal (strictly role === 'admin') */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:tab"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Alias Route */}
            <Route path="/booking/:slug" element={<BookingRedirect />} />

            {/* Fallback routes */}
            <Route path="/auth/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
