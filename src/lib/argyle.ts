/**
 * Argyle API Client Library
 *
 * Provides functions for interacting with the Argyle API for
 * employment and income verification.
 */

import crypto from 'crypto';

// ========================================
// TYPES
// ========================================

export interface ArgyleWebhookEvent {
  event: string;
  name: string;
  data: {
    user: string;
    account: string;
    [key: string]: any;
  };
}

interface ArgyleEmployment {
  id: string;
  employer: string;
  job_title: string;
  hire_date: string;
  termination_date?: string;
  status: string;
  pay_cycle?: string;
  base_pay?: {
    amount: number;
    period: string;
    currency: string;
  };
  [key: string]: any;
}

interface ArgyleIncome {
  id: string;
  compensation_amount?: number;
  compensation_period?: string;
  pay_cycle?: string;
  [key: string]: any;
}

interface ArgylePaystub {
  id: string;
  gross_pay?: number;
  net_pay?: number;
  pay_date?: string;
  pay_period_start?: string;
  pay_period_end?: string;
  hours?: number;
  [key: string]: any;
}

interface ArgyleListResponse<T> {
  results: T[];
  next?: string;
  previous?: string;
  count?: number;
}

// ========================================
// ARGYLE CLIENT
// ========================================

class ArgyleClient {
  private apiUrl: string;
  private apiKeyId: string;
  private apiKeySecret: string;

  constructor() {
    this.apiUrl = process.env.ARGYLE_API_URL || 'https://api.argyle.com/v2';
    this.apiKeyId = process.env.ARGYLE_API_KEY_ID || '';
    this.apiKeySecret = process.env.ARGYLE_API_KEY_SECRET || '';

    if (!this.apiKeyId || !this.apiKeySecret) {
      console.warn('Argyle API credentials not configured');
    }
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiKeyId}:${this.apiKeySecret}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Argyle API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async createUser(): Promise<{ id: string; [key: string]: any }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async createUserToken(userId: string): Promise<{ user_token: string; expires_at: string }> {
    return this.request('/user-tokens', {
      method: 'POST',
      body: JSON.stringify({ user: userId }),
    });
  }

  async getAccounts(userId: string): Promise<ArgyleListResponse<any>> {
    return this.request(`/accounts?user=${userId}`);
  }

  async getEmployments(userId: string): Promise<ArgyleListResponse<ArgyleEmployment>> {
    return this.request(`/employments?user=${userId}`);
  }

  async getIncomes(userId: string): Promise<ArgyleListResponse<ArgyleIncome>> {
    return this.request(`/incomes?user=${userId}`);
  }

  async getPaystubs(userId: string, options?: { limit?: number }): Promise<ArgyleListResponse<ArgylePaystub>> {
    const params = new URLSearchParams({ user: userId });
    if (options?.limit) params.set('limit', String(options.limit));
    return this.request(`/paystubs?${params.toString()}`);
  }

  async getEmployer(employerId: string): Promise<{ id: string; name: string; [key: string]: any }> {
    return this.request(`/search/employers/${employerId}`);
  }
}

export function createArgyleClient(): ArgyleClient {
  return new ArgyleClient();
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get the current/primary employment from a list of employments.
 * Prefers active status, then most recent hire date.
 */
export function getCurrentEmployment(employments: ArgyleEmployment[]): ArgyleEmployment | null {
  if (!employments || employments.length === 0) return null;

  // Prefer active employments
  const active = employments.filter(e => e.status === 'active');
  if (active.length > 0) {
    // Return the one with the most recent hire date
    return active.sort((a, b) =>
      new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime()
    )[0];
  }

  // Fall back to most recent employment
  return employments.sort((a, b) =>
    new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime()
  )[0];
}

/**
 * Get the best income estimate from available data sources.
 * Priority: income endpoint > employment base_pay > paystub calculation
 */
export function getBestIncomeEstimate(
  incomes: ArgyleIncome[],
  employments: ArgyleEmployment[],
  paystubs: ArgylePaystub[]
): { amount: number; source: string; frequency?: string } {
  // Try income endpoint first
  if (incomes && incomes.length > 0) {
    const income = incomes[0];
    if (income.compensation_amount && income.compensation_amount > 0) {
      return {
        amount: income.compensation_amount,
        source: 'income_endpoint',
        frequency: income.compensation_period || income.pay_cycle,
      };
    }
  }

  // Try employment base pay
  const currentEmployment = getCurrentEmployment(employments);
  if (currentEmployment?.base_pay?.amount && currentEmployment.base_pay.amount > 0) {
    return {
      amount: convertBasePayToAnnual(currentEmployment),
      source: 'employment_base_pay',
      frequency: currentEmployment.pay_cycle || currentEmployment.base_pay.period,
    };
  }

  // Try calculating from paystubs
  if (paystubs && paystubs.length >= 2) {
    const grossPays = paystubs
      .filter(p => p.gross_pay && p.gross_pay > 0)
      .map(p => p.gross_pay!);

    if (grossPays.length >= 2) {
      const avgGrossPay = grossPays.reduce((a, b) => a + b, 0) / grossPays.length;
      // Estimate annual from average paystub (assume biweekly if unknown)
      const estimatedAnnual = avgGrossPay * 26;
      return {
        amount: Math.round(estimatedAnnual * 100) / 100,
        source: 'paystub_calculation',
        frequency: 'biweekly',
      };
    }
  }

  return { amount: 0, source: 'none' };
}

/**
 * Convert an employment's base pay to annual amount.
 */
export function convertBasePayToAnnual(employment: ArgyleEmployment): number {
  if (!employment.base_pay?.amount) return 0;

  const { amount, period } = employment.base_pay;

  switch (period?.toLowerCase()) {
    case 'annual':
    case 'yearly':
      return amount;
    case 'monthly':
      return amount * 12;
    case 'semimonthly':
    case 'semi-monthly':
      return amount * 24;
    case 'biweekly':
    case 'bi-weekly':
      return amount * 26;
    case 'weekly':
      return amount * 52;
    case 'daily':
      return amount * 260; // ~52 weeks * 5 days
    case 'hourly':
      return amount * 2080; // 40 hours * 52 weeks
    default:
      // Assume annual if unknown
      return amount;
  }
}

/**
 * Validate Argyle webhook signature using HMAC-SHA256.
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}
