/**
 * Argyle API TypeScript Types
 *
 * Types for Argyle's payroll connection API responses
 */

// ========================================
// ARGYLE USER TYPES
// ========================================

export interface ArgyleUser {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ArgyleUserToken {
  user: string;
  user_token: string;
  expires_at: string;
}

// ========================================
// ARGYLE ACCOUNT TYPES
// ========================================

export interface ArgyleAccount {
  id: string;
  user: string;
  employers: string[];
  connection: {
    status: 'connected' | 'syncing' | 'error' | 'disconnected';
    error_code?: string;
    error_message?: string;
    updated_at: string;
  };
  availability: {
    identities: { status: string; updated_at: string };
    employments: { status: string; updated_at: string };
    incomes: { status: string; updated_at: string };
    paystubs: { status: string; updated_at: string };
  };
  source: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// ARGYLE EMPLOYMENT TYPES
// ========================================

export interface ArgyleEmployment {
  id: string;
  account: string;
  user: string;
  employer: string;
  status: 'active' | 'inactive' | 'terminated';
  type: 'full_time' | 'part_time' | 'contractor' | 'seasonal' | 'temporary';
  job_title: string;
  hire_date: string;
  termination_date?: string;
  termination_reason?: string;
  base_pay: {
    amount: string;
    currency: string;
    period: 'hourly' | 'daily' | 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly' | 'annual';
  };
  pay_cycle: 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly';
  platform_ids?: {
    employee_id?: string;
    position_id?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ArgyleEmployer {
  id: string;
  name: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  kind?: string;
}

// ========================================
// ARGYLE PAYSTUB TYPES
// ========================================

export interface ArgylePaystub {
  id: string;
  account: string;
  user: string;
  employer: string;
  pay_period: {
    start_date: string;
    end_date: string;
  };
  pay_date: string;
  gross_pay: string;
  net_pay: string;
  deductions: ArgyleDeduction[];
  taxes: ArgyleTax[];
  earnings: ArgyleEarning[];
  hours?: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ArgyleDeduction {
  type: string;
  category: string;
  amount: string;
}

export interface ArgyleTax {
  type: string;
  amount: string;
}

export interface ArgyleEarning {
  type: string;
  amount: string;
  hours?: number;
  rate?: string;
}

// ========================================
// ARGYLE INCOME TYPES
// ========================================

export interface ArgyleIncome {
  id: string;
  account: string;
  user: string;
  employer: string;
  compensation_type: 'salary' | 'hourly' | 'commission' | 'bonus' | 'tips' | 'other';
  pay_frequency: 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly';
  projected_annual_income: string;
  projected_hourly_income?: string;
  ytd_income: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ========================================
// ARGYLE IDENTITY TYPES
// ========================================

export interface ArgyleIdentity {
  id: string;
  account: string;
  user: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  ssn?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  created_at: string;
  updated_at: string;
}

// ========================================
// ARGYLE LINK CONFIGURATION
// ========================================

export interface ArgyleLinkConfig {
  pluginKey: string; // Replaced deprecated linkKey in Argyle SDK v4
  userToken: string;
  sandbox?: boolean;
  onAccountConnected?: (accountId: string, userId: string, linkItemId: string) => void;
  onAccountRemoved?: (accountId: string, userId: string) => void;
  onAccountError?: (accountId: string, userId: string, linkItemId: string) => void;
  onClose?: () => void;
  onTokenExpired?: (callback: (token: string) => void) => void;
  onUIEvent?: (event: ArgyleLinkUIEvent) => void;
}

export interface ArgyleLinkUIEvent {
  name: string;
  payload?: Record<string, any>;
}

// ========================================
// ARGYLE WEBHOOK TYPES
// ========================================

export interface ArgyleWebhookEvent {
  event: ArgyleWebhookEventType;
  name: string;
  data: {
    user: string;
    account: string;
    resource?: string;
  };
  created_at: string;
}

export type ArgyleWebhookEventType =
  | 'accounts.connected'
  | 'accounts.synced'
  | 'accounts.error'
  | 'accounts.removed'
  | 'identities.added'
  | 'identities.updated'
  | 'employments.added'
  | 'employments.updated'
  | 'incomes.added'
  | 'incomes.updated'
  | 'paystubs.added'
  | 'paystubs.updated'
  | 'paystubs.fully_synced';

// ========================================
// API RESPONSE TYPES
// ========================================

export interface ArgyleListResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ArgyleApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// ========================================
// HOMEU-SPECIFIC TYPES
// ========================================

export interface HomeUEmploymentVerification {
  userId: string;
  argyleUserId: string;
  argyleAccountId: string;
  employerName: string;
  position: string;
  income: number;
  payFrequency: string;
  employmentStartDate: string;
  verifiedAt: number;
  isCurrent: boolean;
}

export interface VerifiedEmploymentDisplay {
  employerName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  income?: number;
  payFrequency?: string;
  verifiedAt: number;
  verificationMethod: string;
}
