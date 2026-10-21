import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import HotelApplicationModal from './HotelApplicationModal';
import './HotelOwnerCTA.css';

export default function HotelOwnerCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="owner-cta" id="list">
        <div className="owner-cta__inner container">
          <div className="owner-cta__content">
            <span className="owner-cta__eyebrow">FOR THE PEOPLE BEHIND THE WELCOME</span>
            <h2 className="owner-cta__heading">
              Your hotel. Our next great stay.
            </h2>
            <p className="owner-cta__description">
              Let's introduce your property to people who will love it.
            </p>
          </div>
          <div className="owner-cta__action">
            <button
              type="button"
              className="btn btn-gold owner-cta__btn"
              onClick={() => setIsModalOpen(true)}
              id="btn-list-your-hotel"
            >
              List Your Hotel
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <HotelApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
