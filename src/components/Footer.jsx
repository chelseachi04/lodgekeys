import { KeyRound, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Footer.css';

const discoverLinks = [
  { label: 'Explore Hotels', to: '/explore' },
  { label: 'About Lodgekeys', to: '/about' },
  { label: 'List Your Hotel', to: '/#list' },
];

const helpLinks = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'Frequently Asked Questions', to: '/#faq' },
  { label: 'Guest & Owner Portal', action: 'auth' },
];

const legalLinks = [
  { label: 'Terms & Conditions', to: '#' },
  { label: 'Privacy Policy', to: '#' },
  { label: 'Cancellation Policy', to: '#' },
];

export default function Footer() {
  const { openAuth } = useAuth();
  return (
    <footer className="footer" id="contact">
      <div className="footer__inner container">
        {/* Column 1: Brand */}
        <div className="footer__col footer__col--brand">
          <Link to="/" className="footer__brand">
            <KeyRound size={18} strokeWidth={1.5} className="footer__brand-icon" />
            <span className="footer__wordmark">lodgekeys.</span>
          </Link>
          <p className="footer__brand-desc">
            A better stay starts with a little local knowledge.
          </p>
          <div className="footer__location">
            <MapPin size={13} strokeWidth={1.5} />
            <span>Abraka, Delta State, Nigeria</span>
          </div>
        </div>

        {/* Column 2: Discover */}
        <div className="footer__col">
          <h4 className="footer__col-title">Discover</h4>
          <ul className="footer__links">
            {discoverLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="footer__link">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Here to help */}
        <div className="footer__col">
          <h4 className="footer__col-title">Here to help</h4>
          <ul className="footer__links">
            {helpLinks.map((link) => (
              <li key={link.label}>
                {link.action === 'auth' ? (
                  <button 
                    type="button" 
                    onClick={() => openAuth('signin')} 
                    className="footer__link"
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link to={link.to} className="footer__link">{link.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: The fine print */}
        <div className="footer__col">
          <h4 className="footer__col-title">The fine print</h4>
          <ul className="footer__links">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="footer__link">{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom container">
        <div className="footer__bottom-inner">
          <span className="footer__copyright">
            © 2026 Lodgekeys. Thoughtfully local.
          </span>
          <span className="footer__meta">
            All rights reserved · Premium hotel bookings & management.
          </span>
          <span className="footer__admin">
            <Link to="/manager/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Hotel Manager Portal</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
