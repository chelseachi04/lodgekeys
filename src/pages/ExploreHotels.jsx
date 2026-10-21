import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Calendar, SlidersHorizontal, Star, 
  ArrowRight, X, Wifi, Car, UtensilsCrossed, Waves, 
  Sparkles, Wine, Laptop, TreePine, Heart, Check, Clock, ShieldCheck,
  Dumbbell, Zap, Coffee, Shield
} from 'lucide-react';
import { sampleHotels, useHotels } from '../data/hotels';
import { useAuth } from '../context/AuthContext';
import './ExploreHotels.css';

const amenityIcons = {
  wifi: <Wifi size={13} strokeWidth={1.5} />,
  parking: <Car size={13} strokeWidth={1.5} />,
  restaurant: <UtensilsCrossed size={13} strokeWidth={1.5} />,
  pool: <Waves size={13} strokeWidth={1.5} />,
  spa: <Sparkles size={13} strokeWidth={1.5} />,
  bar: <Wine size={13} strokeWidth={1.5} />,
  workspace: <Laptop size={13} strokeWidth={1.5} />,
  garden: <TreePine size={13} strokeWidth={1.5} />,
  gym: <Dumbbell size={13} strokeWidth={1.5} />,
  dumbbell: <Dumbbell size={13} strokeWidth={1.5} />,
  solar: <Zap size={13} strokeWidth={1.5} />,
  zap: <Zap size={13} strokeWidth={1.5} />,
  coffee: <Coffee size={13} strokeWidth={1.5} />,
  shuttle: <Car size={13} strokeWidth={1.5} />,
  security: <Shield size={13} strokeWidth={1.5} />,
  shield: <Shield size={13} strokeWidth={1.5} />,
  star: <Star size={13} strokeWidth={1.5} />,
};

const amenityLabels = {
  wifi: 'High-speed Wi-Fi',
  parking: 'Free Parking',
  restaurant: 'Dining & Cafe',
  pool: 'Outdoor Pool',
  spa: 'Wellness Spa',
  bar: 'Lounge Bar',
  workspace: 'Work Desk',
  garden: 'Landscaped Garden',
};

const categories = ['All', 'Resort', 'Luxury', 'Business', 'Boutique'];
const locations = ['All Areas', 'Riverfront', 'Town Centre', 'Campus Area', 'Delta Green'];
const priceOptions = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₦30,000', value: 'under30' },
  { label: '₦30,000 – ₦45,000', value: '30to45' },
  { label: 'Above ₦45,000', value: 'above45' },
  { label: 'Custom Range', value: 'custom' },
];

export default function ExploreHotels() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [dates, setDates] = useState({ checkIn: '2026-10-20', checkOut: '2026-10-23' });
  const [guests, setGuests] = useState('2 Guests, 1 Room');
  
  const { isFavorite, toggleFavorite } = useAuth();

  // UI states
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showPriceSlider, setShowPriceSlider] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Live reactive hotels list from hotel registry
  const hotelsList = useHotels();

  // Dynamically extract all available amenities across the catalog (default + manager-added custom)
  const allAvailableAmenities = useMemo(() => {
    const map = new Map();
    // Default baseline amenities with curated labels and icons
    const baseline = [
      { id: 'wifi', name: 'High-speed Wi-Fi', icon: 'wifi' },
      { id: 'pool', name: 'Swimming Pool', icon: 'pool' },
      { id: 'restaurant', name: 'Dining & Cafe', icon: 'restaurant' },
      { id: 'parking', name: 'Free Parking', icon: 'parking' },
      { id: 'garden', name: 'Riverfront Garden', icon: 'garden' },
      { id: 'spa', name: 'Wellness Spa', icon: 'spa' },
      { id: 'workspace', name: 'Work Desk', icon: 'workspace' },
      { id: 'bar', name: 'Lounge Bar', icon: 'bar' },
      { id: 'zap', name: '24/7 Power / Solar', icon: 'zap' },
      { id: 'gym', name: 'Fitness Gym', icon: 'gym' },
    ];
    baseline.forEach(b => map.set(b.id.toLowerCase(), b));

    // Discover manager-added custom amenities or property extras
    hotelsList.forEach(hotel => {
      if (Array.isArray(hotel.extras)) {
        hotel.extras.forEach(extra => {
          const key = (extra.id || extra.icon || '').toLowerCase();
          if (key && !map.has(key)) {
            map.set(key, {
              id: key,
              name: extra.title || key.charAt(0).toUpperCase() + key.slice(1),
              icon: extra.icon || 'star',
            });
          }
        });
      }
      if (Array.isArray(hotel.amenities)) {
        hotel.amenities.forEach(a => {
          const key = String(a).toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              name: amenityLabels[key] || (key.charAt(0).toUpperCase() + key.slice(1)),
              icon: key,
            });
          }
        });
      }
    });

    return Array.from(map.values());
  }, [hotelsList]);

  // Sync state from URL query parameters (e.g. from homepage experience cards)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const featuresParam = searchParams.get('features') || searchParams.get('amenities') || searchParams.get('amenity');
    const tierParam = searchParams.get('tier');
    const minRatingParam = searchParams.get('minRating');
    const locationParam = searchParams.get('location') || searchParams.get('area');
    const qParam = searchParams.get('q') || searchParams.get('search');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const priceParam = searchParams.get('price');

    if (categoryParam) {
      const matched = categories.find(c => c.toLowerCase() === categoryParam.toLowerCase());
      if (matched) setSelectedCategory(matched);
    } else if (tierParam && tierParam.toLowerCase() === 'luxury') {
      setSelectedCategory('Luxury');
    }

    if (featuresParam) {
      const feats = featuresParam.split(',').map(f => f.trim().toLowerCase()).filter(Boolean);
      setSelectedAmenities(feats);
    }

    if (tierParam) {
      if (tierParam.toLowerCase() === 'budget-friendly' || tierParam.toLowerCase() === 'budget') {
        setSelectedPrice('under30');
        setMinPrice(0);
        setMaxPrice(30000);
      }
    }

    if (priceParam) {
      setSelectedPrice(priceParam);
      if (priceParam === 'under30') { setMinPrice(0); setMaxPrice(30000); }
      else if (priceParam === '30to45') { setMinPrice(30000); setMaxPrice(45000); }
      else if (priceParam === 'above45') { setMinPrice(45000); setMaxPrice(150000); }
    }

    if (minPriceParam) {
      const parsed = parseInt(minPriceParam, 10);
      if (!isNaN(parsed)) setMinPrice(parsed);
    }

    if (maxPriceParam) {
      const parsed = parseInt(maxPriceParam, 10);
      if (!isNaN(parsed)) setMaxPrice(parsed);
    }

    if (minRatingParam) {
      const parsed = parseFloat(minRatingParam);
      if (!isNaN(parsed)) {
        setMinRating(parsed);
      }
    }

    if (locationParam) {
      const matchedLoc = locations.find(l => l.toLowerCase() === locationParam.toLowerCase());
      if (matchedLoc) setSelectedLocation(matchedLoc);
      else setSelectedLocation(locationParam);
    }

    if (qParam) {
      setSearchQuery(qParam);
    }

    if (searchParams.get('focus') === 'search') {
      setTimeout(() => {
        const input = document.getElementById('explore-search-input');
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [searchParams]);

  // Toggle favorite
  const toggleFav = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  // Toggle amenity filter
  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
    setCurrentPage(1);
  };

  // Dynamic filter & sort logic
  const filteredHotels = useMemo(() => {
    return hotelsList.filter(hotel => {
      // 1. Text Search Query: Matches Name, Location, Description, or Amenities
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = hotel.name?.toLowerCase().includes(query);
        const matchesLoc = hotel.location?.toLowerCase().includes(query);
        const matchesArea = hotel.area?.toLowerCase().includes(query);
        const matchesAddress = hotel.address?.toLowerCase().includes(query);
        const matchesDesc = hotel.description?.toLowerCase().includes(query);
        const matchesTagline = hotel.tagline?.toLowerCase().includes(query);
        if (!matchesName && !matchesLoc && !matchesArea && !matchesAddress && !matchesDesc && !matchesTagline) return false;
      }

      // 2. Location / Area District Filter (e.g. "Riverfront", "Town Centre", "Campus Area")
      if (selectedLocation !== 'All Areas') {
        const loc = selectedLocation.toLowerCase();
        const matchesArea = hotel.area && hotel.area.toLowerCase() === loc;
        const matchesLocation = hotel.location && hotel.location.toLowerCase().includes(loc);
        const matchesAddress = hotel.address && hotel.address.toLowerCase().includes(loc);
        if (!matchesArea && !matchesLocation && !matchesAddress) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'All' && hotel.category !== selectedCategory) {
        return false;
      }

      // 4. Price Range Selectors & Min/Max Sliders
      if (selectedPrice === 'under30' && hotel.priceNumeric >= 30000) return false;
      if (selectedPrice === '30to45' && (hotel.priceNumeric < 30000 || hotel.priceNumeric > 45000)) return false;
      if (selectedPrice === 'above45' && hotel.priceNumeric <= 45000) return false;
      if (minPrice > 0 && hotel.priceNumeric < minPrice) return false;
      if (maxPrice < 150000 && hotel.priceNumeric > maxPrice) return false;

      // 5. Amenity Checkbox / Pill Toggles (reads default & manager custom amenities)
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every(a => {
          const target = a.toLowerCase();
          const inAmenities = Array.isArray(hotel.amenities) && hotel.amenities.some(ha => String(ha).toLowerCase() === target);
          const inExtras = Array.isArray(hotel.extras) && hotel.extras.some(ext =>
            (ext.id && String(ext.id).toLowerCase() === target) ||
            (ext.icon && String(ext.icon).toLowerCase() === target) ||
            (ext.title && ext.title.toLowerCase().includes(target))
          );
          return inAmenities || inExtras;
        });
        if (!hasAllAmenities) return false;
      }

      // 6. Minimum Star Rating
      if (minRating > 0 && hotel.rating < minRating) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.priceNumeric - b.priceNumeric;
      if (sortBy === 'price-high') return b.priceNumeric - a.priceNumeric;
      return a.id - b.id; // recommended default
    });
  }, [hotelsList, searchQuery, selectedLocation, selectedCategory, selectedPrice, minPrice, maxPrice, selectedAmenities, minRating, sortBy]);

  // Paginated items
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage) || 1;
  const paginatedHotels = filteredHotels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All Areas');
    setSelectedCategory('All');
    setSelectedPrice('all');
    setMinPrice(0);
    setMaxPrice(150000);
    setSelectedAmenities([]);
    setMinRating(0);
    setSortBy('recommended');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleSimulateFilterChange = (setter, value) => {
    setIsLoading(true);
    setter(value);
    setCurrentPage(1);
    setTimeout(() => setIsLoading(false), 240);
  };

  return (
    <div className="explore-page">
      {/* Top Banner */}
      <section className="explore-hero">
        <div className="container">
          <div className="explore-hero__inner">
            <span className="eyebrow">ABRAKA STAYS DIRECTORY</span>
            <h1 className="explore-hero__title">
              Find your next stay in <em>Abraka.</em>
            </h1>
            <p className="explore-hero__subtitle">
              Verified riverfront lodges, tranquil boutique spaces, and executive hotel residences for business or holiday.
            </p>
          </div>
        </div>
      </section>

      {/* Main Filter & Search Console */}
      <section className="explore-controls container">
        <div className="explore-search-card">
          <div className="explore-search-grid">
            {/* Search Input */}
            <div className="explore-field">
              <span className="explore-field__label">
                <Search size={14} /> Search keyword
              </span>
              <input
                id="explore-search-input"
                type="text"
                className="explore-input"
                placeholder="Hotel name, amenities, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Location / Area District Filter */}
            <div className="explore-field">
              <span className="explore-field__label">
                <MapPin size={14} /> Destination
              </span>
              <select
                id="explore-location-select"
                className="explore-select"
                value={selectedLocation}
                onChange={(e) => handleSimulateFilterChange(setSelectedLocation, e.target.value)}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Dates / Guests */}
            <div 
              className="explore-field explore-field--clickable"
              onClick={() => setShowDatesModal(true)}
            >
              <span className="explore-field__label">
                <Calendar size={14} /> Stay Dates &amp; Guests
              </span>
              <div className="explore-field__display">
                <span>{dates.checkIn} → {dates.checkOut}</span>
                <span className="explore-field__hint">{guests}</span>
              </div>
            </div>

            {/* Price Filter Preset & Custom Trigger */}
            <div className="explore-field">
              <span className="explore-field__label">
                Price Range
              </span>
              <select
                id="explore-price-select"
                className="explore-select"
                value={selectedPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPrice(val);
                  if (val === 'under30') { setMinPrice(0); setMaxPrice(30000); }
                  else if (val === '30to45') { setMinPrice(30000); setMaxPrice(45000); }
                  else if (val === 'above45') { setMinPrice(45000); setMaxPrice(150000); }
                  else if (val === 'all') { setMinPrice(0); setMaxPrice(150000); }
                  else if (val === 'custom') { setShowPriceSlider(true); }
                  setCurrentPage(1);
                }}
              >
                {priceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Price Range Slider row (when custom or price filter active) */}
          {(selectedPrice === 'custom' || showPriceSlider || maxPrice < 150000 || minPrice > 0) && (
            <div className="explore-price-slider-box">
              <div className="explore-price-slider-header">
                <span className="slider-label">Nightly Rate Range:</span>
                <strong className="slider-value">₦{minPrice.toLocaleString()} – ₦{maxPrice >= 150000 ? '150,000+' : maxPrice.toLocaleString()}/night</strong>
                <button
                  type="button"
                  className="slider-close-btn"
                  onClick={() => { setSelectedPrice('all'); setMinPrice(0); setMaxPrice(150000); setShowPriceSlider(false); }}
                >
                  Reset Price
                </button>
              </div>
              <div className="explore-price-slider-range-wrap">
                <input
                  type="range"
                  min="20000"
                  max="150000"
                  step="5000"
                  value={maxPrice}
                  onChange={e => {
                    setMaxPrice(parseInt(e.target.value, 10));
                    setSelectedPrice('custom');
                    setCurrentPage(1);
                  }}
                  className="explore-price-range-slider"
                  id="explore-price-slider"
                />
                <div className="explore-price-slider-ticks">
                  <span>₦20,000</span>
                  <span>₦60,000</span>
                  <span>₦100,000</span>
                  <span>₦150,000+</span>
                </div>
              </div>
            </div>
          )}

          {/* Categories & Secondary Filters Row */}
          <div className="explore-subcontrols">
            {/* Category pills */}
            <div className="explore-categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`explore-pill ${selectedCategory === cat ? 'explore-pill--active' : ''}`}
                  onClick={() => handleSimulateFilterChange(setSelectedCategory, cat)}
                >
                  {cat === 'All' ? 'All Styles' : cat}
                </button>
              ))}
            </div>

            {/* Amenities trigger & Sorting */}
            <div className="explore-actions">
              <button 
                className={`btn-filter-toggle ${selectedAmenities.length > 0 ? 'btn-filter-toggle--active' : ''}`}
                onClick={() => setShowFiltersModal(!showFiltersModal)}
                id="btn-toggle-amenities-tray"
              >
                <SlidersHorizontal size={14} />
                Amenities {selectedAmenities.length > 0 && `(${selectedAmenities.length})`}
              </button>

              <button
                type="button"
                className={`btn-filter-toggle ${selectedPrice === 'custom' || showPriceSlider ? 'btn-filter-toggle--active' : ''}`}
                onClick={() => setShowPriceSlider(!showPriceSlider)}
                id="btn-toggle-price-slider"
              >
                Price Slider
              </button>

              <div className="explore-sort">
                <span className="explore-sort__label">Sort:</span>
                <select 
                  className="explore-sort__select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Top Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Amenities Collapsible Tray (Dynamic amenities from active properties) */}
          {showFiltersModal && (
            <div className="explore-amenities-tray">
              <div className="explore-amenities-tray__header">
                <h4>Filter by Amenities &amp; Services ({allAvailableAmenities.length} features available)</h4>
                <button 
                  className="explore-tray-close" 
                  onClick={() => setShowFiltersModal(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="explore-amenities-list">
                {allAvailableAmenities.map(amenity => {
                  const isChecked = selectedAmenities.includes(amenity.id);
                  const IconComp = amenityIcons[amenity.icon] || amenityIcons[amenity.id] || <Sparkles size={13} strokeWidth={1.5} />;
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      className={`explore-amenity-chip ${isChecked ? 'explore-amenity-chip--active' : ''}`}
                      onClick={() => toggleAmenity(amenity.id)}
                      id={`amenity-chip-${amenity.id}`}
                    >
                      <span className="explore-amenity-chip__icon">{IconComp}</span>
                      <span>{amenity.name}</span>
                      {isChecked && <Check size={13} className="explore-amenity-chip__check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active filter summary tag bar */}
          {(selectedLocation !== 'All Areas' || selectedCategory !== 'All' || selectedPrice !== 'all' || minPrice > 0 || maxPrice < 150000 || selectedAmenities.length > 0 || searchQuery || minRating > 0) && (
            <div className="explore-active-tags">
              <span className="explore-active-tags__title">Active filters:</span>
              {selectedLocation !== 'All Areas' && (
                <span className="active-tag" onClick={() => setSelectedLocation('All Areas')}>
                  Location: {selectedLocation} <X size={12} />
                </span>
              )}
              {selectedCategory !== 'All' && (
                <span className="active-tag" onClick={() => setSelectedCategory('All')}>
                  Category: {selectedCategory} <X size={12} />
                </span>
              )}
              {(selectedPrice !== 'all' || minPrice > 0 || maxPrice < 150000) && (
                <span className="active-tag" onClick={() => { setSelectedPrice('all'); setMinPrice(0); setMaxPrice(150000); }}>
                  Price: {selectedPrice === 'custom' || maxPrice < 150000 ? `Up to ₦${maxPrice.toLocaleString()}` : priceOptions.find(p => p.value === selectedPrice)?.label} <X size={12} />
                </span>
              )}
              {selectedAmenities.map(a => {
                const found = allAvailableAmenities.find(item => item.id === a);
                return (
                  <span key={a} className="active-tag" onClick={() => toggleAmenity(a)}>
                    {found?.name || a} <X size={12} />
                  </span>
                );
              })}
              {minRating > 0 && (
                <span className="active-tag" onClick={() => setMinRating(0)}>
                  Min Rating: {minRating}★ <X size={12} />
                </span>
              )}
              {searchQuery && (
                <span className="active-tag" onClick={() => setSearchQuery('')}>
                  Keyword: "{searchQuery}" <X size={12} />
                </span>
              )}
              <button className="active-tag-reset" onClick={resetFilters} id="btn-clear-active-tags">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results Header */}
      <section className="explore-results container">
        <div className="explore-results__header">
          <p className="explore-results__count">
            Showing <strong>{filteredHotels.length}</strong> available {filteredHotels.length === 1 ? 'property' : 'properties'} in Abraka
          </p>
          <div className="explore-results__info">
            <span className="badge-local">Abraka, Delta State</span>
          </div>
        </div>

        {/* Hotels Grid or Skeleton */}
        {isLoading ? (
          <div className="explore-grid">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="explore-skeleton-card">
                <div className="skeleton skeleton--image" />
                <div className="explore-skeleton-content">
                  <div className="skeleton skeleton--badge" />
                  <div className="skeleton skeleton--title" />
                  <div className="skeleton skeleton--text" />
                  <div className="skeleton skeleton--text-sm" />
                  <div className="skeleton skeleton--footer" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="explore-empty">
            <div className="explore-empty__icon">
              <Search size={32} />
            </div>
            <h3>No stays match your criteria</h3>
            <p>Try clearing your amenities or expanding your price and location filters.</p>
            <button className="btn btn-primary" onClick={resetFilters} id="btn-reset-explore-filters">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="explore-grid">
            {paginatedHotels.map(hotel => {
              const isFav = isFavorite(hotel);
              return (
                <article 
                  key={hotel.id} 
                  className="explore-card"
                  onClick={() => navigate(`/hotels/${hotel.slug}`)}
                >
                  <div className="explore-card__image-container">
                    <img 
                      src={hotel.image} 
                      alt={hotel.name} 
                      className="explore-card__image" 
                      loading="lazy" 
                    />
                    <div className="explore-card__badges">
                      <span className="explore-card__badge">{hotel.badge}</span>
                      <span className="explore-card__cat-badge">{hotel.category}</span>
                    </div>
                    <button 
                      className={`explore-card__fav ${isFav ? 'explore-card__fav--active' : ''}`}
                      onClick={(e) => toggleFav(hotel.id, e)}
                      aria-label={isFav ? 'Remove from saved hotels' : 'Save hotel to favorites'}
                      title={isFav ? 'Remove from saved hotels' : 'Save hotel to favorites'}
                    >
                      <Heart size={16} fill={isFav ? '#E06058' : 'none'} color={isFav ? '#E06058' : 'currentColor'} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="explore-card__body">
                    <div className="explore-card__top">
                      <span className="explore-card__location">
                        <MapPin size={12} /> {hotel.location}
                      </span>
                      <div className="explore-card__rating">
                        <Star size={13} fill="#B8A46A" color="#B8A46A" />
                        <span>{hotel.rating}</span>
                        <span className="explore-card__reviews">({hotel.reviewsCount})</span>
                      </div>
                    </div>

                    <h3 className="explore-card__title">{hotel.name}</h3>
                    <p className="explore-card__desc">{hotel.description}</p>

                    <div className="explore-card__amenities">
                      {hotel.amenities.slice(0, 4).map(amenity => (
                        <span key={amenity} className="explore-card__amenity-tag" title={amenityLabels[amenity] || amenity}>
                          {amenityIcons[amenity] || <Sparkles size={13} strokeWidth={1.5} />} {amenityLabels[amenity] || amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="explore-card__amenity-more">
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="explore-card__footer">
                      <div className="explore-card__pricing">
                        <span className="explore-card__price-label">{hotel.priceLabel}</span>
                        <div className="explore-card__price-row">
                          <strong className="explore-card__price">{hotel.price}</strong>
                          <span className="explore-card__unit">/ night</span>
                        </div>
                      </div>

                      <Link 
                        to={`/hotels/${hotel.slug}`}
                        className="btn-view-details"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Hotel
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="explore-pagination">
            <button
              className="pagination-btn pagination-btn--prev"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
            >
              Previous
            </button>
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-num ${currentPage === page ? 'pagination-num--active' : ''}`}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="pagination-btn pagination-btn--next"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 380, behavior: 'smooth' });
              }}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Hotel Detail Quick-View Modal */}
      {selectedHotel && (
        <div className="hotel-modal-overlay" onClick={() => setSelectedHotel(null)}>
          <div className="hotel-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="hotel-modal__close"
              onClick={() => setSelectedHotel(null)}
              aria-label="Close details"
            >
              <X size={18} />
            </button>

            <div className="hotel-modal__gallery">
              <img src={selectedHotel.image} alt={selectedHotel.name} className="hotel-modal__hero-image" />
              <div className="hotel-modal__badge-row">
                <span className="hotel-modal__badge">{selectedHotel.badge}</span>
                <span className="hotel-modal__badge-category">{selectedHotel.category}</span>
              </div>
            </div>

            <div className="hotel-modal__content">
              <div className="hotel-modal__header">
                <div>
                  <div className="hotel-modal__meta">
                    <span className="hotel-modal__location">
                      <MapPin size={14} /> {selectedHotel.location}
                    </span>
                    <span className="hotel-modal__dot">·</span>
                    <div className="hotel-modal__rating">
                      <Star size={14} fill="#B8A46A" color="#B8A46A" />
                      <strong>{selectedHotel.rating}</strong>
                      <span>({selectedHotel.reviewsCount} verified reviews)</span>
                    </div>
                  </div>
                  <h2 className="hotel-modal__title">{selectedHotel.name}</h2>
                </div>

                <div className="hotel-modal__price-box">
                  <span className="hotel-modal__price-label">{selectedHotel.priceLabel}</span>
                  <div className="hotel-modal__price">{selectedHotel.price}</div>
                  <span className="hotel-modal__per-night">per night (taxes included)</span>
                </div>
              </div>

              <p className="hotel-modal__desc">{selectedHotel.description}</p>

              <div className="hotel-modal__amenities-section">
                <h4 className="hotel-modal__section-title">Included Amenities</h4>
                <div className="hotel-modal__amenities-grid">
                  {selectedHotel.amenities.map(amenity => (
                    <div key={amenity} className="hotel-modal__amenity-item">
                      <span className="hotel-modal__amenity-icon">{amenityIcons[amenity]}</span>
                      <span>{amenityLabels[amenity] || amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hotel-modal__policies">
                <div className="hotel-modal__policy-item">
                  <Clock size={16} />
                  <div>
                    <strong>Check-in / Check-out</strong>
                    <p>Check-in from {selectedHotel.checkIn} · Check-out until {selectedHotel.checkOut}</p>
                  </div>
                </div>
                <div className="hotel-modal__policy-item">
                  <ShieldCheck size={16} />
                  <div>
                    <strong>Lodgekeys Local Guarantee</strong>
                    <p>Verified photography, direct local front-desk contact, no hidden platform surcharges.</p>
                  </div>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="hotel-modal__success">
                  <Check size={20} />
                  <span>Reservation inquiry initiated! Our local concierge has forwarded details to {selectedHotel.name}.</span>
                </div>
              ) : (
                <div className="hotel-modal__actions">
                  <button 
                    className="btn btn-primary hotel-modal__book-btn"
                    onClick={() => {
                      setBookingSuccess(true);
                      setTimeout(() => setBookingSuccess(false), 4500);
                    }}
                  >
                    Reserve This Stay
                    <ArrowRight size={14} />
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setSelectedHotel(null)}
                  >
                    Continue Browsing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dates Modal */}
      {showDatesModal && (
        <div className="dates-modal-overlay" onClick={() => setShowDatesModal(false)}>
          <div className="dates-modal" onClick={e => e.stopPropagation()}>
            <div className="dates-modal__header">
              <h3>Select Stay Dates & Guests</h3>
              <button onClick={() => setShowDatesModal(false)}><X size={16} /></button>
            </div>
            <div className="dates-modal__body">
              <div className="dates-input-row">
                <label>
                  <span>Check-In Date</span>
                  <input 
                    type="date" 
                    value={dates.checkIn}
                    onChange={(e) => setDates(prev => ({ ...prev, checkIn: e.target.value }))}
                  />
                </label>
                <label>
                  <span>Check-Out Date</span>
                  <input 
                    type="date" 
                    value={dates.checkOut}
                    onChange={(e) => setDates(prev => ({ ...prev, checkOut: e.target.value }))}
                  />
                </label>
              </div>

              <div className="dates-guests-row">
                <label>
                  <span>Guests & Rooms</span>
                  <select 
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    <option value="1 Guest, 1 Room">1 Guest, 1 Room</option>
                    <option value="2 Guests, 1 Room">2 Guests, 1 Room</option>
                    <option value="3 Guests, 2 Rooms">3 Guests, 2 Rooms</option>
                    <option value="4+ Guests, Family Suite">4+ Guests, Family Suite</option>
                  </select>
                </label>
              </div>

              <button 
                className="btn btn-primary dates-modal__save"
                onClick={() => setShowDatesModal(false)}
              >
                Apply Stay Dates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
