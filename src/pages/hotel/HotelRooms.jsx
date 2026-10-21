import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Users, Maximize2, Bed, Eye, ArrowRight } from 'lucide-react';
import './HotelRooms.css';

export default function HotelRooms() {
  const { hotel, handleOpenBooking, setSelectedRoom } = useOutletContext();
  const [activeFilter, setActiveFilter] = useState('all');

  const rooms = hotel.rooms || [];

  const filteredRooms = rooms.filter((room) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'couples') return room.capacity?.toLowerCase().includes('2');
    if (activeFilter === 'family') return room.capacity?.toLowerCase().includes('4') || room.name.toLowerCase().includes('suite') || room.name.toLowerCase().includes('residence');
    return true;
  });

  return (
    <div className="hotel-rooms-page">
      <div className="hotel-rooms-banner">
        <div className="container">
          <Link to={`/hotels/${hotel.slug}`} className="rooms-back-link">
            <ArrowLeft size={14} /> Back to {hotel.name}
          </Link>
          <span className="eyebrow" style={{ color: 'var(--color-gold)' }}>ACCOMMODATION &amp; SUITES</span>
          <h1 className="hotel-rooms-heading">Rooms at {hotel.name}</h1>
          <p className="hotel-rooms-subheading">
            Thoughtfully planned spaces with crisp linens, tranquil acoustics, and dedicated Delta hospitality.
          </p>
        </div>
      </div>

      <div className="container hotel-rooms-content">
        {/* Filter Tabs */}
        <div className="rooms-filter-bar">
          <button
            type="button"
            className={`rooms-filter-btn ${activeFilter === 'all' ? 'rooms-filter-btn--active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Rooms ({rooms.length})
          </button>
          <button
            type="button"
            className={`rooms-filter-btn ${activeFilter === 'couples' ? 'rooms-filter-btn--active' : ''}`}
            onClick={() => setActiveFilter('couples')}
          >
            1–2 Guests
          </button>
          <button
            type="button"
            className={`rooms-filter-btn ${activeFilter === 'family' ? 'rooms-filter-btn--active' : ''}`}
            onClick={() => setActiveFilter('family')}
          >
            Suites &amp; Family
          </button>
        </div>

        {/* Rooms Detailed Grid */}
        <div className="rooms-catalog-grid">
          {filteredRooms.map((room) => (
            <article key={room.id} className="detailed-room-card">
              <div className="detailed-room-card__media">
                <img src={room.image} alt={room.name} className="detailed-room-card__img" />
                <span className="detailed-room-card__badge">{room.bed}</span>
              </div>

              <div className="detailed-room-card__body">
                <div className="detailed-room-card__top">
                  <h2 className="detailed-room-card__title">{room.name}</h2>
                  <p className="detailed-room-card__desc">{room.description}</p>
                </div>

                <div className="detailed-room-card__specs">
                  {room.size && (
                    <div className="room-spec-item">
                      <Maximize2 size={14} />
                      <span>{room.size}</span>
                    </div>
                  )}
                  {room.bed && (
                    <div className="room-spec-item">
                      <Bed size={14} />
                      <span>{room.bed}</span>
                    </div>
                  )}
                  {room.capacity && (
                    <div className="room-spec-item">
                      <Users size={14} />
                      <span>{room.capacity}</span>
                    </div>
                  )}
                  {room.view && (
                    <div className="room-spec-item">
                      <Eye size={14} />
                      <span>{room.view}</span>
                    </div>
                  )}
                </div>

                <div className="detailed-room-card__features-chips">
                  {room.features?.split('·').map((feat, idx) => (
                    <span key={idx} className="room-feat-chip">
                      <Check size={12} /> {feat.trim()}
                    </span>
                  ))}
                </div>

                <div className="detailed-room-card__footer">
                  <div className="detailed-room-card__pricing">
                    <span className="detailed-rate-label">Nightly rate</span>
                    <div className="detailed-rate-val">
                      <strong>{room.price}</strong>
                      <span> / night</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary detailed-reserve-btn"
                    onClick={() => {
                      setSelectedRoom(room);
                      handleOpenBooking(room);
                    }}
                  >
                    Select &amp; Reserve
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Booking Guarantee */}
        <div className="rooms-guarantee-box">
          <div className="rooms-guarantee-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h4>Direct Desk Reservation</h4>
            <p>
              When you submit a reservation through Lodgekeys, your room request is placed on hold directly with {hotel.name}’s desk. No upfront booking fees are charged online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
