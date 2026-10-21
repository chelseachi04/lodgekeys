import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import HotelCard from './HotelCard';
import { useHotels } from '../data/hotels';
import './HotelCollection.css';

export default function HotelCollection() {
  const hotels = useHotels();

  return (
    <section className="hotel-collection" id="hotels">
      <div className="container">
        {/* Header */}
        <div className="hotel-collection__header">
          <div className="hotel-collection__header-left">
            <span className="eyebrow">THE STAY COLLECTION</span>
            <h2 className="section-heading hotel-collection__heading">
              Some places just feel right.
            </h2>
            <p className="hotel-collection__subtitle">
              Discover a stay that matches your pace, your plans, and your people.
            </p>
          </div>
          <div className="hotel-collection__header-right">
            <Link to="/explore" className="btn btn-outline">
              Explore all hotels
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="hotel-collection__grid">
          {hotels.slice(0, 6).map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      </div>
    </section>
  );
}
