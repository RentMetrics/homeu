/**
 * Argyle Integration for HomeU
 *
 * This module provides the main exports for integrating Argyle's
 * payroll/employment verification platform with the HomeU application.
 */

// Client exports
export {
  ArgyleClient,
  createArgyleClient,
  createArgyleClientWithConfig,
} from './client';
export type { ArgyleConfig } from './client';

// Type exports
export type {
  // User types
  ArgyleUser,
  ArgyleUserToken,
  // Account types
  ArgyleAccount,
  // Employment types
  ArgyleEmployment,
  ArgyleEmployer,
  // Income types
  ArgyleIncome,
  // Paystub types
  ArgylePaystub,
  ArgyleDeduction,
  ArgyleTax,
  ArgyleEarning,
  // Identity types
  ArgyleIdentity,
  // Link configuration
  ArgyleLinkConfig,
  ArgyleLinkUIEvent,
  // Webhook types
  ArgyleWebhookEvent,
  ArgyleWebhookEventType,
  // API response types
  ArgyleListResponse,
  ArgyleApiError,
  // HomeU-specific types
  HomeUEmploymentVerification,
  VerifiedEmploymentDisplay,
} from './types';

// Utility function exports
export {
  // Income calculations
  calculateAnnualIncome,
  inferPayFrequency,
  formatPayFrequency,
  // Employment helpers
  getCurrentEmployment,
  calculateEmploymentDuration,
  formatEmploymentDuration,
  convertBasePayToAnnual,
  // Webhook verification
  validateWebhookSignature,
  // Data formatting
  formatCurrency,
  formatDate,
  formatShortDate,
  // Income estimation
  getBestIncomeEstimate,
} from './utils';
