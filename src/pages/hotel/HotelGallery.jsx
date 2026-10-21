import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import './HotelGallery.css';

export default function HotelGallery() {
  const { hotel } = useOutletContext();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const images = hotel.galleryImages || [
    { id: 1, url: hotel.image, caption: `${hotel.name} exterior`, category: 'Grounds & Pool' },
  ];

  const categories = ['All', ...new Set(images.map((img) => img.category).filter(Boolean))];

  const filteredImages = selectedCategory === 'All'
    ? images
    : images.filter((img) => img.category === selectedCategory);

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const showNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredImages.length);
    }
  };

  const showPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredImages]);

  return (
    <div className="hotel-gallery-page">
      <div className="hotel-gallery-banner">
        <div className="container">
          <Link to={`/hotels/${hotel.slug}`} className="gallery-back-link">
            <ArrowLeft size={14} /> Back to {hotel.name}
          </Link>
          <span className="eyebrow" style={{ color: 'var(--color-gold)' }}>VISUAL ARCHIVE</span>
          <h1 className="hotel-gallery-heading">{hotel.name} Gallery</h1>
          <p className="hotel-gallery-subheading">
            An intimate photographic look inside suites, riverfront decks, tropical courtyards, and social lounges.
          </p>
        </div>
      </div>

      <div className="container hotel-gallery-content">
        {/* Category Tabs */}
        <div className="gallery-tabs-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`gallery-tab-btn ${selectedCategory === cat ? 'gallery-tab-btn--active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry / Responsive Grid */}
        <div className="gallery-grid">
          {filteredImages.map((img, idx) => (
            <div
              key={img.id || idx}
              className="gallery-item"
              onClick={() => openLightbox(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openLightbox(idx)}
              aria-label={`View photo: ${img.caption}`}
            >
              <img src={img.url} alt={img.caption} className="gallery-item__img" loading="lazy" />
              <div className="gallery-item__overlay">
                <span className="gallery-item__category">{img.category}</span>
                <p className="gallery-item__caption">{img.caption}</p>
                <span className="gallery-item__view-icon">
                  <Eye size={16} /> Expand
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredImages[lightboxIndex] && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={closeLightbox}
              aria-label="Close photo preview"
            >
              <X size={22} />
            </button>

            <button
              type="button"
              className="lightbox-nav-btn lightbox-nav-btn--prev"
              onClick={showPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={28} />
            </button>

            <div className="lightbox-content">
              <img
                src={filteredImages[lightboxIndex].url}
                alt={filteredImages[lightboxIndex].caption}
                className="lightbox-main-img"
              />
              <div className="lightbox-footer">
                <span className="lightbox-caption">
                  {filteredImages[lightboxIndex].caption}
                </span>
                <span className="lightbox-counter">
                  {lightboxIndex + 1} / {filteredImages.length}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="lightbox-nav-btn lightbox-nav-btn--next"
              onClick={showNext}
              aria-label="Next photo"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
