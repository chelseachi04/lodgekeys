/**
 * Supabase Edge Function: send-application-email
 * 
 * Secure Server-Side Email Delivery Engine for Lodgekeys
 * 
 * Security Guarantees:
 * 1. RESEND_API_KEY is stored STRICTLY in server-side environment secrets (never exposed to browser bundles).
 * 2. Authenticates the caller via Supabase JWT (Authorization: Bearer <token>).
 * 3. Enforces authorization:
 *    - Submission confirmation: Caller must be the applicant or admin.
 *    - Approval notification: Caller must be an admin, AND application.status in DB must actually be 'approved'.
 *    - Rejection notification: Caller must be an admin, AND application.status in DB must actually be 'declined'.
 * 4. Never exposes secrets or unnecessary PII in logs.
 * 5. Handles failures gracefully without rolling back database transactions.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'Lodgekeys Abraka <notifications@lodgekeys.com>';

    // 1. Verify User Session from Authorization Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client with caller's JWT to authenticate user
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired user session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service-role client for privileged database verification
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Read caller's profile role
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';

    // 2. Parse and Validate Request Payload
    const body = await req.json();
    const { action, applicationId, reason } = body;

    if (!action || !applicationId) {
      return new Response(
        JSON.stringify({ error: 'action and applicationId are required fields.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch Application Record from PostgreSQL
    const { data: app, error: appError } = await adminClient
      .from('hotel_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle();

    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: 'Application record not found in database.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Authorize & Verify State Before Dispatching Email
    let subject = '';
    let html = '';
    let text = '';

    if (action === 'application_submitted') {
      // Must be the applicant or admin
      const isApplicant = app.applicant_user_id === user.id || app.contact_email?.toLowerCase() === user.email?.toLowerCase();
      if (!isApplicant && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You are not authorized to trigger notifications for this application.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refCode = app.reference_code || app.reference_number || app.id;
      subject = `Application Received: ${app.name} [${refCode}]`;
      text = `Hello ${app.owner_name},\n\nThank you for submitting "${app.name}" to join Lodgekeys in Abraka.\n\nYour application reference is: ${refCode}.\nOur verification team will review your property documentation within an estimated 24–48 hours.\n\nWarm regards,\nThe Lodgekeys Team`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #996515;">Application Received</h2>
          <p>Hello <strong>${app.owner_name}</strong>,</p>
          <p>Thank you for submitting <strong>${app.name}</strong> to join the Lodgekeys curated stay network in Abraka, Delta State.</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">APPLICATION REFERENCE</p>
            <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #0f172a;">${refCode}</p>
          </div>
          <p>Our administrator verification desk will review your property details, operational permits, and accommodation capacity within an estimated <strong>24 to 48 hours</strong>.</p>
          <p style="color: #64748b; font-size: 13px;">This is an automated confirmation from the Lodgekeys Platform.</p>
        </div>
      `;
    } else if (action === 'application_approved') {
      // Only platform admins can send approval emails, AND database status must be 'approved'
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Only administrators can dispatch approval notifications.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (app.status !== 'approved') {
        return new Response(
          JSON.stringify({ error: `State mismatch: Application status is "${app.status}", not "approved". Email blocked.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      subject = `Congratulations! ${app.name} is Approved on Lodgekeys`;
      text = `Hello ${app.owner_name},\n\nWe are pleased to inform you that "${app.name}" has been approved for listing on Lodgekeys in Abraka.\n\nYou can now sign in to your manager portal to set up your room categories, pricing, and individual room inventory.\n\nWarm regards,\nThe Lodgekeys Team`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #15803d;">Listing Application Approved</h2>
          <p>Hello <strong>${app.owner_name}</strong>,</p>
          <p>We are delighted to confirm that <strong>${app.name}</strong> has been approved for listing on Lodgekeys!</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-weight: bold;">Property Verified & Provisioned</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #15803d;">Your hotel manager access is now active. Please sign in to configure your room categories, pricing, and individual physical rooms.</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Warm regards,<br />Lodgekeys Abraka Concierge</p>
        </div>
      `;
    } else if (action === 'application_rejected') {
      // Only platform admins can send rejection emails, AND database status must be 'declined'
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Only administrators can dispatch rejection notifications.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (app.status !== 'declined') {
        return new Response(
          JSON.stringify({ error: `State mismatch: Application status is "${app.status}", not "declined". Email blocked.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const feedbackNote = reason || app.feedback || 'The application does not meet current verification standards or required operating documentation.';
      subject = `Update regarding your listing application for ${app.name}`;
      text = `Hello ${app.owner_name},\n\nThank you for your interest in listing "${app.name}" on Lodgekeys.\n\nAfter reviewing your submission, our team is unable to approve the listing at this time.\nFeedback: ${feedbackNote}\n\nWarm regards,\nThe Lodgekeys Team`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #b91c1c;">Listing Application Update</h2>
          <p>Hello <strong>${app.owner_name}</strong>,</p>
          <p>Thank you for submitting <strong>${app.name}</strong> for consideration on Lodgekeys.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">Assessment Outcome</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #b91c1c;">${feedbackNote}</p>
          </div>
          <p>You may submit an updated application once required documentation is in order.</p>
          <p style="color: #64748b; font-size: 13px;">Warm regards,<br />Lodgekeys Team</p>
        </div>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported email action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check if Server-Side Email Provider is Configured
    if (!resendApiKey) {
      console.info(`[Email Function Notice] RESEND_API_KEY is not configured in Supabase Secrets. Real email skipped for application ${applicationId}.`);
      return new Response(
        JSON.stringify({
          success: false,
          delivered: false,
          reason: 'Server email provider (RESEND_API_KEY) is not configured in Supabase Secrets. In-app notification recorded.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Secure Server-Side Dispatch to Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [app.contact_email],
        subject,
        html,
        text,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.warn(`Resend API rejected message: ${resendData.message || resendResponse.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          delivered: false,
          error: resendData.message || 'Provider rejected email transmission.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Audit Log Entry for Email Delivery
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: isAdmin ? 'admin' : 'applicant',
      action_type: 'EMAIL_DISPATCHED',
      target_entity: 'hotel_applications',
      target_id: applicationId,
      metadata: {
        action,
        recipient: app.contact_email,
        messageId: resendData.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        delivered: true,
        messageId: resendData.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('send-application-email unhandled error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
