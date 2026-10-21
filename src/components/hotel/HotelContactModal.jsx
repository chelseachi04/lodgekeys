import { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import './HotelContactModal.css';

export default function HotelContactModal({ hotel, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please provide your name';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email';
    }
    if (!formData.message.trim()) errs.message = 'Please enter your message';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 1000);
  };

  return (
    <div className="hotel-contact-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="hotel-contact-card" onClick={(e) => e.stopPropagation()}>
        <button className="hotel-contact-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {submitted ? (
          <div className="hotel-contact-success">
            <div className="hotel-contact-success__icon">
              <CheckCircle2 size={44} />
            </div>
            <h3>Inquiry Dispatched!</h3>
            <p>
              Your message has been forwarded directly to the front desk at <strong>{hotel.name}</strong>. Our local concierge will follow up via email shortly.
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              Return to Hotel Page
            </button>
          </div>
        ) : (
          <>
            <div className="hotel-contact-header">
              <span className="eyebrow">HOTEL CONCIERGE DESK</span>
              <h2 className="hotel-contact-title">Contact {hotel.name}</h2>
              <p className="hotel-contact-desc">
                Have specific inquiries about room availability, private river transport, or dietary needs? Send a direct note to the host desk.
              </p>
            </div>

            <div className="hotel-contact-info-strip">
              <div className="hotel-contact-info-item">
                <MapPin size={15} />
                <span>{hotel.address || hotel.location}</span>
              </div>
              <div className="hotel-contact-info-item">
                <Phone size={15} />
                <span>+234 (0) 708 123 4567 (Front Desk)</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="hotel-contact-form" noValidate>
              <div className="hotel-contact-form-group">
                <label className="hotel-contact-label">Your Full Name <span className="req">*</span></label>
                <input
                  type="text"
                  className={`hotel-contact-input ${errors.name ? 'hotel-contact-input--error' : ''}`}
                  placeholder="e.g. Tamara Ebi"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
                {errors.name && <span className="hotel-contact-err">{errors.name}</span>}
              </div>

              <div className="hotel-contact-row">
                <div className="hotel-contact-form-group">
                  <label className="hotel-contact-label">Email Address <span className="req">*</span></label>
                  <input
                    type="email"
                    className={`hotel-contact-input ${errors.email ? 'hotel-contact-input--error' : ''}`}
                    placeholder="tamara@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {errors.email && <span className="hotel-contact-err">{errors.email}</span>}
                </div>

                <div className="hotel-contact-form-group">
                  <label className="hotel-contact-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    className="hotel-contact-input"
                    placeholder="080 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="hotel-contact-form-group">
                <label className="hotel-contact-label">Inquiry Details <span className="req">*</span></label>
                <textarea
                  rows={4}
                  className={`hotel-contact-textarea ${errors.message ? 'hotel-contact-input--error' : ''}`}
                  placeholder={`Hi ${hotel.name} team, I would like to inquire about...`}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
                {errors.message && <span className="hotel-contact-err">{errors.message}</span>}
              </div>

              <button type="submit" className="btn btn-primary hotel-contact-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Dispatching Inquiry...'
                ) : (
                  <>
                    Send Message to Hotel
                    <Send size={14} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
