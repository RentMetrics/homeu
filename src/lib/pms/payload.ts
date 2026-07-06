/**
 * Builds the standardized application payload from the renter's HomeU data
 * (the "application bundle" returned by convex/pms.getApplicationBundle).
 */

import type { ApplicationSection, StandardApplication } from "./types";

interface ApplicationBundle {
  renter: any | null;
  savedApplication: any | null;
  rentalHistory: any[];
  employmentHistory: any[];
}

interface PropertyInfo {
  propertyId?: string;
  propertyName: string;
  address?: string;
  unitNumber?: string;
}

export interface BuildResult {
  application: StandardApplication;
  sectionsIncluded: ApplicationSection[];
  missingSections: ApplicationSection[];
}

const toIsoDate = (ms?: number) =>
  ms ? new Date(ms).toISOString().slice(0, 10) : undefined;

export function buildStandardApplication(
  bundle: ApplicationBundle,
  property: PropertyInfo,
  clerkUser: { firstName?: string | null; lastName?: string | null; email?: string }
): BuildResult {
  const { renter, savedApplication, rentalHistory, employmentHistory } = bundle;
  const form = savedApplication?.formData ?? {};

  // Prefer the saved application form, then the renter profile, then Clerk
  const fullName: string = form.fullName ?? "";
  const [formFirst, ...formRest] = fullName.trim().split(/\s+/);

  const firstName =
    renter?.firstName || formFirst || clerkUser.firstName || "";
  const lastName =
    renter?.lastName || formRest.join(" ") || clerkUser.lastName || "";
  const email = renter?.email || form.email || clerkUser.email || "";
  const phone = renter?.phoneNumber || form.cellPhone || undefined;

  const employer = renter?.verifiedEmployer || renter?.employer || form.employer;
  const position = renter?.verifiedPosition || renter?.position || form.position;
  const annualIncome = renter?.verifiedIncome ?? renter?.income ?? undefined;

  const sectionsIncluded: ApplicationSection[] = [];
  const missingSections: ApplicationSection[] = [];

  const hasPersonal = Boolean(firstName && lastName && email);
  (hasPersonal ? sectionsIncluded : missingSections).push("personal");

  const hasEmployment = Boolean(employer || employmentHistory.length > 0);
  (hasEmployment ? sectionsIncluded : missingSections).push("employment");

  const hasRentalHistory = rentalHistory.length > 0;
  (hasRentalHistory ? sectionsIncluded : missingSections).push("rental_history");

  const hasFinancial = Boolean(
    renter?.verified || renter?.employmentVerified || renter?.straddleCustomerId
  );
  (hasFinancial ? sectionsIncluded : missingSections).push("financial");

  const coApplicants = (savedApplication?.coApplicants ?? []).filter(
    (c: any) => c?.name
  );
  const occupants = (savedApplication?.occupants ?? []).filter(
    (o: any) => o?.name
  );
  const vehicles = (savedApplication?.vehicles ?? []).filter(
    (v: any) => v?.make
  );
  const hasHousehold =
    coApplicants.length > 0 || occupants.length > 0 || vehicles.length > 0;
  if (hasHousehold) sectionsIncluded.push("household");

  const application: StandardApplication = {
    applicant: {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: renter?.dateOfBirth || form.birthdate || undefined,
      maritalStatus: form.maritalStatus || undefined,
      isCitizen: typeof form.isCitizen === "boolean" ? form.isCitizen : undefined,
      currentAddress: renter?.street
        ? {
            street: renter.street,
            city: renter.city,
            state: renter.state,
            zipCode: renter.zipCode,
          }
        : undefined,
      verifiedRenter: Boolean(renter?.verified),
    },
    employment: {
      employer: employer || undefined,
      position: position || undefined,
      annualIncome,
      startDate:
        renter?.verifiedEmploymentStartDate ||
        renter?.employment?.employmentStartDate ||
        undefined,
      verified: Boolean(renter?.employmentVerified),
      history: employmentHistory.map((e) => ({
        employerName: e.employerName,
        jobTitle: e.jobTitle,
        startDate: e.startDate,
        endDate: e.endDate ?? undefined,
        isCurrent: e.isCurrent,
        basePay: e.basePay ?? undefined,
        payFrequency: e.payFrequency ?? undefined,
        verified: e.dataSource === "argyle",
      })),
    },
    residenceHistory: rentalHistory
      .slice()
      .sort((a, b) => b.moveInDate - a.moveInDate)
      .map((r) => ({
        address: r.address,
        city: r.city,
        state: r.state,
        zipCode: r.zipCode,
        monthlyRent: r.monthlyRent,
        moveInDate: toIsoDate(r.moveInDate)!,
        moveOutDate: toIsoDate(r.moveOutDate),
        landlordName: r.landlordName ?? undefined,
        landlordContact: r.landlordContact ?? undefined,
        landlordEmail: r.landlordEmail ?? undefined,
        onTimePayments: r.paymentHistory?.onTimePayments ?? 0,
        latePayments: r.paymentHistory?.latePayments ?? 0,
        verified: Boolean(r.verified),
      })),
    financial: {
      incomeVerified: Boolean(renter?.employmentVerified),
      verificationMethod: renter?.incomeVerificationMethod ?? undefined,
      bankLinked: Boolean(renter?.straddleCustomerId),
    },
    household: {
      coApplicants: coApplicants.map((c: any) => ({
        name: c.name,
        email: c.email || undefined,
        phone: c.phone || undefined,
      })),
      occupants: occupants.map((o: any) => ({
        name: o.name,
        relationship: o.relationship || undefined,
        age: o.age || undefined,
      })),
      vehicles: vehicles.map((v: any) => ({
        make: v.make || undefined,
        model: v.model || undefined,
        year: v.year || undefined,
        color: v.color || undefined,
        license: v.license || undefined,
        state: v.state || undefined,
      })),
    },
    incomeSources: (savedApplication?.incomeSources ?? []).filter(
      (s: any) => s?.type || s?.amount
    ),
    property,
    meta: {
      source: "HomeU",
      submittedAt: new Date().toISOString(),
      sectionsIncluded,
    },
  };

  return { application, sectionsIncluded, missingSections };
}
