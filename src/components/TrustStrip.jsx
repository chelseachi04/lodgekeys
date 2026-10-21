import { BookOpen, Eye, Heart } from 'lucide-react';
import './TrustStrip.css';

const benefits = [
  {
    icon: <BookOpen size={20} strokeWidth={1.3} />,
    text: 'A thoughtfully curated collection',
  },
  {
    icon: <Eye size={20} strokeWidth={1.3} />,
    text: 'Room to explore, before you arrive',
  },
  {
    icon: <Heart size={20} strokeWidth={1.3} />,
    text: 'Local hospitality, personal service',
  },
];

export default function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="trust-strip__inner container">
        {benefits.map((item, index) => (
          <div key={index} className="trust-strip__item">
            <span className="trust-strip__icon">{item.icon}</span>
            <span className="trust-strip__text">{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
