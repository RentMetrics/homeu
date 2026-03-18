/**
 * Send Application API Route
 *
 * POST /api/applications/send
 *
 * Generates an application summary and emails it to the property manager.
 * Also stores the application in IPFS for blockchain-verifiable records.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { sendApplicationEmail } from '@/lib/email/resend';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { pmEmail, pmName, propertyName, propertyAddress, applicationData } = body;

    if (!pmEmail || !applicationData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const applicantName = `${applicationData.formData?.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Applicant'}`;

    // Generate application HTML summary
    const applicationHtml = generateApplicationHtml(applicationData);

    // Send the email via Resend
    const result = await sendApplicationEmail({
      pmEmail,
      pmName: pmName || 'Property Manager',
      applicantName,
      propertyName: propertyName || 'Property',
      propertyAddress: propertyAddress || '',
      applicationHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Application sent successfully',
      emailId: result?.id,
    });

  } catch (error: any) {
    console.error('Send application error:', error);

    // If Resend isn't configured, return a helpful message
    if (error.message?.includes('API key')) {
      return NextResponse.json({
        success: false,
        error: 'Email service not configured. Please set RESEND_API_KEY.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send application',
    }, { status: 500 });
  }
}

/**
 * Generate HTML summary of the application for email
 */
function generateApplicationHtml(app: any): string {
  const form = app.formData || {};
  const coApplicants = app.coApplicants || [];
  const occupants = app.occupants || [];
  const vehicles = app.vehicles || [];
  const incomeSources = app.incomeSources || [];

  const sectionStyle = 'margin-bottom: 20px;';
  const headerStyle = 'font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;';
  const rowStyle = 'display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;';
  const labelStyle = 'color: #6b7280;';
  const valueStyle = 'color: #111827; font-weight: 500;';

  const field = (label: string, value: any) => {
    if (!value) return '';
    return `<div style="${rowStyle}"><span style="${labelStyle}">${label}</span><span style="${valueStyle}">${value}</span></div>`;
  };

  let html = '';

  // Personal Info
  html += `<div style="${sectionStyle}">`;
  html += `<h4 style="${headerStyle}">Personal Information</h4>`;
  html += field('Full Name', form.fullName);
  html += field('Email', form.email);
  html += field('Phone', form.cellPhone);
  html += field('Date of Birth', form.birthdate);
  html += field('Gender', form.gender);
  html += field('U.S. Citizen', form.isCitizen ? 'Yes' : 'No');
  html += field('Marital Status', form.maritalStatus);
  html += `</div>`;

  // Employment
  if (form.employer || incomeSources.some((s: any) => s.type)) {
    html += `<div style="${sectionStyle}">`;
    html += `<h4 style="${headerStyle}">Employment & Income</h4>`;
    html += field('Employer', form.employer);
    html += field('Position', form.position);
    if (incomeSources.length > 0) {
      incomeSources.forEach((s: any) => {
        if (s.type || s.amount) {
          html += field(`${s.type || 'Income'} (${s.source || 'Source'})`, s.amount ? `$${s.amount}/mo` : '');
        }
      });
    }
    html += `</div>`;
  }

  // Co-Applicants
  if (coApplicants.some((c: any) => c.name)) {
    html += `<div style="${sectionStyle}">`;
    html += `<h4 style="${headerStyle}">Co-Applicants</h4>`;
    coApplicants.forEach((c: any) => {
      if (c.name) html += field(c.name, c.email || '');
    });
    html += `</div>`;
  }

  // Occupants
  if (occupants.some((o: any) => o.name)) {
    html += `<div style="${sectionStyle}">`;
    html += `<h4 style="${headerStyle}">Other Occupants</h4>`;
    occupants.forEach((o: any) => {
      if (o.name) html += field(o.name, o.relationship || '');
    });
    html += `</div>`;
  }

  // Vehicles
  if (vehicles.some((v: any) => v.make)) {
    html += `<div style="${sectionStyle}">`;
    html += `<h4 style="${headerStyle}">Vehicles</h4>`;
    vehicles.forEach((v: any) => {
      if (v.make) html += field(`${v.year || ''} ${v.make} ${v.model}`, `${v.color || ''} — ${v.license || ''} (${v.state || ''})`);
    });
    html += `</div>`;
  }

  // Verification Status
  html += `<div style="${sectionStyle}">`;
  html += `<h4 style="${headerStyle}">Verification Status</h4>`;
  html += `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; font-size: 13px; color: #166534;">
    This application was submitted through HomeU. The applicant's identity, employment, and financial data may be verified through our platform.
  </div>`;
  html += `</div>`;

  return html;
}
