import { useState } from 'react';
import { 
  Mail, Phone, Clock, MapPin, Send, CheckCircle2, 
  MessageSquare, ShieldCheck, Sparkles, HelpCircle 
} from 'lucide-react';
import './Contact.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Please enter your full name';
    if (!formData.email.trim()) {
      errs.email = 'Please enter your email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.message.trim()) errs.message = 'Please provide a message or question';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });
    }, 1200);
  };

  return (
    <div className="contact-page">
      {/* Top Banner */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero__inner">
            <span className="eyebrow">GET IN TOUCH</span>
            <h1 className="contact-hero__title">
              We’re here to help you find your <em>peace.</em>
            </h1>
            <p className="contact-hero__subtitle">
              Have questions about an Abraka property, special stay arrangements, or listing your hotel? Our local team is ready to assist.
            </p>
          </div>
        </div>
      </section>

      {/* Main Split Content */}
      <section className="contact-main container">
        <div className="contact-grid">
          {/* Left Column: Support & Info */}
          <div className="contact-info">
            <div className="contact-info__header">
              <span className="eyebrow">DIRECT CONTACT</span>
              <h2 className="contact-info__title">Speak with our local concierge team.</h2>
              <p className="contact-info__desc">
                Whether you need advice on seasonal water levels along the River Ethiope or tailored bookings for a corporate retreat, our concierge knows Abraka inside out.
              </p>
            </div>

            {/* Contact Channels */}
            <div className="contact-channels">
              <div className="contact-channel-card">
                <div className="contact-channel__icon">
                  <Mail size={20} strokeWidth={1.5} />
                </div>
                <div className="contact-channel__content">
                  <span className="contact-channel__label">Email Us</span>
                  <a href="mailto:concierge@lodgekeys.com" className="contact-channel__val">
                    concierge@lodgekeys.com
                  </a>
                  <span className="contact-channel__sub">Inquiries typically answered within 2 hours</span>
                </div>
              </div>

              <div className="contact-channel-card">
                <div className="contact-channel__icon">
                  <Phone size={20} strokeWidth={1.5} />
                </div>
                <div className="contact-channel__content">
                  <span className="contact-channel__label">Phone & WhatsApp Support</span>
                  <a href="tel:+2347081234567" className="contact-channel__val">
                    +234 (0) 708 123 4567
                  </a>
                  <span className="contact-channel__sub">Direct hotline · WhatsApp desk available</span>
                </div>
              </div>

              <div className="contact-channel-card">
                <div className="contact-channel__icon">
                  <Clock size={20} strokeWidth={1.5} />
                </div>
                <div className="contact-channel__content">
                  <span className="contact-channel__label">Operational Hours</span>
                  <strong className="contact-channel__val">Monday – Sunday: 8:00 AM – 10:00 PM WAT</strong>
                  <span className="contact-channel__sub">24/7 dedicated support for active in-stay guests</span>
                </div>
              </div>

              <div className="contact-channel-card">
                <div className="contact-channel__icon">
                  <MapPin size={20} strokeWidth={1.5} />
                </div>
                <div className="contact-channel__content">
                  <span className="contact-channel__label">Abraka Liaison Office</span>
                  <strong className="contact-channel__val">Riverfront Promenade, Abraka, Delta State</strong>
                  <span className="contact-channel__sub">Nigeria</span>
                </div>
              </div>
            </div>

            {/* Quick Assurance Box */}
            <div className="contact-assurance">
              <div className="contact-assurance__item">
                <ShieldCheck size={18} className="contact-assurance__icon" />
                <div>
                  <strong>No Robot Gatekeeping</strong>
                  <p>You speak directly with humans living and working in Delta State.</p>
                </div>
              </div>
              <div className="contact-assurance__item">
                <Sparkles size={18} className="contact-assurance__icon" />
                <div>
                  <strong>Bespoke Group Coordination</strong>
                  <p>Weddings, academic symposia, and family reunions curated with ease.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="contact-form-card">
            <div className="contact-form__header">
              <span className="eyebrow">SEND A MESSAGE</span>
              <h3 className="contact-form__title">How can we help you?</h3>
              <p className="contact-form__desc">
                Fill out the form below and one of our local travel specialists will reach out promptly.
              </p>
            </div>

            {submitted ? (
              <div className="contact-form__success">
                <div className="contact-form__success-icon">
                  <CheckCircle2 size={44} />
                </div>
                <h3>Message Sent Successfully!</h3>
                <p>
                  Thank you for reaching out to Lodgekeys. A copy has been delivered to our Abraka concierge desk. We will respond to <strong>{formData.email || 'your email'}</strong> shortly.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    Full Name <span className="form-req">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
                    placeholder="e.g. Ovie Daniel"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </div>

                {/* Email & Phone Row */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address <span className="form-req">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                      placeholder="e.g. ovie@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-input"
                      placeholder="e.g. 0801 234 5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <select
                    id="subject"
                    className="form-select"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Hotel Booking Assistance">Hotel Booking Assistance</option>
                    <option value="List My Property / Partnership">List My Property / Partnership</option>
                    <option value="Group or Corporate Booking">Group or Corporate Booking</option>
                    <option value="Media & Press">Media & Press</option>
                  </select>
                </div>

                {/* Message */}
                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message <span className="form-req">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className={`form-textarea ${errors.message ? 'form-input--error' : ''}`}
                    placeholder="Please tell us about your dates, preferred lodge, or question..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                  {errors.message && <span className="form-error">{errors.message}</span>}
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary contact-form__btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Sending Message...'
                  ) : (
                    <>
                      Send Message
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
