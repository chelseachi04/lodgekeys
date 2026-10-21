import { useState, useEffect } from 'react';
import { Plus, Minus, ArrowRight, X, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { faqData } from '../data/hotels';
import './FAQ.css';

const categories = [
  'General Question',
  'Booking Stays & Reservations',
  'Listing a Hotel / Property Manager',
  'River Activities & Local Concierge',
];

export default function FAQ() {
  const [openId, setOpenId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: categories[0],
    question: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Lock background scroll when modal is active
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setIsSubmitted(false);
      setErrors({});
    }, 250);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please provide your name';
    if (!formData.email.trim()) {
      errs.email = 'Please provide your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.question.trim()) {
      errs.question = 'Please enter your question or inquiry';
    } else if (formData.question.trim().length < 10) {
      errs.question = 'Please provide a little more detail (at least 10 characters)';
    }
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
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        category: categories[0],
        question: '',
      });
    }, 1100);
  };

  return (
    <section className="faq" id="faq">
      <div className="faq__inner container">
        <div className="faq__header">
          <span className="eyebrow">GOOD TO KNOW</span>
          <h2 className="section-heading faq__heading">
            A few things you might be wondering.
          </h2>
        </div>

        <div className="faq__list">
          {faqData.map((item) => (
            <div
              key={item.id}
              className={`faq__item ${openId === item.id ? 'faq__item--open' : ''}`}
            >
              <button
                className="faq__question"
                onClick={() => toggle(item.id)}
                aria-expanded={openId === item.id}
              >
                <span className="faq__question-text">{item.question}</span>
                <span className="faq__toggle-icon">
                  {openId === item.id ? (
                    <Minus size={18} strokeWidth={1.5} />
                  ) : (
                    <Plus size={18} strokeWidth={1.5} />
                  )}
                </span>
              </button>
              <div className="faq__answer-wrapper">
                <div className="faq__answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer with interactive quick ask trigger */}
        <div className="faq__footer">
          <button 
            type="button" 
            className="faq__more-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <span>More questions?</span>
            <ArrowRight size={15} className="faq__more-arrow" />
          </button>
        </div>
      </div>

      {/* Quick Ask Question Modal */}
      {isModalOpen && (
        <div 
          className="faq-modal-overlay" 
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
        >
          <div 
            className="faq-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="faq-modal-close"
              onClick={closeModal}
              aria-label="Close question modal"
            >
              <X size={18} />
            </button>

            {isSubmitted ? (
              <div className="faq-modal-success">
                <div className="faq-modal-success__icon">
                  <CheckCircle2 size={46} />
                </div>
                <h3 className="faq-modal-success__title">Question Received!</h3>
                <p className="faq-modal-success__text">
                  Thanks for reaching out! We'll reply to your email shortly.
                </p>
                <div className="faq-modal-success__actions">
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Ask Another Question
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="faq-modal-header">
                  <span className="eyebrow">CONCIERGE HELP DESK</span>
                  <h3 id="faq-modal-title" className="faq-modal-title">
                    Ask a Question
                  </h3>
                  <p className="faq-modal-subtitle">
                    Wondering about a specific lodge, river conditions, or hotel onboarding? Send your inquiry directly to our Abraka team.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="faq-modal-form" noValidate>
                  {/* Name */}
                  <div className="faq-form-group">
                    <label htmlFor="faq-name" className="faq-form-label">
                      Your Name <span className="faq-form-req">*</span>
                    </label>
                    <input
                      id="faq-name"
                      type="text"
                      className={`faq-form-input ${errors.name ? 'faq-form-input--error' : ''}`}
                      placeholder="e.g. Elohor Okoro"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      autoFocus
                    />
                    {errors.name && <span className="faq-form-error">{errors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className="faq-form-group">
                    <label htmlFor="faq-email" className="faq-form-label">
                      Email Address <span className="faq-form-req">*</span>
                    </label>
                    <input
                      id="faq-email"
                      type="email"
                      className={`faq-form-input ${errors.email ? 'faq-form-input--error' : ''}`}
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <span className="faq-form-error">{errors.email}</span>}
                  </div>

                  {/* Category */}
                  <div className="faq-form-group">
                    <label htmlFor="faq-category" className="faq-form-label">
                      Category
                    </label>
                    <select
                      id="faq-category"
                      className="faq-form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question / Inquiry */}
                  <div className="faq-form-group">
                    <label htmlFor="faq-question" className="faq-form-label">
                      Your Question / Inquiry <span className="faq-form-req">*</span>
                    </label>
                    <textarea
                      id="faq-question"
                      rows={4}
                      className={`faq-form-textarea ${errors.question ? 'faq-form-input--error' : ''}`}
                      placeholder="What would you like to know about Lodgekeys or staying in Abraka?"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    />
                    {errors.question && <span className="faq-form-error">{errors.question}</span>}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary faq-modal-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Sending your question...'
                    ) : (
                      <>
                        Submit Question
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
