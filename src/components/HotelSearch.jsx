import { useState, useRef, useEffect } from 'react';
import { MapPin, SlidersHorizontal, Navigation, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HotelSearch.css';

const locations = ['Abraka, Delta State', 'Ethiope East', 'Abraka Campus Area', 'Abraka Riverfront'];
const hotelStyles = ['All hotel styles', 'Resort', 'Luxury', 'Business', 'Budget-friendly'];

export default function HotelSearch() {
  const [locationOpen, setLocationOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [selectedStyle, setSelectedStyle] = useState(hotelStyles[0]);
  const [searchFeedback, setSearchFeedback] = useState('');
  const locationRef = useRef(null);
  const styleRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (styleRef.current && !styleRef.current.contains(e.target)) {
        setStyleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    navigate('/explore');
  };

  return (
    <div className="search-panel-wrapper container">
      <div className="search-panel">
        {/* Location */}
        <div className="search-panel__field" ref={locationRef}>
          <div
            className="search-panel__trigger"
            onClick={() => { setLocationOpen(!locationOpen); setStyleOpen(false); }}
            role="button"
            tabIndex={0}
            aria-expanded={locationOpen}
            onKeyDown={(e) => e.key === 'Enter' && setLocationOpen(!locationOpen)}
          >
            <MapPin size={16} className="search-panel__icon" />
            <div className="search-panel__text">
              <span className="search-panel__label">Where would you like to stay?</span>
              <span className="search-panel__value">{selectedLocation}</span>
            </div>
            <ChevronDown size={14} className={`search-panel__chevron ${locationOpen ? 'search-panel__chevron--open' : ''}`} />
          </div>
          {locationOpen && (
            <div className="search-panel__dropdown">
              {locations.map((loc) => (
                <button
                  key={loc}
                  className={`search-panel__option ${loc === selectedLocation ? 'search-panel__option--active' : ''}`}
                  onClick={() => { setSelectedLocation(loc); setLocationOpen(false); }}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="search-panel__divider" />

        {/* Hotel Style */}
        <div className="search-panel__field" ref={styleRef}>
          <div
            className="search-panel__trigger"
            onClick={() => { setStyleOpen(!styleOpen); setLocationOpen(false); }}
            role="button"
            tabIndex={0}
            aria-expanded={styleOpen}
            onKeyDown={(e) => e.key === 'Enter' && setStyleOpen(!styleOpen)}
          >
            <SlidersHorizontal size={16} className="search-panel__icon" />
            <div className="search-panel__text">
              <span className="search-panel__label">Your kind of stay</span>
              <span className="search-panel__value">{selectedStyle}</span>
            </div>
            <ChevronDown size={14} className={`search-panel__chevron ${styleOpen ? 'search-panel__chevron--open' : ''}`} />
          </div>
          {styleOpen && (
            <div className="search-panel__dropdown">
              {hotelStyles.map((style) => (
                <button
                  key={style}
                  className={`search-panel__option ${style === selectedStyle ? 'search-panel__option--active' : ''}`}
                  onClick={() => { setSelectedStyle(style); setStyleOpen(false); }}
                >
                  {style}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="search-panel__divider" />

        {/* Nearby */}
        <div className="search-panel__field search-panel__field--nearby">
          <div className="search-panel__trigger search-panel__trigger--static">
            <Navigation size={16} className="search-panel__icon" />
            <div className="search-panel__text">
              <span className="search-panel__label">Discover</span>
              <span className="search-panel__value">Nearby hotels</span>
            </div>
          </div>
        </div>

        <div className="search-panel__divider search-panel__divider--mobile-hide" />

        {/* Search Button */}
        <button className="search-panel__search-btn" onClick={handleSearch}>
          <Search size={18} />
          <span>Search Hotels</span>
        </button>
      </div>

      {/* Feedback */}
      {searchFeedback && (
        <div className="search-panel__feedback">
          {searchFeedback}
        </div>
      )}
    </div>
  );
}
