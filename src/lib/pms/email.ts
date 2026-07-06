/**
 * Renders the standardized application payload as an HTML summary for the
 * email delivery channel (used when a property has no direct PMS connection,
 * or the PMS submission fails).
 */

import type { StandardApplication } from "./types";

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

export function renderApplicationHtml(app: StandardApplication): string {
  const sectionStyle = "margin-bottom: 20px;";
  const headerStyle =
    "font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb;";
  const rowStyle =
    "display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;";
  const labelStyle = "color: #6b7280;";
  const valueStyle = "color: #111827; font-weight: 500;";
  const verifiedBadge =
    '<span style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:4px;color:#166534;font-size:11px;padding:1px 6px;margin-left:6px;">Verified</span>';

  const field = (label: string, value?: string | number | null, verified = false) => {
    if (value === undefined || value === null || value === "") return "";
    return `<div style="${rowStyle}"><span style="${labelStyle}">${esc(label)}</span><span style="${valueStyle}">${esc(String(value))}${verified ? verifiedBadge : ""}</span></div>`;
  };

  let html = "";

  // Personal
  html += `<div style="${sectionStyle}"><h4 style="${headerStyle}">Personal Information${app.applicant.verifiedRenter ? verifiedBadge : ""}</h4>`;
  html += field("Full Name", `${app.applicant.firstName} ${app.applicant.lastName}`.trim());
  html += field("Email", app.applicant.email);
  html += field("Phone", app.applicant.phone);
  html += field("Date of Birth", app.applicant.dateOfBirth);
  if (app.applicant.currentAddress) {
    const a = app.applicant.currentAddress;
    html += field("Current Address", `${a.street}, ${a.city}, ${a.state} ${a.zipCode}`);
  }
  html += `</div>`;

  // Employment & income
  if (app.employment.employer || app.employment.history.length > 0) {
    html += `<div style="${sectionStyle}"><h4 style="${headerStyle}">Employment &amp; Income</h4>`;
    html += field("Employer", app.employment.employer, app.employment.verified);
    html += field("Position", app.employment.position);
    if (app.employment.annualIncome) {
      html += field(
        "Annual Income",
        `$${app.employment.annualIncome.toLocaleString()}`,
        app.employment.verified
      );
    }
    for (const job of app.employment.history) {
      if (job.employerName === app.employment.employer) continue;
      html += field(
        `${job.jobTitle} — ${job.employerName}`,
        `${job.startDate}${job.endDate ? ` to ${job.endDate}` : " (current)"}`,
        job.verified
      );
    }
    for (const s of app.incomeSources) {
      html += field(
        `${s.type || "Income"} (${s.source || "source"})`,
        s.amount ? `$${s.amount}/mo` : undefined
      );
    }
    html += `</div>`;
  }

  // Rental history
  if (app.residenceHistory.length > 0) {
    html += `<div style="${sectionStyle}"><h4 style="${headerStyle}">Rental History</h4>`;
    for (const r of app.residenceHistory) {
      const payments =
        r.onTimePayments + r.latePayments > 0
          ? ` — ${r.onTimePayments} on-time / ${r.latePayments} late payments`
          : "";
      html += field(
        `${r.address}, ${r.city}, ${r.state}`,
        `$${r.monthlyRent}/mo, ${r.moveInDate}${r.moveOutDate ? ` to ${r.moveOutDate}` : " (current)"}${payments}`,
        r.verified
      );
      if (r.landlordName) {
        html += field(
          "  Landlord",
          `${r.landlordName}${r.landlordContact ? ` · ${r.landlordContact}` : ""}`
        );
      }
    }
    html += `</div>`;
  }

  // Household
  const { coApplicants, occupants, vehicles } = app.household;
  if (coApplicants.length || occupants.length || vehicles.length) {
    html += `<div style="${sectionStyle}"><h4 style="${headerStyle}">Household</h4>`;
    for (const c of coApplicants) html += field(`Co-applicant: ${c.name}`, c.email || c.phone || "—");
    for (const o of occupants) html += field(`Occupant: ${o.name}`, o.relationship || "—");
    for (const v of vehicles)
      html += field(
        `Vehicle: ${[v.year, v.make, v.model].filter(Boolean).join(" ")}`,
        [v.color, v.license, v.state].filter(Boolean).join(" · ") || "—"
      );
    html += `</div>`;
  }

  // Verification summary
  const checks = [
    app.applicant.verifiedRenter ? "Identity verified (HomeU Verified Renter)" : null,
    app.financial.incomeVerified
      ? `Income verified${app.financial.verificationMethod ? ` via ${app.financial.verificationMethod}` : ""}`
      : null,
    app.financial.bankLinked ? "Bank account linked" : null,
  ].filter(Boolean);
  html += `<div style="${sectionStyle}"><h4 style="${headerStyle}">Verification</h4>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;font-size:13px;color:#166534;">
      ${checks.length ? checks.map((c) => `✓ ${esc(c!)}`).join("<br/>") : "Submitted through HomeU; verification data available on request."}
    </div></div>`;

  return html;
}
