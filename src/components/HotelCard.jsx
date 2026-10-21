import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Wifi, Car, UtensilsCrossed, Waves, Sparkles, Wine, Laptop, TreePine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './HotelCard.css';

const amenityIcons = {
  wifi: <Wifi size={13} strokeWidth={1.5} />,
  parking: <Car size={13} strokeWidth={1.5} />,
  restaurant: <UtensilsCrossed size={13} strokeWidth={1.5} />,
  pool: <Waves size={13} strokeWidth={1.5} />,
  spa: <Sparkles size={13} strokeWidth={1.5} />,
  bar: <Wine size={13} strokeWidth={1.5} />,
  workspace: <Laptop size={13} strokeWidth={1.5} />,
  garden: <TreePine size={13} strokeWidth={1.5} />,
};

export default function HotelCard({ hotel }) {
  const { isFavorite, toggleFavorite } = useAuth();
  const liked = isFavorite(hotel);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(hotel.id || hotel.slug);
  };

  return (
    <article className="hotel-card">
      {/* Image */}
      <div className="hotel-card__image-wrapper">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="hotel-card__image"
          loading="lazy"
        />
        <span className="hotel-card__badge">{hotel.badge}</span>
        <button
          className={`hotel-card__fav ${liked ? 'hotel-card__fav--active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={liked ? 'Remove from saved hotels' : 'Save hotel to favorites'}
          title={liked ? 'Remove from saved hotels' : 'Save hotel to favorites'}
        >
          <Heart size={16} fill={liked ? '#E06058' : 'none'} color={liked ? '#E06058' : 'currentColor'} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="hotel-card__content">
        <div className="hotel-card__meta">
          <span className="hotel-card__location">{hotel.location}</span>
          <span className="hotel-card__category">{hotel.category}</span>
        </div>

        <h3 className="hotel-card__name">{hotel.name}</h3>
        <p className="hotel-card__description">{hotel.description}</p>

        {/* Amenities */}
        <div className="hotel-card__amenities">
          {hotel.amenities.map((amenity) => (
            <span key={amenity} className="hotel-card__amenity" title={amenity}>
              {amenityIcons[amenity] || amenity}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="hotel-card__footer">
          <div className="hotel-card__pricing">
            <span className="hotel-card__price-label">{hotel.priceLabel}</span>
            <span className="hotel-card__price">{hotel.price} <span className="hotel-card__price-unit">/ night</span></span>
          </div>
          <Link to={`/hotels/${hotel.slug}`} className="hotel-card__view-btn">
            View Hotel
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
