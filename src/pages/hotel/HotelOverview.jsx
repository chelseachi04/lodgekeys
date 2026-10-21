import { useState, useMemo } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, Share2, Heart, Calendar, User, ArrowRight, 
  Check, Clock, ShieldCheck, Sparkles, Image as ImageIcon,
  Wifi, Waves, UtensilsCrossed, Zap, Car, Wine, Dumbbell,
  Coffee, Shield, Star, Tv, Wind
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './HotelOverview.css';

function getHeroTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const amenityIconsMap = {
  pool: <Waves size={15} />,
  wifi: <Wifi size={15} />,
  restaurant: <UtensilsCrossed size={15} />,
  utensils: <UtensilsCrossed size={15} />,
  zap: <Zap size={15} />,
  waves: <Waves size={15} />,
  spa: <Sparkles size={15} />,
  car: <Car size={15} />,
  bar: <Wine size={15} />,
  gym: <Dumbbell size={15} />,
  dumbbell: <Dumbbell size={15} />,
  coffee: <Coffee size={15} />,
  shield: <Shield size={15} />,
  tv: <Tv size={15} />,
  wind: <Wind size={15} />,
  star: <Star size={15} />,
  sparkles: <Sparkles size={15} />,
};

export default function HotelOverview() {
  const navigate = useNavigate();
  const { 
    hotel, 
    bookingState, 
    setBookingState, 
    selectedRoom, 
    setSelectedRoom, 
    handleOpenBooking, 
    handleOpenContact 
  } = useOutletContext();

  const { isFavorite, toggleFavorite } = useAuth();
  const isFav = isFavorite(hotel);
  const [copiedToast, setCopiedToast] = useState(false);

  const todayStr = useMemo(() => getHeroTodayStr(), []);

  // Local booking form states
  const [arrival, setArrival] = useState(bookingState.arrival);
  const [departure, setDeparture] = useState(bookingState.departure);
  const [guests, setGuests] = useState(bookingState.guests);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2600);
  };

  const handleHeroBookingSubmit = (e) => {
    e.preventDefault();
    setBookingState({ arrival, departure, guests });
    const chosenRoom = selectedRoom || (hotel.rooms ? hotel.rooms[0] : null);
    const params = new URLSearchParams();
    if (chosenRoom?.id) params.set('room', chosenRoom.id);
    if (arrival) params.set('arrival', arrival);
    if (departure) params.set('departure', departure);
    if (guests) params.set('guests', guests);
    navigate(`/hotels/${hotel.slug}/book?${params.toString()}`);
  };

  const currentRate = selectedRoom ? selectedRoom.price : hotel.price;

  return (
    <div className="hotel-overview">
      {/* 1. Hero Section & Booking Bar (Reference Screenshot 3) */}
      <section className="hotel-hero" style={{ backgroundImage: `url(${hotel.heroImage || hotel.image})` }}>
        <div className="hotel-hero__overlay" />
        <div className="hotel-hero__container container">
          {/* Integrated Booking Card Overlay */}
          <div className="hotel-hero__booking-card">
            <div className="hotel-hero__booking-accent" />
            <h2 className="hotel-hero__booking-title">BOOK A ROOM ONLINE</h2>

            <form onSubmit={handleHeroBookingSubmit} className="hotel-hero__form">
              <div className="hotel-hero__field">
                <label className="hotel-hero__label">Arrival</label>
                <div className="hotel-hero__input-wrap">
                  <input
                    type="date"
                    className="hotel-hero__input"
                    value={arrival}
                    min={todayStr}
                    onChange={(e) => {
                      setArrival(e.target.value);
                      if (departure && e.target.value >= departure) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + 1);
                        setDeparture(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
                      }
                    }}
                    required
                  />
                  <Calendar size={18} className="hotel-hero__icon" />
                </div>
              </div>

              <div className="hotel-hero__field">
                <label className="hotel-hero__label">Departure</label>
                <div className="hotel-hero__input-wrap">
                  <input
                    type="date"
                    className="hotel-hero__input"
                    value={departure}
                    min={arrival ? (() => {
                      const d = new Date(arrival);
                      d.setDate(d.getDate() + 1);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    })() : todayStr}
                    onChange={(e) => setDeparture(e.target.value)}
                    required
                  />
                  <Calendar size={18} className="hotel-hero__icon" />
                </div>
              </div>

              <div className="hotel-hero__field">
                <label className="hotel-hero__label">Guests & Room</label>
                <div className="hotel-hero__input-wrap">
                  <select
                    className="hotel-hero__select"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    <option value="1 Guest, 1 Room">1 Guest, 1 Room</option>
                    <option value="2 Guests, 1 Room">2 Guests, 1 Room</option>
                    <option value="3 Guests, 2 Rooms">3 Guests, 2 Rooms</option>
                    <option value="4+ Guests, Suite">4+ Guests, Suite</option>
                  </select>
                  <User size={18} className="hotel-hero__icon" />
                </div>
              </div>

              <button type="submit" className="hotel-hero__submit-btn">
                Book Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Page Body Structure (Reference Screenshot 1) */}
      <section className="hotel-body container">
        {/* Breadcrumbs */}
        <nav className="hotel-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep">&gt;</span>
          <Link to="/explore" className="breadcrumb-link">Explore Hotels</Link>
          <span className="breadcrumb-sep">&gt;</span>
          <span className="breadcrumb-current">{hotel.name}</span>
        </nav>

        {/* Title Header */}
        <div className="hotel-header">
          <div className="hotel-header__left">
            <span className="hotel-subtag">{hotel.subTag || `${hotel.category.toUpperCase()} · LUXURY RETREAT`}</span>
            <h1 className="hotel-title">{hotel.name}</h1>
            <div className="hotel-location-tag">
              <MapPin size={15} />
              <span>{hotel.address || hotel.location}</span>
            </div>
          </div>

          <div className="hotel-header__actions">
            <button 
              className="hotel-action-btn"
              onClick={handleShare}
              title="Share this hotel"
              aria-label="Share hotel link"
            >
              <Share2 size={16} />
            </button>
            <button 
              className={`hotel-action-btn ${isFav ? 'hotel-action-btn--fav' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(hotel.id || hotel.slug);
              }}
              title={isFav ? 'Remove from saved hotels' : 'Save hotel to favorites'}
              aria-label={isFav ? 'Remove from saved hotels' : 'Save hotel to favorites'}
            >
              <Heart size={16} fill={isFav ? '#E06058' : 'none'} color={isFav ? '#E06058' : 'currentColor'} />
            </button>
          </div>
        </div>

        {copiedToast && (
          <div className="hotel-toast">
            <Check size={14} /> Link copied to clipboard!
          </div>
        )}

        {/* Secondary Quick Gallery Grid (Screenshot 1: 1 large main image + 2 stacked side images) */}
        <div className="hotel-quick-gallery">
          <div className="hotel-quick-gallery__main">
            <img 
              src={hotel.secondaryGallery?.main || hotel.image} 
              alt={`${hotel.name} main showcase`} 
              className="quick-gallery-img"
            />
          </div>
          <div className="hotel-quick-gallery__side">
            <div className="quick-gallery-top">
              <img 
                src={hotel.secondaryGallery?.top || '/images/room-deluxe.jpg'} 
                alt={`${hotel.name} room preview`} 
                className="quick-gallery-img"
              />
            </div>
            <div className="quick-gallery-bottom">
              <img 
                src={hotel.secondaryGallery?.bottom || '/images/resort-lounge.jpg'} 
                alt={`${hotel.name} dining and grounds`} 
                className="quick-gallery-img"
              />
              <Link to={`/hotels/${hotel.slug}/gallery`} className="btn-view-gallery-overlay">
                <ImageIcon size={14} />
                <span>View gallery</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Illustrative Notice Banner */}
        <div className="hotel-notice-banner">
          <p>
            <strong>Illustrative photography</strong> · All photography, room types, rates, facility presentations, and hotel descriptions are illustrative samples for Lodgekeys preview. Actual details will be supplied by hotel desks upon onboarding.
          </p>
        </div>

        {/* Main 2-Column Split: Content & Sticky Sidebar */}
        <div className="hotel-content-grid">
          {/* Left Column */}
          <div className="hotel-main-col">
            {/* About Section */}
            <section className="hotel-about-section" id="about-hotel">
              <h2 className="hotel-about-heading">
                {hotel.aboutHeadline || 'A little space to feel at home.'}
              </h2>
              <div className="hotel-about-text">
                <p>{hotel.aboutOverview || hotel.description}</p>
                <p>
                  Hospitality to show what your Lodgekeys experience could look like. Discover a pace that lets you truly disconnect while staying grounded in genuine Delta State hospitality.
                </p>
              </div>
            </section>

            {/* Rooms & Suites Preview */}
            <section className="hotel-rooms-section" id="rooms">
              <span className="eyebrow">MADE FOR SLEEP, COMFORT &amp; REST</span>
              <div className="hotel-rooms-header">
                <h2 className="section-heading">Rooms &amp; suites</h2>
                <Link to={`/hotels/${hotel.slug}/rooms`} className="rooms-view-all-link">
                  View all rooms ({hotel.rooms?.length || 3}) &rarr;
                </Link>
              </div>

              <div className="hotel-rooms-list">
                {hotel.rooms?.map((rm) => (
                  <article key={rm.id} className="hotel-room-card">
                    <div className="hotel-room-card__img-wrap">
                      <img src={rm.image} alt={rm.name} className="hotel-room-card__img" />
                    </div>
                    <div className="hotel-room-card__content">
                      <h3 className="hotel-room-card__title">{rm.name}</h3>
                      <p className="hotel-room-card__features">{rm.features}</p>
                      <p className="hotel-room-card__desc">{rm.description}</p>
                      
                      <div className="hotel-room-card__footer">
                        <div className="hotel-room-card__pricing">
                          <span className="rate-label">Rate from</span>
                          <div className="rate-val">
                            <strong>{rm.price}</strong> <span>/ night</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-primary hotel-room-card__btn"
                          onClick={() => {
                            setSelectedRoom(rm);
                            handleOpenBooking(rm);
                          }}
                        >
                          Select Room
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* The Little Extras (Amenities Grid) */}
            <section className="hotel-extras-section">
              <h2 className="section-heading" style={{ fontSize: '26px', marginBottom: '20px' }}>
                The little extras
              </h2>
              <div className="hotel-extras-grid">
                {hotel.extras && hotel.extras.length > 0 ? (
                  hotel.extras.map((extra, idx) => (
                    <div key={extra.id || idx} className="hotel-extra-item">
                      <span className="hotel-extra-icon-badge">
                        {amenityIconsMap[extra.icon?.toLowerCase()] || <Check size={15} />}
                      </span>
                      <span>{extra.title}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--color-warm-gray)', fontSize: '14px' }}>
                    Amenities are available upon request from the front desk.
                  </p>
                )}
              </div>
            </section>

            {/* Policies Section */}
            <section className="hotel-policies-section">
              <h2 className="section-heading" style={{ fontSize: '26px', marginBottom: '20px' }}>
                Before you arrive
              </h2>
              <div className="hotel-policies-grid">
                <div className="hotel-policy-card">
                  <h4>Arrival Policy</h4>
                  <p>Check-in: <strong>{hotel.policies?.checkIn || hotel.checkIn || '2:00 PM'}</strong></p>
                  <p>Check-out: <strong>{hotel.policies?.checkOut || hotel.checkOut || '11:00 AM'}</strong></p>
                  <p className="policy-note">
                    {hotel.policies?.arrivalPolicy || 'Government-issued photo ID required on arrival.'}
                  </p>
                </div>

                <div className="hotel-policy-card">
                  <h4>Cancellation Policy</h4>
                  <p>
                    {hotel.policies?.cancellationPolicy || 'Free cancellation up to 48 hours before arrival.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Location & Guest Experiences */}
            <section className="hotel-location-section">
              <h2 className="section-heading" style={{ fontSize: '26px', marginBottom: '14px' }}>
                Location &amp; guest experiences
              </h2>
              <p className="hotel-location-desc">
                Situated in <strong>{hotel.area}</strong>, Abraka, Delta State — a peaceful riverine university town
                known for the crystalline <em>River Ethiope</em> and lush tropical landscape. The property
                offers easy access to riverside recreation, campus facilities, and local eateries.
              </p>

              {/* Embedded Google Maps */}
              <div className="hotel-map-embed-wrap">
                <iframe
                  title={`Map: ${hotel.name} in Abraka`}
                  width="100%"
                  height="340"
                  style={{ border: 0, borderRadius: '14px' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${encodeURIComponent((hotel.area || 'Abraka') + ', Abraka, Delta State, Nigeria')}&zoom=14`}
                />
              </div>

              {/* Neighborhood Highlights */}
              <div className="hotel-nearby-grid">
                <div className="hotel-nearby-card">
                  <span className="nearby-emoji">🏞️</span>
                  <div>
                    <strong>River Ethiope</strong>
                    <span>2 mins walk</span>
                  </div>
                </div>
                <div className="hotel-nearby-card">
                  <span className="nearby-emoji">🎓</span>
                  <div>
                    <strong>Delta State University — Main Gate</strong>
                    <span>8 mins drive</span>
                  </div>
                </div>
                <div className="hotel-nearby-card">
                  <span className="nearby-emoji">⛽</span>
                  <div>
                    <strong>Aghalokpe Junction</strong>
                    <span>4 mins drive</span>
                  </div>
                </div>
                <div className="hotel-nearby-card">
                  <span className="nearby-emoji">🛒</span>
                  <div>
                    <strong>Abraka Main Market</strong>
                    <span>10 mins drive</span>
                  </div>
                </div>
                <div className="hotel-nearby-card">
                  <span className="nearby-emoji">🏊</span>
                  <div>
                    <strong>Ethiope River Beach &amp; Splash Zone</strong>
                    <span>3 mins walk</span>
                  </div>
                </div>
                <div className="hotel-nearby-card">
                  <span className="nearby-emoji">🚌</span>
                  <div>
                    <strong>Abraka Parkway Motor Park</strong>
                    <span>7 mins drive</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Booking Summary Sidebar */}
          <aside className="hotel-sidebar-col">
            <div className="hotel-sticky-card">
              <span className="eyebrow" style={{ color: 'var(--color-muted)' }}>STAY IN ABRAKA</span>
              <h3 className="sidebar-card-title">A room for your plans.</h3>

              <div className="sidebar-pricing">
                <span className="sidebar-price-label">Rate from</span>
                <div className="sidebar-price-row">
                  <strong className="sidebar-price">{currentRate}</strong>
                  <span className="sidebar-unit">/ night</span>
                </div>
              </div>

              {/* Dates & Guests selector preview */}
              <div className="sidebar-dates-box">
                <div className="sidebar-date-item">
                  <span className="sidebar-date-label">Arrival</span>
                  <strong>{arrival || 'Select date'}</strong>
                </div>
                <div className="sidebar-date-divider" />
                <div className="sidebar-date-item">
                  <span className="sidebar-date-label">Departure</span>
                  <strong>{departure || 'Select date'}</strong>
                </div>
              </div>

              <div className="sidebar-guests-box">
                <span className="sidebar-date-label">Guests</span>
                <strong>{guests}</strong>
              </div>

              {selectedRoom && (
                <div className="sidebar-room-selected">
                  <span>Selected:</span>
                  <strong>{selectedRoom.name}</strong>
                </div>
              )}

              <button 
                type="button" 
                className="btn btn-primary sidebar-booking-btn"
                onClick={() => handleOpenBooking(selectedRoom)}
              >
                Explore booking
                <ArrowRight size={14} />
              </button>

              <div className="sidebar-assurance">
                <ShieldCheck size={14} />
                <span>No reservation fees or upfront payment</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
