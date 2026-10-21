import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Hero.css';

const heroSlides = [
  {
    image: '/images/hero-resort.jpg',
    caption: 'Illustrative photography · Tropical hospitality',
  },
  {
    image: '/images/hotel-1.jpg',
    caption: 'Illustrative photography · Resort living',
  },
  {
    image: '/images/hotel-2.jpg',
    caption: 'Illustrative photography · Courtyard spaces',
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="hero" id="hero">
      {/* Background Slides */}
      <div className="hero__slides">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`hero__slide ${index === currentSlide ? 'hero__slide--active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
        <div className="hero__overlay" />
      </div>

      {/* Location Badge */}
      <div className="hero__location">
        ABRAKA, DELTA STATE
      </div>

      {/* Content */}
      <div className="hero__content container">
        <div className="hero__text">
          <p className="hero__intro">
            A LITTLE LOCAL KNOWLEDGE. A BETTER STAY.
          </p>
          <h1 className="hero__heading">
            Find your perfect<br />
            stay in <em>Abraka.</em>
          </h1>
          <p className="hero__description">
            Thoughtfully selected stays. Beautiful spaces.<br />
            Your next chapter starts right here.
          </p>
          <div className="hero__buttons">
            <Link to="/explore" className="btn btn-light hero__btn">
              Explore Hotels
              <ArrowRight size={14} />
            </Link>
            <Link to="/about" className="btn btn-ghost hero__btn">
              Discover Lodgekeys
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="hero__carousel container">
        <div className="hero__carousel-inner">
          <div className="hero__dots">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`hero__dot ${index === currentSlide ? 'hero__dot--active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="hero__arrows">
            <button className="hero__arrow" onClick={prevSlide} aria-label="Previous slide">
              <ChevronLeft size={18} />
            </button>
            <button className="hero__arrow" onClick={nextSlide} aria-label="Next slide">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <p className="hero__caption">
          {heroSlides[currentSlide].caption}
        </p>
      </div>
    </section>
  );
}
