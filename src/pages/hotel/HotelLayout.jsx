import { useState, useEffect } from 'react';
import { useParams, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getHotelBySlug, useHotel } from '../../data/hotels';
import HotelNavbar from '../../components/hotel/HotelNavbar';
import HotelContactModal from '../../components/hotel/HotelContactModal';
import Footer from '../../components/Footer';

export default function HotelLayout() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hotel = useHotel(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug, pathname]);

  const [bookingState, setBookingState] = useState({
    arrival: '',
    departure: '',
    guests: '2 Guests, 1 Room',
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Show sticky bottom bar on hotel overview and rooms pages (not during checkout wizard)
  const isOverviewOrRooms =
    pathname === `/hotels/${slug}` ||
    pathname === `/hotels/${slug}/` ||
    pathname === `/hotels/${slug}/rooms`;

  if (!hotel) {
    return (
      <div
        style={{
          padding: '120px 20px 80px',
          textAlign: 'center',
          minHeight: '80vh',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <span className="eyebrow">HOTEL NOT FOUND</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', margin: '16px 0 12px' }}>
          We couldn’t find that property in Abraka.
        </h1>
        <p style={{ color: 'var(--color-warm-gray)', maxWidth: '480px', margin: '0 auto 28px' }}>
          The hotel link you followed may be incorrect, or the property may have been relocated.
        </p>
        <Link to="/explore" className="btn btn-primary">
          Explore All Verified Hotels
        </Link>
      </div>
    );
  }

  const handleOpenBooking = (room = null) => {
    if (hotel.isDelisted) {
      alert('Bookings are currently paused for this property by the manager.');
      return;
    }
    if (room) {
      setSelectedRoom(room);
    }
    const params = new URLSearchParams();
    if (room?.id) params.set('room', room.id);
    if (bookingState.arrival) params.set('arrival', bookingState.arrival);
    if (bookingState.departure) params.set('departure', bookingState.departure);
    if (bookingState.guests) params.set('guests', bookingState.guests);

    const query = params.toString();
    navigate(`/hotels/${slug}/book${query ? `?${query}` : ''}`);
  };

  const handleOpenContact = () => {
    setIsContactOpen(true);
  };

  const displayRate = selectedRoom ? selectedRoom.price : hotel.price;

  return (
    <div className="hotel-microsite">
      {hotel.isDelisted && (
        <div
          style={{
            background: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            color: '#92400e',
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: '13.5px',
            fontWeight: '600',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>
            ⚠️ Bookings Currently Paused — This property has been temporarily de-listed and is not
            taking public reservations.
          </span>
        </div>
      )}

      <HotelNavbar
        hotel={hotel}
        onOpenContact={handleOpenContact}
        onOpenBooking={() => handleOpenBooking(selectedRoom)}
      />

      <main
        className={`hotel-microsite__main ${
          isOverviewOrRooms && !hotel.isDelisted ? 'hotel-microsite__main--with-sticky-bar' : ''
        }`}
      >
        <Outlet
          context={{
            hotel,
            bookingState,
            setBookingState,
            selectedRoom,
            setSelectedRoom,
            handleOpenBooking,
            handleOpenContact,
          }}
        />
      </main>

      {/* Mobile Sticky Bottom Action Bar */}
      {isOverviewOrRooms && !hotel.isDelisted && (
        <aside className="hotel-sticky-bottom-bar" aria-label="Mobile booking action bar">
          <div className="hotel-sticky-bottom-bar__price-info">
            <span className="hotel-sticky-bottom-bar__rate-label">Base Rate</span>
            <div className="hotel-sticky-bottom-bar__rate">
              {displayRate} <span>/ night</span>
            </div>
          </div>
          <button
            type="button"
            className="hotel-sticky-bottom-bar__book-btn"
            onClick={() => handleOpenBooking(selectedRoom)}
          >
            <span>Book Stay</span>
            <ArrowRight size={15} />
          </button>
        </aside>
      )}

      <HotelContactModal
        hotel={hotel}
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <Footer />
    </div>
  );
}
