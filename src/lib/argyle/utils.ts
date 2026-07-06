/**
 * Argyle Utility Functions
 *
 * Helper functions for processing Argyle data
 */

import crypto from 'crypto';
import { ArgylePaystub, ArgyleEmployment, ArgyleIncome } from './types';

// ========================================
// INCOME CALCULATIONS
// ========================================

/**
 * Calculate annual income from paystub history
 * Analyzes recent paystubs to estimate annual income
 */
export function calculateAnnualIncome(paystubs: ArgylePaystub[]): number {
  if (paystubs.length === 0) return 0;

  // Sort paystubs by pay date (most recent first)
  const sortedPaystubs = [...paystubs].sort((a, b) =>
    new Date(b.pay_date).getTime() - new Date(a.pay_date).getTime()
  );

  // Get paystubs from the last 6 months for a more accurate estimate
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentPaystubs = sortedPaystubs.filter(
    p => new Date(p.pay_date) >= sixMonthsAgo
  );

  if (recentPaystubs.length === 0) {
    // Fall back to all paystubs if none in last 6 months
    const totalGross = sortedPaystubs
      .slice(0, 12) // Use up to 12 most recent
      .reduce((sum, p) => sum + parseFloat(p.gross_pay), 0);
    const avgPerPaystub = totalGross / Math.min(sortedPaystubs.length, 12);
    const frequency = inferPayFrequency(sortedPaystubs.slice(0, 12));
    return calculateAnnualFromFrequency(avgPerPaystub, frequency);
  }

  // Calculate based on recent paystubs
  const totalGross = recentPaystubs.reduce((sum, p) => sum + parseFloat(p.gross_pay), 0);

  // Get the date range
  const dates = recentPaystubs.map(p => new Date(p.pay_date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const daysCovered = (maxDate - minDate) / (1000 * 60 * 60 * 24);

  if (daysCovered > 0) {
    // Calculate daily rate and extrapolate to annual
    const dailyRate = totalGross / daysCovered;
    return Math.round(dailyRate * 365);
  }

  // If only one paystub, use frequency to estimate
  const frequency = inferPayFrequency(recentPaystubs);
  return calculateAnnualFromFrequency(totalGross, frequency);
}

/**
 * Calculate annual income from a single pay amount and frequency
 */
function calculateAnnualFromFrequency(
  payAmount: number,
  frequency: string
): number {
  const multipliers: Record<string, number> = {
    weekly: 52,
    bi_weekly: 26,
    semi_monthly: 24,
    monthly: 12,
    annual: 1,
  };

  const multiplier = multipliers[frequency] || 12;
  return Math.round(payAmount * multiplier);
}

/**
 * Infer pay frequency from paystub history
 * Analyzes dates between paystubs to determine frequency
 */
export function inferPayFrequency(paystubs: ArgylePaystub[]): string {
  if (paystubs.length < 2) return 'monthly'; // Default assumption

  // Sort by pay date
  const sortedPaystubs = [...paystubs].sort((a, b) =>
    new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime()
  );

  // Calculate average days between paystubs
  const gaps: number[] = [];
  for (let i = 1; i < sortedPaystubs.length; i++) {
    const current = new Date(sortedPaystubs[i].pay_date).getTime();
    const previous = new Date(sortedPaystubs[i - 1].pay_date).getTime();
    const daysBetween = (current - previous) / (1000 * 60 * 60 * 24);
    gaps.push(daysBetween);
  }

  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;

  // Determine frequency based on average gap
  if (avgGap <= 8) return 'weekly';
  if (avgGap <= 16) return 'bi_weekly';
  if (avgGap <= 17) return 'semi_monthly';
  return 'monthly';
}

/**
 * Format pay frequency for display
 */
export function formatPayFrequency(frequency: string): string {
  const labels: Record<string, string> = {
    weekly: 'Weekly',
    bi_weekly: 'Bi-weekly',
    semi_monthly: 'Semi-monthly',
    monthly: 'Monthly',
    annual: 'Annual',
    hourly: 'Hourly',
    daily: 'Daily',
  };

  return labels[frequency] || frequency;
}

// ========================================
// EMPLOYMENT HELPERS
// ========================================

/**
 * Get the most recent/current employment from a list
 */
export function getCurrentEmployment(
  employments: ArgyleEmployment[]
): ArgyleEmployment | null {
  if (employments.length === 0) return null;

  // Find active employment first
  const active = employments.find(e => e.status === 'active');
  if (active) return active;

  // Otherwise return most recently updated
  return employments.sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )[0];
}

/**
 * Calculate employment duration in months
 */
export function calculateEmploymentDuration(employment: ArgyleEmployment): number {
  const startDate = new Date(employment.hire_date);
  const endDate = employment.termination_date
    ? new Date(employment.termination_date)
    : new Date();

  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  return Math.max(0, months);
}

/**
 * Format employment duration for display
 */
export function formatEmploymentDuration(months: number): string {
  if (months < 1) return 'Less than a month';
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }

  const yearStr = years === 1 ? '1 year' : `${years} years`;
  const monthStr = remainingMonths === 1 ? '1 month' : `${remainingMonths} months`;

  return `${yearStr}, ${monthStr}`;
}

/**
 * Convert base pay to annual salary
 */
export function convertBasePayToAnnual(employment: ArgyleEmployment): number {
  if (!employment.base_pay) return 0;

  const amount = parseFloat(employment.base_pay.amount);
  const period = employment.base_pay.period;

  const multipliers: Record<string, number> = {
    hourly: 2080, // 40 hours * 52 weeks
    daily: 260, // 5 days * 52 weeks
    weekly: 52,
    bi_weekly: 26,
    semi_monthly: 24,
    monthly: 12,
    annual: 1,
  };

  return Math.round(amount * (multipliers[period] || 1));
}

// ========================================
// WEBHOOK VERIFICATION
// ========================================

/**
 * Validate Argyle webhook signature
 * Argyle uses HMAC-SHA256 for webhook verification
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// ========================================
// DATA FORMATTING
// ========================================

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format short date (e.g., "Jan 2024")
 */
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

// ========================================
// INCOME ESTIMATE FROM ARGYLE DATA
// ========================================

/**
 * Get the best income estimate from available Argyle data
 * Priority: Income record > Employment base pay > Paystub calculation
 */
export function getBestIncomeEstimate(
  incomes: ArgyleIncome[],
  employments: ArgyleEmployment[],
  paystubs: ArgylePaystub[]
): { amount: number; source: string; frequency: string } {
  // Try income records first (most accurate)
  if (incomes.length > 0) {
    const latestIncome = incomes.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];

    return {
      amount: parseFloat(latestIncome.projected_annual_income),
      source: 'income_record',
      frequency: latestIncome.pay_frequency,
    };
  }

  // Try employment base pay
  const currentEmployment = getCurrentEmployment(employments);
  if (currentEmployment?.base_pay) {
    return {
      amount: convertBasePayToAnnual(currentEmployment),
      source: 'employment_base_pay',
      frequency: currentEmployment.pay_cycle || currentEmployment.base_pay.period,
    };
  }

  // Fall back to paystub calculation
  if (paystubs.length > 0) {
    const frequency = inferPayFrequency(paystubs);
    return {
      amount: calculateAnnualIncome(paystubs),
      source: 'paystub_calculation',
      frequency,
    };
  }

  return {
    amount: 0,
    source: 'unavailable',
    frequency: 'unknown',
  };
}
