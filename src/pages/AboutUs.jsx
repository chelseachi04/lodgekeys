import { 
  Compass, ShieldCheck, Sparkles, Users, Waves, Heart, 
  ArrowRight, Award, CheckCircle2, MapPin 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const coreValues = [
  {
    icon: <Compass size={24} strokeWidth={1.5} />,
    title: 'Local Knowledge First',
    description: 'We do not operate from afar. Every recommendation is informed by firsthand insight into Abraka’s quietest bends, safest avenues, and most welcoming hosts.',
  },
  {
    icon: <ShieldCheck size={24} strokeWidth={1.5} />,
    title: 'Transparent & Verified',
    description: 'No misleading wide-angle photography or surprise hidden surcharges. What you see on Lodgekeys is verified in person by our local curation team.',
  },
  {
    icon: <Sparkles size={24} strokeWidth={1.5} />,
    title: 'Curated for Character',
    description: 'We prioritize stays with soul — properties that celebrate thoughtful interiors, serene outdoor grounds, and authentic Nigerian hospitality.',
  },
  {
    icon: <Waves size={24} strokeWidth={1.5} />,
    title: 'Ethiope River Stewardship',
    description: 'Abraka is blessed by one of the clearest rivers on earth. We actively advocate for eco-conscious tourism and respectful environmental care.',
  },
  {
    icon: <Users size={24} strokeWidth={1.5} />,
    title: 'Empowering Hoteliers',
    description: 'We partner directly with boutique lodge operators and university guest houses, giving local hospitality businesses the digital tools to thrive.',
  },
  {
    icon: <Heart size={24} strokeWidth={1.5} />,
    title: 'Personalized Concierge',
    description: 'From boat ride arrangements to late-night check-in assistance, our team remains on call to ensure your journey in Delta State is effortless.',
  },
];

const teamMembers = [
  {
    name: 'Efe Omonigho',
    role: 'Founder & Head of Curation',
    bio: 'Born in Delta State with a background in architectural design and travel writing. Passionate about showcasing the understated beauty of Abraka.',
    image: '/images/stay-business.jpg',
  },
  {
    name: 'Tariere Brisibe',
    role: 'Lead Hospitality Operations',
    bio: 'Over a decade of boutique hotel management in West Africa. Oversees property standards, host partnerships, and guest service protocols.',
    image: '/images/hotel-2.jpg',
  },
  {
    name: 'Kevwe Dafe',
    role: 'Guest Experience & Local Concierge',
    bio: 'Lifelong Abraka resident, river guide, and community liaison. Connects guests with the best local cuisine, waterways, and cultural spots.',
    image: '/images/hotel-1.jpg',
  },
];

const highlights = [
  { number: '100%', label: 'Verified Stays', detail: 'Personally visited & inspected' },
  { number: '4.9★', label: 'Average Rating', detail: 'From leisure & corporate guests' },
  { number: '24/7', label: 'Local Concierge', detail: 'Direct on-ground assistance' },
  { number: '15+', label: 'Boutique Lodgings', detail: 'Riverfront & town centre stays' },
];

export default function AboutUs() {
  return (
    <div className="about-page">
      {/* Hero Banner */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero__inner">
            <span className="eyebrow">ABOUT LODGEKEYS</span>
            <h1 className="about-hero__title">
              Crafting a better way to experience <em>Abraka.</em>
            </h1>
            <p className="about-hero__subtitle">
              We started Lodgekeys because finding a truly peaceful, dependable stay in Delta State should be simple, transparent, and inspiring.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission container">
        <div className="about-mission__quote-card">
          <div className="about-mission__tag">Our Mission</div>
          <blockquote className="about-mission__quote">
            “To celebrate and elevate local hospitality in Abraka — connecting travelers with thoughtfully vetted stays and peace of mind before their journey even begins.”
          </blockquote>
        </div>

        <div className="about-story-grid">
          <div className="about-story__content">
            <span className="eyebrow">OUR STORY</span>
            <h2 className="section-heading about-story__heading">
              Rooted along the banks of the River Ethiope.
            </h2>
            <p className="about-story__p">
              Abraka has long held a unique charm: lush tropical palms, crystalline river waters that flow like liquid emerald, and a vibrant collegiate and leisure spirit. Yet travelers frequently faced uncertainty when choosing where to sleep — outdated directories, opaque rates, and unvetted rooms.
            </p>
            <p className="about-story__p">
              Lodgekeys was created to change that. We bring together Abraka's most distinctive hotels, private guest villas, and executive suites into a single, beautifully presented collection.
            </p>
            <div className="about-story__features">
              <div className="about-story__feature">
                <CheckCircle2 size={18} className="about-story__icon" />
                <span>Handpicked properties that meet strict standards of cleanliness and comfort.</span>
              </div>
              <div className="about-story__feature">
                <CheckCircle2 size={18} className="about-story__icon" />
                <span>Direct communication with vetted property managers.</span>
              </div>
              <div className="about-story__feature">
                <CheckCircle2 size={18} className="about-story__icon" />
                <span>Honest local travel advice and verified amenity checklists.</span>
              </div>
            </div>
          </div>

          <div className="about-story__media">
            <div className="about-story__image-card">
              <img 
                src="/images/hero-resort.jpg" 
                alt="Tropical hospitality in Abraka" 
                className="about-story__img"
              />
              <div className="about-story__caption">
                <MapPin size={13} />
                <span>Riverfront Lodge grounds, Abraka, Delta State</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights / Stats Strip */}
      <section className="about-highlights container">
        <div className="about-highlights__grid">
          {highlights.map((h, i) => (
            <div key={i} className="about-highlight-card">
              <span className="about-highlight__number">{h.number}</span>
              <h3 className="about-highlight__label">{h.label}</h3>
              <p className="about-highlight__detail">{h.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Values Section */}
      <section className="about-values">
        <div className="container">
          <div className="about-values__header">
            <span className="eyebrow">WHAT GUIDES US</span>
            <h2 className="section-heading">Our Core Values</h2>
            <p className="about-values__subtitle">
              The principles that shape every property partnership, guest interaction, and digital feature we build.
            </p>
          </div>

          <div className="about-values__grid">
            {coreValues.map((v, i) => (
              <div key={i} className="about-value-card">
                <div className="about-value__icon-wrap">
                  {v.icon}
                </div>
                <h3 className="about-value__title">{v.title}</h3>
                <p className="about-value__desc">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Curators Section */}
      <section className="about-team container">
        <div className="about-team__header">
          <span className="eyebrow">THE PEOPLE BEHIND LODGEKEYS</span>
          <h2 className="section-heading">Curated by locals who care.</h2>
          <p className="about-team__subtitle">
            Our team blends local Abraka roots with international hospitality standards to create an unforgettable stay experience.
          </p>
        </div>

        <div className="about-team__grid">
          {teamMembers.map((member, i) => (
            <div key={i} className="about-team-card">
              <div className="about-team__avatar-wrap">
                <img src={member.image} alt={member.name} className="about-team__img" />
              </div>
              <div className="about-team__content">
                <h3 className="about-team__name">{member.name}</h3>
                <span className="about-team__role">{member.role}</span>
                <p className="about-team__bio">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="about-cta container">
        <div className="about-cta__card">
          <div className="about-cta__content">
            <span className="eyebrow" style={{ color: '#E8DEB5' }}>START YOUR JOURNEY</span>
            <h2 className="about-cta__heading">Ready to discover your ideal stay in Abraka?</h2>
            <p className="about-cta__sub">Browse our verified collection or get in touch with our team for tailored recommendations.</p>
          </div>
          <div className="about-cta__buttons">
            <Link to="/explore" className="btn btn-light">
              Explore Hotels
              <ArrowRight size={14} />
            </Link>
            <Link to="/contact" className="btn btn-ghost">
              Contact Concierge
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
