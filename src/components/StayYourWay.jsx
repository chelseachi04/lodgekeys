import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { stayCategories } from '../data/hotels';
import './StayYourWay.css';

export default function StayYourWay() {
  return (
    <section className="stay-way">
      <div className="container">
        <div className="stay-way__header">
          <span className="eyebrow">STAY YOUR WAY</span>
          <h2 className="section-heading">What brings you to Abraka?</h2>
        </div>

        <div className="stay-way__grid">
          {stayCategories.map((item) => (
            <Link key={item.id} to={item.href} className="stay-way__tile" aria-label={`Explore ${item.title} ${item.subtitle}`}>
              <img
                src={item.image}
                alt={`${item.title} ${item.subtitle}`}
                className="stay-way__tile-image"
                loading="lazy"
              />
              <div className="stay-way__tile-overlay" />
              <div className="stay-way__tile-content">
                <div className="stay-way__tile-text">
                  <span className="stay-way__tile-title">{item.title}</span>
                  <span className="stay-way__tile-subtitle">{item.subtitle}</span>
                </div>
                <span className="stay-way__tile-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
