import { X, Printer, CheckCircle2, MapPin, Calendar, User, Phone, Mail, ShieldCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import './BookingReceiptModal.css';

/**
 * PII Privacy Masking Helpers
 * Protects guest personally identifiable information on shared receipts and public vouchers
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '—';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [username, domain] = parts;
  const prefix = username.slice(0, Math.min(2, username.length));
  return `${prefix}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '—';
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  const start = clean.slice(0, Math.min(8, clean.length - 4));
  const end = clean.slice(-3);
  return `${start} *** *${end}`;
}

export default function BookingReceiptModal() {
  const { activeReceipt, setActiveReceipt } = useNotifications();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';

  if (!activeReceipt) return null;

  const guestEmail = isAdmin ? activeReceipt.guest?.email : maskEmail(activeReceipt.guest?.email);
  const guestPhone = isAdmin ? activeReceipt.guest?.phone : maskPhone(activeReceipt.guest?.phone);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="receipt-modal-overlay" onClick={() => setActiveReceipt(null)}>
      <div className="receipt-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-modal-toolbar no-print">
          <div className="receipt-modal-toolbar__left">
            <span className="receipt-badge">Official Reservation Voucher</span>
          </div>
          <div className="receipt-modal-toolbar__actions">
            <button
              type="button"
              className="btn btn-outline receipt-print-btn"
              onClick={handlePrint}
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              type="button"
              className="receipt-close-btn"
              onClick={() => setActiveReceipt(null)}
              aria-label="Close receipt"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Slip Container */}
        <div className="receipt-slip" id="printable-invoice">
          {/* Slip Header */}
          <div className="receipt-slip__header">
            <div className="receipt-slip__brand">
              <span className="receipt-brand-logo">lodgekeys.</span>
              <span className="receipt-hotel-sub">Abraka Stays &amp; Verified Hospitality</span>
            </div>
            <div className="receipt-slip__ref-box">
              <span className="ref-label">RESERVATION REF</span>
              <strong className="ref-code">{activeReceipt.id || activeReceipt.bookingRef}</strong>
              <div className="ref-status">
                <CheckCircle2 size={13} />
                <span>CONFIRMED &amp; ON DESK HOLD</span>
              </div>
            </div>
          </div>

          {/* Hotel & Room Banner */}
          <div className="receipt-slip__property">
            <div className="property-details">
              <h2 className="property-title">{activeReceipt.hotelName}</h2>
              <p className="property-address">
                <MapPin size={13} /> {activeReceipt.hotelAddress || 'Abraka, Delta State, Nigeria'}
              </p>
            </div>
            <div className="property-room-assigned">
              <span className="room-assigned-label">Allocated Room</span>
              <strong className="room-assigned-number">{activeReceipt.roomNumber}</strong>
            </div>
          </div>

          {/* Dates & Guest Details Grid */}
          <div className="receipt-slip__grid">
            <div className="receipt-card">
              <h4>Stay Schedule</h4>
              <div className="receipt-info-row">
                <Calendar size={14} />
                <div>
                  <span className="info-label">Check-in</span>
                  <strong>{activeReceipt.dates?.arrival} (From 2:00 PM)</strong>
                </div>
              </div>
              <div className="receipt-info-row">
                <Calendar size={14} />
                <div>
                  <span className="info-label">Check-out</span>
                  <strong>{activeReceipt.dates?.departure} (By 11:00 AM)</strong>
                </div>
              </div>
              <div className="receipt-info-row">
                <span className="info-label">Duration</span>
                <span>{activeReceipt.dates?.nights || 1} Night(s) · {activeReceipt.dates?.guests}</span>
              </div>
            </div>

            <div className="receipt-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ margin: 0 }}>Guest Details</h4>
                {!isAdmin && (
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Privacy Masked
                  </span>
                )}
              </div>
              <div className="receipt-info-row">
                <User size={14} />
                <span>{activeReceipt.guest?.fullName}</span>
              </div>
              <div className="receipt-info-row">
                <Mail size={14} />
                <span>{guestEmail}</span>
              </div>
              <div className="receipt-info-row">
                <Phone size={14} />
                <span>{guestPhone}</span>
              </div>
              {activeReceipt.guest?.specialRequests && (
                <div className="receipt-info-row">
                  <span className="info-label">Requests:</span>
                  <span className="requests-text">"{activeReceipt.guest.specialRequests}"</span>
                </div>
              )}
            </div>
          </div>

          {/* Add-ons List if any */}
          {activeReceipt.addOns && activeReceipt.addOns.length > 0 && (
            <div className="receipt-slip__addons">
              <h4>Selected Add-on Experiences</h4>
              <ul className="addons-list">
                {activeReceipt.addOns.map((add, idx) => (
                  <li key={idx} className="addon-item">
                    <span>{add.title}</span>
                    <strong>+{add.priceFormatted}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Itemized Financial Breakdown */}
          <div className="receipt-slip__financials">
            <div className="financial-row">
              <span>Room Category ({activeReceipt.roomName || 'Selected Room'})</span>
              <span>
                ₦{((activeReceipt.roomPriceNumeric || 0)).toLocaleString()} × {activeReceipt.dates?.nights || 1} night(s)
              </span>
            </div>
            {activeReceipt.addOnsTotal > 0 && (
              <div className="financial-row">
                <span>Extra Services &amp; Activities</span>
                <span>+₦{activeReceipt.addOnsTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="financial-row">
              <span>Local Hospitality Tax &amp; Service Charge</span>
              <span>Included</span>
            </div>
            <div className="financial-divider" />
            <div className="financial-row financial-row--total">
              <div>
                <strong>Total Amount</strong>
                <span className="payment-method-tag">
                  {activeReceipt.paymentMethod === 'hotel'
                    ? 'Payment to be completed at hotel desk'
                    : activeReceipt.paymentMethod === 'card'
                    ? 'Card payment verified'
                    : 'Bank transfer reservation'}
                </span>
              </div>
              <strong className="grand-total">₦{(activeReceipt.totalAmount || 0).toLocaleString()}</strong>
            </div>
          </div>

          {/* Policy & Check-in Assurance */}
          <div className="receipt-slip__footer">
            <div className="assurance-note">
              <ShieldCheck size={16} />
              <span>
                Please present this voucher or reservation code <strong>{activeReceipt.id || activeReceipt.bookingRef}</strong> alongside a valid government-issued ID upon arrival at {activeReceipt.hotelName}.
              </span>
            </div>
            <div className="barcode-placeholder">
              <span className="barcode-lines">||| | |||| || | ||||| || ||| |||| |</span>
              <span className="barcode-code">{activeReceipt.id || activeReceipt.bookingRef}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
