/**
 * Resend Email Client for HomeU
 *
 * Handles all transactional emails:
 * - Application PDF sent to property managers
 * - PM onboarding outreach
 * - Payment confirmations
 * - Notification emails
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'HomeU <noreply@homeu.co>';
const SUPPORT_EMAIL = 'support@homeu.co';

interface SendApplicationEmailParams {
  pmEmail: string;
  pmName: string;
  applicantName: string;
  propertyName: string;
  propertyAddress: string;
  applicationHtml: string;
  pdfBuffer?: Buffer;
}

/**
 * Send a rental application to a property manager
 */
export async function sendApplicationEmail(params: SendApplicationEmailParams) {
  const { pmEmail, pmName, applicantName, propertyName, propertyAddress, applicationHtml, pdfBuffer } = params;

  const attachments = pdfBuffer
    ? [{
        filename: `${applicantName.replace(/\s+/g, '_')}_Application.pdf`,
        content: pdfBuffer,
      }]
    : [];

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: pmEmail,
    subject: `New Rental Application — ${applicantName} for ${propertyName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">New Rental Application</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">via HomeU Platform</p>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151; font-size: 15px;">Hi ${pmName || 'Property Manager'},</p>
          <p style="color: #374151; font-size: 15px;">
            <strong>${applicantName}</strong> has submitted a rental application for:
          </p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; margin: 0;">${propertyName}</p>
            <p style="color: #6b7280; margin: 4px 0 0; font-size: 14px;">${propertyAddress}</p>
          </div>
          ${pdfBuffer ? '<p style="color: #374151; font-size: 14px;">The full application is attached as a PDF.</p>' : ''}
          <div style="margin-top: 16px;">
            <h3 style="font-size: 14px; color: #374151; margin-bottom: 12px;">Application Summary</h3>
            ${applicationHtml}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            This application was submitted through <a href="https://www.homeu.co" style="color: #059669;">HomeU</a>.
            To manage applications and set up rent collection, visit <a href="https://www.homeu.co/property-manager/dashboard" style="color: #059669;">your PM dashboard</a>.
          </p>
        </div>
      </div>
    `,
    attachments,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

interface SendPmOutreachEmailParams {
  pmEmail: string;
  pmName: string;
  renterName: string;
  propertyName: string;
  propertyAddress: string;
}

/**
 * Send an outreach email to a PM whose resident wants to pay through HomeU
 */
export async function sendPmOutreachEmail(params: SendPmOutreachEmailParams) {
  const { pmEmail, pmName, renterName, propertyName, propertyAddress } = params;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: pmEmail,
    subject: `${renterName} wants to pay rent through HomeU — ${propertyName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Your Resident Wants to Pay Through HomeU</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151; font-size: 15px;">Hi ${pmName || 'Property Manager'},</p>
          <p style="color: #374151; font-size: 15px;">
            <strong>${renterName}</strong>, a resident at <strong>${propertyName}</strong>, has signed up for HomeU and wants to pay rent through our platform.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; font-size: 14px; color: #166534;">What HomeU offers property managers:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px;">
              <li>Automated rent collection via ACH — funds deposited directly to your bank</li>
              <li>Reduced late payments with auto-pay and reminders</li>
              <li>No cost to you — the resident covers the platform fee</li>
              <li>Dashboard to track all payments and residents</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://www.homeu.co/property-manager/login" style="display: inline-block; background: #059669; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Set Up Your Account
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">
            Property: ${propertyName}<br/>
            Address: ${propertyAddress}<br/>
            Resident: ${renterName}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            Questions? Reply to this email or contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #059669;">${SUPPORT_EMAIL}</a>.
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('Resend PM outreach error:', error);
    throw new Error(`Failed to send PM outreach: ${error.message}`);
  }

  return data;
}
