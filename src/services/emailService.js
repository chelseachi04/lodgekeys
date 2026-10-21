/**
 * Lodgekeys — Transactional Email & Notification Service (Secure Server-Side Architecture)
 * 
 * Security Architecture:
 * 1. ZERO client-side provider secrets. No API keys are bundled or exposed in Vite.
 * 2. Real email delivery is handled by the server-side Supabase Edge Function (`send-application-email`)
 *    or a configured secure server endpoint (`VITE_EMAIL_ENDPOINT`).
 * 3. The server function verifies the caller's JWT, validates admin permissions, and checks the
 *    database application status before dispatching email messages.
 * 4. Never simulates email delivery. If the server function or provider is unconfigured,
 *    transparently logs status and reports { delivered: false }.
 * 5. Failures are non-fatal: errors never delete or roll back submitted applications.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const EMAIL_ENDPOINT = (import.meta.env.VITE_EMAIL_ENDPOINT || '').trim();

export const isEmailConfigured = Boolean(isSupabaseConfigured || EMAIL_ENDPOINT);

export const emailService = {
  isConfigured() {
    return isEmailConfigured;
  },

  /**
   * Invokes the secure server-side Edge Function or proxy endpoint.
   */
  async invokeServerEmail({ action, applicationId, toEmail, recipientName, hotelName, referenceNumber, reason }) {
    if (!applicationId && !toEmail) {
      return { success: false, delivered: false, error: 'Recipient or application ID required.' };
    }

    try {
      // 1. Try Supabase Edge Function if Supabase is connected
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.functions.invoke('send-application-email', {
          body: { action, applicationId, reason, toEmail, recipientName, hotelName, referenceNumber },
        });

        if (error) {
          console.warn('[Email Service Notice] Edge Function execution returned:', error.message);
          return {
            success: false,
            delivered: false,
            reason: error.message || 'Server Edge Function returned an error.',
          };
        }

        if (data && data.delivered) {
          return { success: true, delivered: true, messageId: data.messageId };
        }

        return {
          success: false,
          delivered: false,
          reason: data?.reason || data?.error || 'Email provider not configured on server.',
        };
      }

      // 2. Custom backend endpoint fallback if configured
      if (EMAIL_ENDPOINT) {
        const response = await fetch(EMAIL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, applicationId, toEmail, recipientName, hotelName, referenceNumber, reason }),
        });

        const data = await response.json();
        return { success: response.ok, delivered: Boolean(data?.delivered), ...data };
      }

      // 3. Unconfigured environment notice
      console.info(
        `[Email Notification Info] Email server is not configured. Target: ${toEmail || applicationId}, Action: "${action}". In-app notification recorded in database.`
      );
      return {
        success: false,
        delivered: false,
        reason: 'Email service is not configured. Real email delivery skipped; in-app notification recorded.',
      };
    } catch (err) {
      console.warn('[Email Service] Email delivery call failed non-fatally:', err.message);
      return {
        success: false,
        delivered: false,
        error: err.message,
      };
    }
  },

  /**
   * 1. Application Received Acknowledgement
   */
  async sendApplicationSubmittedEmail(params) {
    const to = params.to || params.toEmail;
    const applicantName = params.applicantName || params.recipientName;
    const hotelName = params.hotelName;
    const referenceCode = params.referenceCode || params.referenceNumber;
    const applicationId = params.applicationId || params.id;

    return this.invokeServerEmail({
      action: 'application_submitted',
      applicationId,
      toEmail: to,
      recipientName: applicantName,
      hotelName,
      referenceNumber: referenceCode,
    });
  },

  async sendApplicationReceivedEmail(params) {
    return this.sendApplicationSubmittedEmail(params);
  },

  /**
   * 2. Application Approved Notification
   */
  async sendApplicationApprovedEmail(params) {
    const to = params.to || params.toEmail;
    const applicantName = params.applicantName || params.recipientName;
    const hotelName = params.hotelName;
    const applicationId = params.applicationId || params.id;

    return this.invokeServerEmail({
      action: 'application_approved',
      applicationId,
      toEmail: to,
      recipientName: applicantName,
      hotelName,
    });
  },

  /**
   * 3. Application Declined Notification
   */
  async sendApplicationRejectedEmail(params) {
    const to = params.to || params.toEmail;
    const applicantName = params.applicantName || params.recipientName;
    const hotelName = params.hotelName;
    const applicationId = params.applicationId || params.id;
    const reason = params.reason;

    return this.invokeServerEmail({
      action: 'application_rejected',
      applicationId,
      toEmail: to,
      recipientName: applicantName,
      hotelName,
      reason,
    });
  },
};
