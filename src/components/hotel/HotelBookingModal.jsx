import { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import './HotelBookingModal.css';

export default function HotelBookingModal({ hotel, selectedRoom, bookingState, isOpen, onClose }) {
  const [arrival, setArrival] = useState(bookingState?.arrival || '2026-10-24');
  const [departure, setDeparture] = useState(bookingState?.departure || '2026-10-27');
  const [guests, setGuests] = useState(bookingState?.guests || '2 Guests, 1 Room');
  const [room, setRoom] = useState(selectedRoom || (hotel.rooms ? hotel.rooms[0] : null));

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedRoom) {
      setRoom(selectedRoom);
    } else if (hotel.rooms && hotel.rooms.length > 0) {
      setRoom(hotel.rooms[0]);
    }
  }, [selectedRoom, hotel]);

  useEffect(() => {
    if (bookingState?.arrival) setArrival(bookingState.arrival);
    if (bookingState?.departure) setDeparture(bookingState.departure);
    if (bookingState?.guests) setGuests(bookingState.guests);
  }, [bookingState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate nights
  const d1 = new Date(arrival);
  const d2 = new Date(departure);
  const diffTime = Math.abs(d2 - d1);
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  const roomPriceNum = room ? room.priceNumeric : hotel.priceNumeric;
  const totalAmount = nights * roomPriceNum;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!guestEmail.trim() || !/\S+@\S+\.\S+/.test(guestEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setConfirmed(true);
    }, 1100);
  };

  return (
    <div className="hotel-booking-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="hotel-booking-card" onClick={(e) => e.stopPropagation()}>
        <button className="hotel-booking-close" onClick={onClose} aria-label="Close booking">
          <X size={18} />
        </button>

        {confirmed ? (
          <div className="hotel-booking-success">
            <div className="hotel-booking-success__icon">
              <CheckCircle2 size={48} />
            </div>
            <h3>Reservation Requested!</h3>
            <p>
              Thank you, <strong>{guestName}</strong>. Your reservation request for <strong>{room ? room.name : hotel.name}</strong> at <strong>{hotel.name}</strong> from <strong>{arrival}</strong> to <strong>{departure}</strong> has been received.
            </p>
            <div className="hotel-booking-summary-box">
              <div className="summary-row">
                <span>Duration</span>
                <strong>{nights} Night{nights > 1 ? 's' : ''}</strong>
              </div>
              <div className="summary-row">
                <span>Estimated Total</span>
                <strong>₦{totalAmount.toLocaleString()}</strong>
              </div>
              <div className="summary-row">
                <span>Confirmation sent to</span>
                <span>{guestEmail}</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="hotel-booking-header">
              <span className="eyebrow">RESERVE YOUR STAY</span>
              <h2 className="hotel-booking-title">Book at {hotel.name}</h2>
              <p className="hotel-booking-sub">
                Lock in your sample reservation with direct local host confirmation.
              </p>
            </div>

            {/* Room Selector if multiple */}
            {hotel.rooms && hotel.rooms.length > 0 && (
              <div className="booking-field">
                <label className="booking-label">Selected Room / Suite</label>
                <select 
                  className="booking-select"
                  value={room ? room.id : ''}
                  onChange={(e) => {
                    const found = hotel.rooms.find(r => r.id === e.target.value);
                    if (found) setRoom(found);
                  }}
                >
                  {hotel.rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.price} / night ({r.bed})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="booking-dates-row">
              <div className="booking-field">
                <label className="booking-label">
                  <Calendar size={13} /> Arrival Date
                </label>
                <input
                  type="date"
                  className="booking-input"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                />
              </div>

              <div className="booking-field">
                <label className="booking-label">
                  <Calendar size={13} /> Departure Date
                </label>
                <input
                  type="date"
                  className="booking-input"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                />
              </div>
            </div>

            <div className="booking-field">
              <label className="booking-label">
                <User size={13} /> Guests & Rooms
              </label>
              <select 
                className="booking-select"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="1 Guest, 1 Room">1 Guest, 1 Room</option>
                <option value="2 Guests, 1 Room">2 Guests, 1 Room</option>
                <option value="3 Guests, 1 Room">3 Guests, 1 Room</option>
                <option value="4 Guests, 2 Rooms">4 Guests, 2 Rooms</option>
              </select>
            </div>

            {/* Pricing Summary Banner */}
            <div className="booking-price-banner">
              <div className="price-item">
                <span>Rate per night</span>
                <strong>{room ? room.price : hotel.price}</strong>
              </div>
              <div className="price-divider" />
              <div className="price-item">
                <span>Nights</span>
                <strong>{nights}</strong>
              </div>
              <div className="price-divider" />
              <div className="price-item total">
                <span>Total Estimated</span>
                <strong>₦{totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            {errorMsg && <div className="booking-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="booking-guest-form" noValidate>
              <div className="booking-field">
                <label className="booking-label">Guest Full Name *</label>
                <input
                  type="text"
                  className="booking-input"
                  placeholder="e.g. Osahon Williams"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div className="booking-dates-row">
                <div className="booking-field">
                  <label className="booking-label">Email Address *</label>
                  <input
                    type="email"
                    className="booking-input"
                    placeholder="osahon@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="booking-field">
                  <label className="booking-label">Phone Number</label>
                  <input
                    type="tel"
                    className="booking-input"
                    placeholder="080 1234 5678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary booking-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Confirming Reservation...' : 'Complete Reservation Preview'}
                {!isSubmitting && <ArrowRight size={14} />}
              </button>

              <div className="booking-security-note">
                <ShieldCheck size={14} />
                <span>No reservation fees or upfront charges. Pay directly at the lodge.</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
