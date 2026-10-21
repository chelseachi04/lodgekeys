import { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Building2, MapPin, Mail, Phone, DollarSign, 
  BedDouble, ShieldCheck, ArrowRight, Upload, AlertCircle, FileText,
  CheckSquare, Info, Lock, Loader2, Sparkles, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { applicationService } from '../services/applicationService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import './HotelApplicationModal.css';

const ABRAKA_DISTRICTS = [
  'Town Centre',
  'Riverfront / Ethiope Waterway',
  'Campus Area / DELSU Gate 1 & 2',
  'Express Road / Sapele Way',
  'Urhoka Quarter',
  'Oria Road',
  'Ekrejeta',
];

const PROPERTY_CATEGORIES = [
  'Hotel',
  'Resort & Sanctuary',
  'Guest House & Lodge',
  'Boutique Stay',
  'Serviced Apartment',
  'Eco-Lodge',
];

const APPLICANT_ROLES = [
  { value: 'owner', label: 'Property Owner' },
  { value: 'manager', label: 'Authorized General Manager' },
  { value: 'representative', label: 'Corporate Representative / Director' },
];

const STANDARD_FACILITIES = [
  'Restaurant & Bar',
  'Swimming Pool',
  'Event Centre & Hall',
  'Fitness Gym',
  'Secure On-site Parking',
  'High-speed Wi-Fi',
  '24/7 Solar / Generator Power',
  'Airport / Transport Shuttle',
  'Conference Facilities',
  'Spa & Wellness Services',
];

export default function HotelApplicationModal({ isOpen, onClose }) {
  const { currentUser, isAuthenticated, openAuth } = useAuth();

  const [formData, setFormData] = useState({
    // Section A: Hotel & Business Info
    name: '',
    category: 'Hotel',
    yearEstablished: '',
    businessRegStatus: 'registered_cac', // 'registered_cac', 'in_progress', 'sole_proprietor', 'not_applicable'
    businessRegNumber: '',
    description: '',
    totalRooms: 12,
    startingRate: 45000,
    website: '',

    // Section B: Contact & Ownership
    ownerName: '',
    applicantRole: 'owner',
    contactEmail: '',
    contactPhone: '',
    alternativePhone: '',
    preferredContactMethod: 'email',
    isAuthorized: true,

    // Section C: Location
    area: 'Town Centre',
    address: '',
    nearbyLandmark: '',
    googleMapsUrl: '',
    locationNotes: '',

    // Section D: Accommodation Overview
    roomTypesOverview: '',

    // Section E: Facilities & Additional Services
    facilities: ['High-speed Wi-Fi', '24/7 Solar / Generator Power', 'Secure On-site Parking'],
    additionalServicesNotes: '',

    // Section F: Verification Documents (URLs or file names)
    businessRegDoc: '',
    operatingPermitDoc: '',
    fireSafetyDoc: '',
    proofOfOwnershipDoc: '',

    // Section G: Declaration
    declarationAgreed: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(null);

  // Sync authenticated user details into contact fields
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        ownerName: prev.ownerName || currentUser.fullName || '',
        contactEmail: currentUser.email || prev.contactEmail,
        contactPhone: prev.contactPhone || currentUser.phone || '',
      }));
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFacilityToggle = (facility) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(facility);
      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((f) => f !== facility)
          : [...prev.facilities, facility],
      };
    });
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [field]: 'File size must be under 15MB.' }));
      return;
    }

    try {
      if (isSupabaseConfigured && currentUser?.id) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${currentUser.id}/${field}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('hotel-documents')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.warn('Storage upload notice:', uploadError.message);
          setFormData((prev) => ({ ...prev, [field]: file.name }));
        } else {
          setFormData((prev) => ({ ...prev, [field]: filePath }));
        }
      } else {
        setFormData((prev) => ({ ...prev, [field]: file.name }));
      }
    } catch (err) {
      console.warn('File upload exception:', err);
      setFormData((prev) => ({ ...prev, [field]: file.name }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Official hotel name is required.';
    if (!formData.ownerName.trim()) errs.ownerName = "Applicant's full name is required.";
    if (!formData.contactEmail.trim() || !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      errs.contactEmail = 'A valid contact email is required.';
    }
    if (!formData.contactPhone.trim() || formData.contactPhone.length < 8) {
      errs.contactPhone = 'Valid contact phone number is required.';
    }
    if (!formData.address.trim()) errs.address = 'Street address is required.';
    if (!formData.description.trim() || formData.description.trim().length < 20) {
      errs.description = 'Please provide a property description of at least 20 characters.';
    }
    if (!formData.isAuthorized) {
      errs.isAuthorized = 'You must confirm authorization to represent this property.';
    }
    if (!formData.declarationAgreed) {
      errs.declarationAgreed = 'You must accept the legal declaration before submitting.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError('');

    if (!validate()) {
      const firstErrorField = document.querySelector('.app-modal__input--error');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await applicationService.submitApplicationAsync(formData, currentUser);
      setSubmittedApp(result);
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmissionError(err.message || 'Submission could not be completed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedApp(null);
    setSubmissionError('');
    setErrors({});
    setFormData({
      name: '',
      category: 'Hotel',
      yearEstablished: '',
      businessRegStatus: 'registered_cac',
      businessRegNumber: '',
      description: '',
      totalRooms: 12,
      startingRate: 45000,
      website: '',
      ownerName: currentUser?.fullName || '',
      applicantRole: 'owner',
      contactEmail: currentUser?.email || '',
      contactPhone: currentUser?.phone || '',
      alternativePhone: '',
      preferredContactMethod: 'email',
      isAuthorized: true,
      area: 'Town Centre',
      address: '',
      nearbyLandmark: '',
      googleMapsUrl: '',
      locationNotes: '',
      roomTypesOverview: '',
      facilities: ['High-speed Wi-Fi', '24/7 Solar / Generator Power', 'Secure On-site Parking'],
      additionalServicesNotes: '',
      businessRegDoc: '',
      operatingPermitDoc: '',
      fireSafetyDoc: '',
      proofOfOwnershipDoc: '',
      declarationAgreed: false,
    });
    onClose();
  };

  return (
    <div className="app-modal-overlay" role="dialog" aria-modal="true">
      <div className="app-modal app-modal--expanded">
        <div className="app-modal__head">
          <div className="app-modal__brand">
            <span className="app-modal__tag">PARTNER WITH LODGEKEYS</span>
            <h2 className="app-modal__title">List Your Hotel in Abraka</h2>
            <p className="app-modal__subtitle">
              Expand your property's reach across Delta State with verified guest bookings and authoritative inventory management.
            </p>
          </div>
          <button className="app-modal__close" onClick={handleResetAndClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {submittedApp ? (
          <div className="app-modal__success">
            <div className="app-modal__success-icon">
              <CheckCircle2 size={56} />
            </div>
            <h3>Application Received!</h3>
            <p className="app-modal__success-ref">
              Application Reference: <strong>{submittedApp.referenceNumber}</strong>
            </p>
            <div className="app-modal__success-card">
              <h4>{submittedApp.name}</h4>
              <p className="app-modal__success-meta">
                <span>Submitted by: <strong>{submittedApp.ownerName}</strong></span>
                <span>Category: <strong>{submittedApp.category}</strong></span>
                <span>Area: <strong>{submittedApp.area}</strong></span>
              </p>
            </div>
            <p className="app-modal__success-text">
              Your property onboarding request is now <strong>Pending Administrative Review</strong>.
              Our team verifies licensing, safety standards, and facilities before activating your live catalog microsite.
            </p>
            <div className="app-modal__estimate-banner">
              <Clock size={16} />
              <span><strong>Estimated Review Period:</strong> 24–48 hours (estimated standard processing time).</span>
            </div>
            <p className="app-modal__success-footer-note">
              An acknowledgment receipt has been logged. You may monitor this application and configure your detailed room inventory once approved.
            </p>
            <button className="btn btn-gold app-modal__done-btn" onClick={handleResetAndClose}>
              Done & Return
            </button>
          </div>
        ) : (
          <form className="app-modal__form" onSubmit={handleSubmit} noValidate>
            {/* Unauthenticated Alert Prompt */}
            {!isAuthenticated && (
              <div className="app-modal__auth-prompt">
                <Info size={18} className="app-modal__auth-prompt-icon" />
                <div className="app-modal__auth-prompt-body">
                  <strong>Recommended: Sign in before submitting</strong>
                  <p>
                    Linking your application to an authenticated account ensures you receive immediate manager dashboard access once approved.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline app-modal__auth-btn"
                  onClick={() => openAuth('signin')}
                >
                  Sign In
                </button>
              </div>
            )}

            {submissionError && (
              <div className="app-modal__banner-error">
                <AlertCircle size={18} />
                <span>{submissionError}</span>
              </div>
            )}

            {/* ── Section A: Hotel and Business Information ── */}
            <div className="app-modal__section">
              <div className="app-modal__section-header">
                <Building2 size={18} className="app-modal__section-icon" />
                <h3>A. Hotel & Business Information</h3>
              </div>
              <div className="app-modal__grid">
                <div className="app-modal__field app-modal__field--full">
                  <label>Official Hotel / Property Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Royal Palms Hotel & Suites"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'app-modal__input--error' : ''}
                  />
                  {errors.name && <span className="app-modal__error-text">{errors.name}</span>}
                </div>

                <div className="app-modal__field">
                  <label>Property Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    {PROPERTY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="app-modal__field">
                  <label>Year Established (Optional)</label>
                  <input
                    type="text"
                    name="yearEstablished"
                    placeholder="e.g. 2018"
                    value={formData.yearEstablished}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field">
                  <label>Business Registration Status</label>
                  <select name="businessRegStatus" value={formData.businessRegStatus} onChange={handleChange}>
                    <option value="registered_cac">CAC Registered (Limited Liability / Enterprise)</option>
                    <option value="in_progress">CAC Registration In Progress</option>
                    <option value="sole_proprietor">Sole Proprietorship / Local Business</option>
                    <option value="not_applicable">Not Applicable / Hospitality Permit Only</option>
                  </select>
                </div>

                <div className="app-modal__field">
                  <label>CAC / Registration Number (If applicable)</label>
                  <input
                    type="text"
                    name="businessRegNumber"
                    placeholder="e.g. RC-149201 or BN-84910"
                    value={formData.businessRegNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field">
                  <label>Total Accommodation Units *</label>
                  <input
                    type="number"
                    name="totalRooms"
                    min="1"
                    max="300"
                    value={formData.totalRooms}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field">
                  <label>Starting Nightly Rate (₦ NGN) *</label>
                  <input
                    type="number"
                    name="startingRate"
                    min="5000"
                    step="1000"
                    value={formData.startingRate}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field app-modal__field--full">
                  <label>Website or Official Social Media Page (Optional)</label>
                  <input
                    type="url"
                    name="website"
                    placeholder="https://instagram.com/yourhotel or https://yourhotel.com"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field app-modal__field--full">
                  <label>Property Description & Highlights *</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Describe your hospitality property, architectural highlights, serenity, 24/7 power, security, and unique guest experience..."
                    value={formData.description}
                    onChange={handleChange}
                    className={errors.description ? 'app-modal__input--error' : ''}
                  />
                  {errors.description && <span className="app-modal__error-text">{errors.description}</span>}
                </div>
              </div>
            </div>

            {/* ── Section B: Contact & Ownership Information ── */}
            <div className="app-modal__section">
              <div className="app-modal__section-header">
                <UserCheck size={18} className="app-modal__section-icon" />
                <h3>B. Contact & Ownership Information</h3>
              </div>
              <div className="app-modal__grid">
                <div className="app-modal__field">
                  <label>Applicant Full Name *</label>
                  <input
                    type="text"
                    name="ownerName"
                    required
                    placeholder="e.g. Chief Donald Eke"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className={errors.ownerName ? 'app-modal__input--error' : ''}
                  />
                  {errors.ownerName && <span className="app-modal__error-text">{errors.ownerName}</span>}
                </div>

                <div className="app-modal__field">
                  <label>Applicant Role / Title *</label>
                  <select name="applicantRole" value={formData.applicantRole} onChange={handleChange}>
                    {APPLICANT_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div className="app-modal__field">
                  <label>Contact Email Address *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    placeholder="manager@yourhotel.com"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className={errors.contactEmail ? 'app-modal__input--error' : ''}
                  />
                  {errors.contactEmail && <span className="app-modal__error-text">{errors.contactEmail}</span>}
                </div>

                <div className="app-modal__field">
                  <label>Contact Phone Number *</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    required
                    placeholder="+234 803 000 0000"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={errors.contactPhone ? 'app-modal__input--error' : ''}
                  />
                  {errors.contactPhone && <span className="app-modal__error-text">{errors.contactPhone}</span>}
                </div>

                <div className="app-modal__field">
                  <label>Alternative Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="alternativePhone"
                    placeholder="+234 805 000 0000"
                    value={formData.alternativePhone}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field">
                  <label>Preferred Contact Method</label>
                  <select name="preferredContactMethod" value={formData.preferredContactMethod} onChange={handleChange}>
                    <option value="email">Email Notification</option>
                    <option value="phone">Phone Call</option>
                    <option value="whatsapp">WhatsApp Business</option>
                  </select>
                </div>

                <div className="app-modal__field app-modal__field--full">
                  <label className="app-modal__checkbox-container">
                    <input
                      type="checkbox"
                      name="isAuthorized"
                      checked={formData.isAuthorized}
                      onChange={handleChange}
                    />
                    <span>
                      I confirm that I am the owner or legally authorized representative authorized to submit and manage this property on Lodgekeys. *
                    </span>
                  </label>
                  {errors.isAuthorized && <span className="app-modal__error-text">{errors.isAuthorized}</span>}
                </div>
              </div>
            </div>

            {/* ── Section C: Property Location ── */}
            <div className="app-modal__section">
              <div className="app-modal__section-header">
                <MapPin size={18} className="app-modal__section-icon" />
                <h3>C. Property Location</h3>
              </div>
              <div className="app-modal__grid">
                <div className="app-modal__field">
                  <label>Abraka District / Neighbourhood *</label>
                  <select name="area" value={formData.area} onChange={handleChange}>
                    {ABRAKA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div className="app-modal__field">
                  <label>Nearby Landmark</label>
                  <input
                    type="text"
                    name="nearbyLandmark"
                    placeholder="e.g. Beside River Ethiope Jetty / Near DELSU Gate 2"
                    value={formData.nearbyLandmark}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field app-modal__field--full">
                  <label>Full Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="e.g. 14 River Road, Beside Ethiope Waterway, Abraka"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'app-modal__input--error' : ''}
                  />
                  {errors.address && <span className="app-modal__error-text">{errors.address}</span>}
                </div>

                <div className="app-modal__field app-modal__field--full">
                  <label>Google Maps URL or Coordinates (Optional)</label>
                  <input
                    type="url"
                    name="googleMapsUrl"
                    placeholder="https://maps.google.com/?q=..."
                    value={formData.googleMapsUrl}
                    onChange={handleChange}
                  />
                </div>

                <div className="app-modal__field app-modal__field--full">
                  <label>Directions or Location Notes (Optional)</label>
                  <input
                    type="text"
                    name="locationNotes"
                    placeholder="e.g. Turn right after Abraka Police Station, second gate on the left"
                    value={formData.locationNotes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* ── Section D: Accommodation Overview ── */}
            <div className="app-modal__section">
              <div className="app-modal__section-header">
                <BedDouble size={18} className="app-modal__section-icon" />
                <h3>D. Accommodation Overview</h3>
              </div>
              <p className="app-modal__section-hint">
                Provide a summary of your room categories. You will configure detailed individual room numbers, pricing tiers, and photos in your manager dashboard after listing approval.
              </p>
              <div className="app-modal__grid">
                <div className="app-modal__field app-modal__field--full">
                  <label>Room Categories Summary (Optional)</label>
                  <textarea
                    name="roomTypesOverview"
                    rows={2}
                    placeholder="e.g. Deluxe Garden Room (₦45,000), Executive Riverview Suite (₦72,000), 2-Bedroom VIP Chalet (₦110,000)..."
                    value={formData.roomTypesOverview}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* ── Section E: Facilities & Additional Services ── */}
            <div className="app-modal__section">
              <div className="app-modal__section-header">
                <Sparkles size={18} className="app-modal__section-icon" />
                <h3>E. Facilities & Services Available</h3>
              </div>
              <div className="app-modal__facilities-grid">
                {STANDARD_FACILITIES.map((fac) => {
                  const isChecked = formData.facilities.includes(fac);
                  return (
                    <button
                      type="button"
                      key={fac}
                      className={`app-modal__facility-btn ${isChecked ? 'app-modal__facility-btn--active' : ''}`}
                      onClick={() => handleFacilityToggle(fac)}
                    >
                      <span className="app-modal__facility-check">{isChecked ? '✓' : '+'}</span>
                      <span>{fac}</span>
                    </button>
                  );
                })}
              </div>

              <div className="app-modal__field app-modal__field--full" style={{ marginTop: '16px' }}>
                <label>Additional Services / Special Amenities</label>
                <input
                  type="text"
                  name="additionalServicesNotes"
                  placeholder="e.g. Private boat hire on Ethiope River, complimentary buffet breakfast, live acoustic weekends"
                  value={formData.additionalServicesNotes}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ── Section F: Verification Documents ── */}
            <div className="app-modal__section">
              <div className="app-modal__section-header">
                <FileText size={18} className="app-modal__section-icon" />
                <h3>F. Verification Documents</h3>
              </div>
              <p className="app-modal__section-hint">
                Attach available documentation to expedite verification. If any document is unavailable or not applicable, you may leave it blank.
              </p>
              <div className="app-modal__docs-grid">
                <div className="app-modal__doc-card">
                  <div className="app-modal__doc-meta">
                    <strong>1. Business Registration / CAC</strong>
                    <span>Certificate of Incorporation or Business Name</span>
                  </div>
                  <label className="app-modal__file-label">
                    <Upload size={14} />
                    <span>{formData.businessRegDoc ? 'Document Attached' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload('businessRegDoc', e.target.files[0])}
                    />
                  </label>
                </div>

                <div className="app-modal__doc-card">
                  <div className="app-modal__doc-meta">
                    <strong>2. Operating / Tourism Permit</strong>
                    <span>Delta State Hospitality Board or Ministry Permit</span>
                  </div>
                  <label className="app-modal__file-label">
                    <Upload size={14} />
                    <span>{formData.operatingPermitDoc ? 'Document Attached' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload('operatingPermitDoc', e.target.files[0])}
                    />
                  </label>
                </div>

                <div className="app-modal__doc-card">
                  <div className="app-modal__doc-meta">
                    <strong>3. Fire Safety Inspection Clearance</strong>
                    <span>Fire Service inspection or compliance report</span>
                  </div>
                  <label className="app-modal__file-label">
                    <Upload size={14} />
                    <span>{formData.fireSafetyDoc ? 'Document Attached' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload('fireSafetyDoc', e.target.files[0])}
                    />
                  </label>
                </div>

                <div className="app-modal__doc-card">
                  <div className="app-modal__doc-meta">
                    <strong>4. Proof of Ownership or Agency</strong>
                    <span>C of O, Lease Agreement, or Letter of Representation</span>
                  </div>
                  <label className="app-modal__file-label">
                    <Upload size={14} />
                    <span>{formData.proofOfOwnershipDoc ? 'Document Attached' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload('proofOfOwnershipDoc', e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* ── Section G: Declaration and Submission ── */}
            <div className="app-modal__section app-modal__section--declaration">
              <div className="app-modal__section-header">
                <ShieldCheck size={18} className="app-modal__section-icon" />
                <h3>G. Declaration & Authorization</h3>
              </div>
              <div className="app-modal__declaration-box">
                <label className="app-modal__checkbox-container">
                  <input
                    type="checkbox"
                    name="declarationAgreed"
                    checked={formData.declarationAgreed}
                    onChange={handleChange}
                  />
                  <span>
                    I solemnly declare that all information, contact details, and certifications submitted in this application are accurate and truthful. I acknowledge that Lodgekeys conducts periodic quality checks and reserves the right to decline or suspend listings with falsified records. *
                  </span>
                </label>
                {errors.declarationAgreed && (
                  <span className="app-modal__error-text">{errors.declarationAgreed}</span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="app-modal__foot">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-gold app-modal__submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="app-modal__spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application for Review</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
