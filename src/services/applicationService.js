import { STORAGE_KEYS } from './storageKeys';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { emailService } from './emailService';

export const applicationService = {
  /**
   * Fetch all hotel applications.
   * If Supabase is configured and caller has access, queries public.hotel_applications.
   * Falls back to localStorage cache if network is unavailable.
   */
  async getApplicationsAsync() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('hotel_applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Normalize DB columns to frontend expected model
          const normalized = data.map((item) => ({
            id: item.id,
            referenceNumber: item.reference_code || item.reference_number || item.id,
            name: item.name,
            slug: item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '',
            ownerName: item.owner_name,
            applicantRole: item.applicant_role || 'owner',
            applicantUserId: item.applicant_user_id,
            contactEmail: item.contact_email,
            contactPhone: item.contact_phone,
            alternativePhone: item.alternative_phone || '',
            preferredContactMethod: item.preferred_contact_method || 'email',
            area: item.area,
            address: item.address,
            nearbyLandmark: item.nearby_landmark || '',
            googleMapsUrl: item.google_maps_url || '',
            locationNotes: item.location_notes || '',
            category: item.category,
            yearEstablished: item.year_established || '',
            businessRegStatus: item.business_reg_status || 'unregistered',
            businessRegNumber: item.business_reg_number || '',
            website: item.website || '',
            startingRate: Number(item.starting_rate) || 0,
            totalRooms: Number(item.total_rooms) || 1,
            roomTypesOverview: item.room_types_overview || '',
            facilities: item.facilities || [],
            additionalServicesNotes: item.additional_services_notes || '',
            documents: item.verification_documents ? JSON.stringify(item.verification_documents) : '',
            businessRegDoc: item.business_reg_doc,
            operatingPermitDoc: item.operating_permit_doc,
            fireSafetyDoc: item.fire_safety_doc,
            proofOfOwnershipDoc: item.proof_of_ownership_doc,
            description: item.description,
            status: item.status || 'pending',
            submittedAt: item.created_at,
            reviewedAt: item.reviewed_at,
            reviewedBy: item.reviewed_by,
            feedback: item.feedback || '',
            createdHotelId: item.created_hotel_id,
          }));

          // Cache in local storage for fast offline resilience
          try {
            localStorage.setItem(STORAGE_KEYS.ADMIN_APPLICATIONS, JSON.stringify(normalized));
          } catch { /* noop */ }

          return normalized;
        } else if (error) {
          console.warn('Supabase hotel_applications query warning:', error.message);
        }
      } catch (err) {
        console.warn('getApplicationsAsync network error, using cached storage:', err);
      }
    }

    return this.getApplications();
  },

  /**
   * Synchronous fallback getter
   */
  getApplications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_APPLICATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Submit a new hotel listing application.
   * Persists directly to Supabase public.hotel_applications and triggers email acknowledgment.
   */
  async submitApplicationAsync(formData, authenticatedUser = null) {
    if (!formData.name?.trim()) throw new Error('Hotel name is required.');
    if (!formData.ownerName?.trim()) throw new Error('Applicant full name is required.');
    if (!formData.contactEmail?.trim()) throw new Error('Contact email is required.');
    if (!formData.contactPhone?.trim()) throw new Error('Contact phone is required.');

    // Generate unique persistent application reference: APP-YYYY-XXXX
    const year = new Date().getFullYear();
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const referenceNumber = `APP-${year}-${code}`;

    const applicantUserId = authenticatedUser?.id || null;
    const contactEmail = (formData.contactEmail || authenticatedUser?.email || '').trim().toLowerCase();
    const derivedSlug = (formData.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `hotel-app-${Date.now()}`;

    const recordToInsert = {
      reference_code: referenceNumber,
      reference_number: referenceNumber,
      slug: derivedSlug,
      applicant_user_id: applicantUserId,
      name: formData.name.trim(),
      owner_name: formData.ownerName.trim(),
      applicant_role: formData.applicantRole || 'owner',
      contact_email: contactEmail,
      contact_phone: formData.contactPhone.trim(),
      alternative_phone: formData.alternativePhone?.trim() || null,
      preferred_contact_method: formData.preferredContactMethod || 'email',
      is_authorized: Boolean(formData.isAuthorized ?? true),
      area: formData.area || 'Town Centre',
      address: formData.address?.trim() || `${formData.name.trim()}, ${formData.area || 'Town Centre'}, Abraka`,
      nearby_landmark: formData.nearbyLandmark?.trim() || null,
      google_maps_url: formData.googleMapsUrl?.trim() || null,
      location_notes: formData.locationNotes?.trim() || null,
      category: formData.category || 'Hotel',
      year_established: formData.yearEstablished?.trim() || null,
      business_reg_status: formData.businessRegStatus || 'unregistered',
      business_reg_number: formData.businessRegNumber?.trim() || null,
      website: formData.website?.trim() || null,
      starting_rate: Number(formData.startingRate) || 35000,
      total_rooms: Number(formData.totalRooms) || 5,
      room_types_overview: formData.roomTypesOverview?.trim() || null,
      facilities: Array.isArray(formData.facilities) ? formData.facilities : [],
      additional_services_notes: formData.additionalServicesNotes?.trim() || null,
      business_reg_doc: formData.businessRegDoc || null,
      operating_permit_doc: formData.operatingPermitDoc || null,
      fire_safety_doc: formData.fireSafetyDoc || null,
      proof_of_ownership_doc: formData.proofOfOwnershipDoc || null,
      description: formData.description?.trim() || 'A quality hospitality property in Abraka.',
      declaration_agreed: Boolean(formData.declarationAgreed ?? true),
      status: 'pending',
    };

    let savedRecord = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('hotel_applications')
        .insert(recordToInsert)
        .select('*')
        .single();

      if (error) {
        console.error('Failed to insert hotel application into Supabase:', error);
        throw new Error(error.message || 'Database error: Could not save application.');
      }
      savedRecord = data;
    } else {
      // Local fallback with simulated UUID
      savedRecord = {
        id: `local-app-${Date.now()}`,
        ...recordToInsert,
        created_at: new Date().toISOString(),
      };
    }

    // Normalized application object for state
    const normalizedApp = {
      id: savedRecord.id,
      referenceNumber: savedRecord.reference_number || referenceNumber,
      name: savedRecord.name,
      ownerName: savedRecord.owner_name,
      applicantRole: savedRecord.applicant_role,
      applicantUserId: savedRecord.applicant_user_id,
      contactEmail: savedRecord.contact_email,
      contactPhone: savedRecord.contact_phone,
      alternativePhone: savedRecord.alternative_phone,
      preferredContactMethod: savedRecord.preferred_contact_method,
      area: savedRecord.area,
      address: savedRecord.address,
      nearbyLandmark: savedRecord.nearby_landmark,
      googleMapsUrl: savedRecord.google_maps_url,
      locationNotes: savedRecord.location_notes,
      category: savedRecord.category,
      yearEstablished: savedRecord.year_established,
      businessRegStatus: savedRecord.business_reg_status,
      businessRegNumber: savedRecord.business_reg_number,
      website: savedRecord.website,
      startingRate: Number(savedRecord.starting_rate),
      totalRooms: Number(savedRecord.total_rooms),
      roomTypesOverview: savedRecord.room_types_overview,
      facilities: savedRecord.facilities || [],
      additionalServicesNotes: savedRecord.additional_services_notes,
      businessRegDoc: savedRecord.business_reg_doc,
      operatingPermitDoc: savedRecord.operating_permit_doc,
      fireSafetyDoc: savedRecord.fire_safety_doc,
      proofOfOwnershipDoc: savedRecord.proof_of_ownership_doc,
      description: savedRecord.description,
      status: savedRecord.status || 'pending',
      submittedAt: savedRecord.created_at,
      feedback: savedRecord.feedback || '',
    };

    // Update local cache
    const current = this.getApplications();
    const updated = [normalizedApp, ...current.filter((a) => a.id !== normalizedApp.id)];
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_APPLICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch { /* noop */ }

    // Trigger acknowledgement email (async, non-blocking)
    emailService.sendApplicationSubmittedEmail({
      applicationId: normalizedApp.id,
      toEmail: normalizedApp.contactEmail,
      recipientName: normalizedApp.ownerName,
      hotelName: normalizedApp.name,
      referenceNumber: normalizedApp.referenceNumber,
    }).catch((e) => console.warn('Email acknowledgment error:', e));

    return normalizedApp;
  },

  /**
   * Approve a hotel application atomically.
   * Calls the database procedure `approve_hotel_application` to create hotel and assign manager.
   */
  async approveApplicationAsync(applicationId, adminFeedback = '') {
    if (!applicationId) throw new Error('Application ID is required.');

    let result = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('approve_hotel_application', {
        p_application_id: applicationId,
        p_admin_feedback: adminFeedback || 'Approved and published to Lodgekeys catalog.',
      });

      if (error) {
        console.error('approve_hotel_application RPC failed:', error);
        throw new Error(error.message || 'Server error approving application.');
      }
      result = data;
    } else {
      result = {
        success: true,
        message: 'Application approved (offline mode).',
        hotelId: `local-hotel-${Date.now()}`,
        status: 'approved',
      };
    }

    // Refresh application status in local cache
    const current = this.getApplications();
    const target = current.find((a) => a.id === applicationId);
    const updated = current.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status: 'approved',
            reviewedAt: new Date().toISOString(),
            feedback: adminFeedback,
            createdHotelId: result?.hotelId || a.createdHotelId,
          }
        : a
    );
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_APPLICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch { /* noop */ }

    // Send Approval Email
    if (target) {
      emailService.sendApplicationApprovedEmail({
        applicationId,
        toEmail: target.contactEmail,
        recipientName: target.ownerName,
        hotelName: target.name,
        managerDashboardUrl: `${window.location.origin}/manager/dashboard`,
      }).catch((e) => console.warn('Email notification error:', e));
    }

    return result;
  },

  /**
   * Reject a hotel application atomically.
   */
  async rejectApplicationAsync(applicationId, reason = '') {
    if (!applicationId) throw new Error('Application ID is required.');

    let result = null;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('reject_hotel_application', {
        p_application_id: applicationId,
        p_reason: reason || 'Application requirements not met at this time.',
      });

      if (error) {
        console.error('reject_hotel_application RPC failed:', error);
        throw new Error(error.message || 'Server error rejecting application.');
      }
      result = data;
    } else {
      result = {
        success: true,
        message: 'Application declined (offline mode).',
        status: 'declined',
      };
    }

    // Refresh cache
    const current = this.getApplications();
    const target = current.find((a) => a.id === applicationId);
    const updated = current.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status: 'declined',
            reviewedAt: new Date().toISOString(),
            feedback: reason,
          }
        : a
    );
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_APPLICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch { /* noop */ }

    // Send Rejection Email
    if (target) {
      emailService.sendApplicationRejectedEmail({
        applicationId,
        toEmail: target.contactEmail,
        recipientName: target.ownerName,
        hotelName: target.name,
        reason,
      }).catch((e) => console.warn('Email notification error:', e));
    }

    return result;
  },

  /**
   * Legacy sync adapter
   */
  submitApplication(formData) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ref = `APP-${year}-${randomSuffix}`;
    const newApp = {
      id: ref,
      referenceNumber: ref,
      name: formData.name.trim(),
      ownerName: formData.ownerName.trim(),
      contactEmail: formData.contactEmail.trim().toLowerCase(),
      contactPhone: formData.contactPhone.trim(),
      area: formData.area || 'Town Centre',
      address: formData.address?.trim() || `${formData.name}, Abraka`,
      category: formData.category || 'Hotel',
      startingRate: Number(formData.startingRate) || 40000,
      totalRooms: Number(formData.totalRooms) || 10,
      description: formData.description?.trim() || '',
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    const current = this.getApplications();
    const updated = [newApp, ...current];
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_APPLICATIONS, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch { /* noop */ }
    return newApp;
  },
};
