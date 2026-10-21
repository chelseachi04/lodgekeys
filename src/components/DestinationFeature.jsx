import { ArrowRight } from 'lucide-react';
import './DestinationFeature.css';

export default function DestinationFeature() {
  return (
    <section className="destination">
      <div className="destination__inner container">
        {/* Left - Image */}
        <div className="destination__image-wrapper">
          <img
            src="/images/stay-weekend.jpg"
            alt="Tropical hotel veranda overlooking lush gardens in Abraka"
            className="destination__image"
            loading="lazy"
          />
        </div>

        {/* Right - Content */}
        <div className="destination__content">
          <span className="eyebrow">A PLACE WORTH GETTING TO KNOW</span>
          <h2 className="section-heading destination__heading">
            Abraka. A slower pace.<br />
            A warmer welcome.
          </h2>
          <p className="destination__description">
            From the energy of a university town to the calm of the Ethiope River, Abraka has a rhythm all its own. Find a place to stay, and make a little space to explore.
          </p>
          <a href="#about" className="btn btn-outline destination__btn">
            Meet Abraka
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
