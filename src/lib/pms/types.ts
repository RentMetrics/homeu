/**
 * Standardized rental application payload.
 *
 * Built once from everything the renter stores in HomeU (profile, saved
 * application, rental history, verified employment, financial verification),
 * then mapped by each PMS adapter into that provider's wire format.
 */

export interface StandardApplication {
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    maritalStatus?: string;
    isCitizen?: boolean;
    currentAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    /** HomeU "Verified Renter" status (identity/financial verification) */
    verifiedRenter: boolean;
  };
  employment: {
    employer?: string;
    position?: string;
    annualIncome?: number;
    startDate?: string;
    /** Employment/income verified through Argyle */
    verified: boolean;
    history: Array<{
      employerName: string;
      jobTitle: string;
      startDate: string;
      endDate?: string;
      isCurrent: boolean;
      basePay?: number;
      payFrequency?: string;
      verified: boolean;
    }>;
  };
  residenceHistory: Array<{
    address: string;
    city: string;
    state: string;
    zipCode: string;
    monthlyRent: number;
    moveInDate: string; // ISO date
    moveOutDate?: string; // ISO date
    landlordName?: string;
    landlordContact?: string;
    landlordEmail?: string;
    onTimePayments: number;
    latePayments: number;
    verified: boolean;
  }>;
  financial: {
    incomeVerified: boolean;
    verificationMethod?: string;
    bankLinked: boolean;
  };
  household: {
    coApplicants: Array<{ name: string; email?: string; phone?: string }>;
    occupants: Array<{ name: string; relationship?: string; age?: string }>;
    vehicles: Array<{
      make?: string;
      model?: string;
      year?: string;
      color?: string;
      license?: string;
      state?: string;
    }>;
  };
  incomeSources: Array<{ type?: string; source?: string; amount?: string }>;
  property: {
    propertyId?: string;
    propertyName: string;
    address?: string;
    unitNumber?: string;
  };
  meta: {
    source: "HomeU";
    submittedAt: string; // ISO datetime
    sectionsIncluded: ApplicationSection[];
  };
}

export type ApplicationSection =
  | "personal"
  | "employment"
  | "rental_history"
  | "financial"
  | "household";

export interface PmsConnectionConfig {
  provider: string;
  externalPropertyId?: string;
  externalSourceId?: string;
  apiBaseUrl?: string;
  credentialRef?: string;
  fallbackEmail?: string;
}

export type PmsFailureCode = "not_configured" | "unsupported" | "api_error";

export interface PmsSubmitResult {
  ok: boolean;
  /** Application/lead/guest-card id assigned by the PMS on success */
  externalApplicationId?: string;
  message: string;
  code?: PmsFailureCode;
}
