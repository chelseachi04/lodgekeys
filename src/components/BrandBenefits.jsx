import { Camera, ClipboardCheck, Compass, HeartHandshake, ArrowRight } from 'lucide-react';
import './BrandBenefits.css';

const iconMap = {
  camera: <Camera size={22} strokeWidth={1.3} />,
  clipboard: <ClipboardCheck size={22} strokeWidth={1.3} />,
  compass: <Compass size={22} strokeWidth={1.3} />,
  heart: <HeartHandshake size={22} strokeWidth={1.3} />,
};

const benefits = [
  {
    icon: 'camera',
    title: 'See the stay',
    description: 'Room photography to help you choose with confidence.',
  },
  {
    icon: 'clipboard',
    title: 'Know what to expect',
    description: 'Clear information, considered choices, no guesswork.',
  },
  {
    icon: 'compass',
    title: 'Find your own corner',
    description: 'Explore the neighbourhoods that feel right for you.',
  },
  {
    icon: 'heart',
    title: 'A local connection',
    description: 'A warmer welcome, with people who know the place.',
  },
];

export default function BrandBenefits() {
  return (
    <section className="brand-benefits" id="about">
      <div className="brand-benefits__inner container">
        {/* Left Column */}
        <div className="brand-benefits__left">
          <span className="eyebrow">THOUGHTFULLY LOCAL</span>
          <h2 className="section-heading brand-benefits__heading">
            Less searching.<br />
            More settling in.
          </h2>
          <p className="brand-benefits__description">
            Your stay should feel good from the very first click. We're bringing Abraka's hospitality together in one place.
          </p>
          <a href="#about" className="brand-benefits__link">
            The Lodgekeys story
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Right Column */}
        <div className="brand-benefits__right">
          <div className="brand-benefits__grid">
            {benefits.map((item, index) => (
              <div key={index} className="brand-benefits__item">
                <div className="brand-benefits__icon">
                  {iconMap[item.icon]}
                </div>
                <h3 className="brand-benefits__title">{item.title}</h3>
                <p className="brand-benefits__text">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
