/**
 * Property Manager Scores TypeScript Wrapper
 *
 * Provides typed functions for property manager scoring calculations.
 * Falls back to JavaScript implementation if WASM is unavailable.
 */

import { initPMScores, isWasmSupported } from './index';
import type {
  TenantRiskInput,
  TenantRiskResult,
  CreditworthinessInput,
  CreditworthinessResult,
  CollectionForecastInput,
  CollectionForecastResult,
  PortfolioRiskInput,
  PortfolioRiskResult,
  PortfolioSummary,
  RiskCategory,
  CreditTier,
} from './types';

/**
 * Calculate single tenant risk score
 */
export async function calculateTenantRisk(
  input: TenantRiskInput
): Promise<TenantRiskResult> {
  try {
    if (isWasmSupported()) {
      const module = await initPMScores();
      const resultJson = module.calculate_tenant_risk(JSON.stringify(input));
      return JSON.parse(resultJson) as TenantRiskResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  return calculateTenantRiskJS(input);
}

/**
 * Calculate risk scores for multiple tenants
 */
export async function calculateTenantRisksBatch(
  inputs: TenantRiskInput[]
): Promise<TenantRiskResult[]> {
  try {
    if (isWasmSupported()) {
      const module = await initPMScores();
      const resultJson = module.calculate_tenant_risks_batch(JSON.stringify(inputs));
      return JSON.parse(resultJson) as TenantRiskResult[];
    }
  } catch (error) {
    console.warn('[Scores] WASM batch calculation failed, using JS fallback:', error);
  }

  return inputs.map(calculateTenantRiskJS);
}

/**
 * Calculate credit worthiness assessment
 */
export async function calculateCreditworthiness(
  input: CreditworthinessInput
): Promise<CreditworthinessResult> {
  try {
    if (isWasmSupported()) {
      const module = await initPMScores();
      const resultJson = module.calculate_creditworthiness(JSON.stringify(input));
      return JSON.parse(resultJson) as CreditworthinessResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  return calculateCreditworthinessJS(input);
}

/**
 * Calculate collection likelihood forecast
 */
export async function calculateCollectionForecast(
  input: CollectionForecastInput
): Promise<CollectionForecastResult> {
  try {
    if (isWasmSupported()) {
      const module = await initPMScores();
      const resultJson = module.calculate_collection_forecast(JSON.stringify(input));
      return JSON.parse(resultJson) as CollectionForecastResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  return calculateCollectionForecastJS(input);
}

/**
 * Calculate portfolio risk dashboard
 */
export async function calculatePortfolioRisk(
  input: PortfolioRiskInput
): Promise<PortfolioRiskResult> {
  try {
    if (isWasmSupported()) {
      const module = await initPMScores();
      const resultJson = module.calculate_portfolio_risk(JSON.stringify(input));
      return JSON.parse(resultJson) as PortfolioRiskResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  return calculatePortfolioRiskJS(input);
}

/**
 * Calculate portfolio summary statistics
 */
export async function calculatePortfolioSummary(
  input: PortfolioRiskInput
): Promise<PortfolioSummary> {
  try {
    if (isWasmSupported()) {
      const module = await initPMScores();
      const resultJson = module.calculate_portfolio_summary(JSON.stringify(input));
      return JSON.parse(resultJson) as PortfolioSummary;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  return calculatePortfolioSummaryJS(input);
}

// ============================================
// JAVASCRIPT FALLBACK IMPLEMENTATIONS
// ============================================

function calculateTenantRiskJS(input: TenantRiskInput): TenantRiskResult {
  const total = input.on_time_payments + input.late_payments + input.missed_payments;

  // Payment history risk (40%)
  let paymentRisk = 0;
  if (total > 0) {
    const lateRate = (input.late_payments + input.missed_payments) / total;
    paymentRisk += lateRate * 50;
    paymentRisk += Math.min(input.average_days_late / 30, 1) * 25;
    paymentRisk += Math.min(input.missed_payments * 8, 25);
  } else {
    paymentRisk = 50; // No history
  }

  // Balance risk (25%)
  let balanceRisk = 50;
  if (input.has_sufficient_balance) balanceRisk -= 40;
  else balanceRisk += 30;
  if (input.account_status === 'active') balanceRisk -= 10;
  else if (input.account_status === 'inactive') balanceRisk += 20;
  else balanceRisk += 10;

  // Income risk (20%)
  let incomeRisk = 50;
  if (input.employment_verified) incomeRisk -= 20;
  else incomeRisk += 15;
  if (input.verified_income) {
    const ratio = (input.rent_amount * 12 / input.verified_income) * 100;
    if (ratio <= 25) incomeRisk -= 25;
    else if (ratio <= 30) incomeRisk -= 15;
    else if (ratio <= 35) incomeRisk -= 5;
    else if (ratio <= 40) incomeRisk += 10;
    else incomeRisk += 25;
  }

  // Lease risk (15%)
  let leaseRisk = 30;
  if (input.is_month_to_month) leaseRisk += 40;
  else if (input.lease_months_remaining >= 6) leaseRisk -= 20;
  else if (input.lease_months_remaining >= 3) leaseRisk -= 10;
  else if (input.lease_months_remaining <= 1) leaseRisk += 15;

  // Clamp
  paymentRisk = Math.max(0, Math.min(100, paymentRisk));
  balanceRisk = Math.max(0, Math.min(100, balanceRisk));
  incomeRisk = Math.max(0, Math.min(100, incomeRisk));
  leaseRisk = Math.max(0, Math.min(100, leaseRisk));

  const riskScore = paymentRisk * 0.4 + balanceRisk * 0.25 + incomeRisk * 0.2 + leaseRisk * 0.15;
  const finalRisk = Math.max(0, Math.min(100, Math.round(riskScore * 10) / 10));
  const paymentLikelihood = 100 - finalRisk;

  const riskCategory: RiskCategory =
    finalRisk <= 25 ? 'Low' :
    finalRisk <= 50 ? 'Moderate' :
    finalRisk <= 75 ? 'High' : 'Critical';

  return {
    renter_id: input.renter_id,
    renter_name: input.renter_name,
    property_address: input.property_address,
    risk_score: finalRisk,
    payment_likelihood: Math.round(paymentLikelihood * 10) / 10,
    risk_category: riskCategory,
    factors: [
      { name: 'Payment History', value: paymentRisk, weight: 0.4, contribution: paymentRisk * 0.4, description: `${total > 0 ? ((input.on_time_payments / total) * 100).toFixed(0) : 0}% on-time` },
      { name: 'Balance Status', value: balanceRisk, weight: 0.25, contribution: balanceRisk * 0.25, description: input.has_sufficient_balance ? 'Sufficient' : 'Insufficient' },
      { name: 'Income Stability', value: incomeRisk, weight: 0.2, contribution: incomeRisk * 0.2, description: input.employment_verified ? 'Verified' : 'Unverified' },
      { name: 'Lease Status', value: leaseRisk, weight: 0.15, contribution: leaseRisk * 0.15, description: input.is_month_to_month ? 'Month-to-month' : `${input.lease_months_remaining} months remaining` },
    ],
    recommended_actions: generateRecommendedActions(riskCategory, finalRisk),
  };
}

function calculateCreditworthinessJS(input: CreditworthinessInput): CreditworthinessResult {
  if (input.actual_credit_score) {
    const tier = getCreditTier(input.actual_credit_score);
    return {
      renter_id: input.renter_id,
      credit_score: input.actual_credit_score,
      is_proxy: false,
      credit_tier: tier,
      deposit_multiplier: getDepositMultiplier(tier),
      factors: [{ name: 'Credit Bureau Score', value: input.actual_credit_score, weight: 1, contribution: input.actual_credit_score, description: `Actual score: ${input.actual_credit_score}` }],
      recommendations: ['Actual credit score on file'],
    };
  }

  // Calculate proxy score
  let score = 650; // Base

  // Payment history
  const total = input.on_time_payments + input.late_payments + input.missed_payments;
  if (total > 0) {
    const rate = input.on_time_payments / total;
    if (rate >= 0.98) score += 100;
    else if (rate >= 0.95) score += 50;
    else if (rate >= 0.85) score -= 30;
    else if (rate >= 0.7) score -= 60;
    else score -= 100;
  }

  // Tenure
  if (input.rental_tenure_months >= 24) score += 50;
  else if (input.rental_tenure_months >= 12) score += 25;
  else if (input.rental_tenure_months >= 6) score += 10;
  else score -= 10;

  // Employment
  if (input.employment_verified && input.employment_months >= 24) score += 50;
  else if (input.employment_verified) score += 25;
  else score -= 25;

  // Income consistency
  if (input.income_consistency >= 80) score += 30;
  else if (input.income_consistency < 50) score -= 15;

  // Evictions
  score -= input.previous_evictions * 150;

  score = Math.max(300, Math.min(850, score));
  const tier = getCreditTier(score);

  return {
    renter_id: input.renter_id,
    credit_score: score,
    is_proxy: true,
    credit_tier: tier,
    deposit_multiplier: getDepositMultiplier(tier),
    factors: [
      { name: 'Payment History', value: 0, weight: 1, contribution: 0, description: `${total} payments tracked` },
      { name: 'Rental Tenure', value: 0, weight: 1, contribution: 0, description: `${input.rental_tenure_months} months` },
    ],
    recommendations: ['Proxy score calculated from HomeU data', 'Consider requesting actual credit report'],
  };
}

function calculateCollectionForecastJS(input: CollectionForecastInput): CollectionForecastResult {
  const totalRent = input.tenants.reduce((sum, t) => sum + t.rent_amount, 0);
  const results = input.tenants.map(calculateTenantRiskJS);

  // Weighted collection rate
  let weightedLikelihood = 0;
  if (totalRent > 0) {
    weightedLikelihood = input.tenants.reduce((sum, tenant, i) => {
      return sum + (tenant.rent_amount * results[i].payment_likelihood);
    }, 0) / totalRent;
  } else {
    weightedLikelihood = 95;
  }

  // Seasonal adjustment
  const month = parseInt(input.forecast_month.split('-')[1] || '1');
  const seasonalFactor = input.seasonal_adjustment ? getSeasonalFactor(month) : 1;
  const adjustedRate = Math.max(0, Math.min(100, weightedLikelihood * seasonalFactor));

  const expectedAmount = totalRent * (adjustedRate / 100);
  const shortfall = totalRent - expectedAmount;

  // At-risk tenants
  const atRisk = results
    .filter(r => r.risk_score > 50)
    .map(r => ({
      renter_id: r.renter_id,
      renter_name: r.renter_name,
      property_address: r.property_address,
      rent_amount: input.tenants.find(t => t.renter_id === r.renter_id)?.rent_amount || 0,
      risk_score: r.risk_score,
      payment_likelihood: r.payment_likelihood,
    }));

  // Monthly forecasts
  const forecasts = [0, 1, 2].map(i => {
    const m = ((month - 1 + i) % 12) + 1;
    const sf = input.seasonal_adjustment ? getSeasonalFactor(m) : 1;
    const rate = Math.max(0, Math.min(100, weightedLikelihood * sf));
    return {
      month: formatMonth(input.forecast_month, i),
      expected_rate: Math.round(rate * 10) / 10,
      expected_amount: Math.round(totalRent * (rate / 100) * 100) / 100,
      confidence: 0.95 - (i * 0.05),
    };
  });

  return {
    forecast_month: input.forecast_month,
    total_expected_rent: Math.round(totalRent * 100) / 100,
    expected_collection_rate: Math.round(adjustedRate * 10) / 10,
    expected_collection_amount: Math.round(expectedAmount * 100) / 100,
    expected_shortfall: Math.round(shortfall * 100) / 100,
    confidence_interval: {
      lower: Math.max(0, adjustedRate - 5),
      upper: Math.min(100, adjustedRate + 5),
      confidence: 0.95,
    },
    at_risk_tenants: atRisk,
    monthly_forecasts: forecasts,
  };
}

function calculatePortfolioRiskJS(input: PortfolioRiskInput): PortfolioRiskResult {
  const results = input.tenants.map(calculateTenantRiskJS);
  const totalRent = input.tenants.reduce((sum, t) => sum + t.rent_amount, 0);

  // Overall risk (rent-weighted)
  let overallRisk = 0;
  if (totalRent > 0) {
    overallRisk = input.tenants.reduce((sum, tenant, i) => {
      return sum + (tenant.rent_amount * results[i].risk_score);
    }, 0) / totalRent;
  }

  // Distribution
  const distribution = { low: 0, moderate: 0, high: 0, critical: 0 };
  results.forEach(r => {
    if (r.risk_score <= 25) distribution.low++;
    else if (r.risk_score <= 50) distribution.moderate++;
    else if (r.risk_score <= 75) distribution.high++;
    else distribution.critical++;
  });

  // Forecasts
  const forecasts = input.forecast_months.map(month => {
    return calculateCollectionForecastJS({
      ...input,
      forecast_month: month,
      seasonal_adjustment: true,
    });
  });

  const expectedCollection = forecasts[0]?.expected_collection_amount || totalRent * 0.95;

  return {
    property_manager_id: input.property_manager_id,
    snapshot_date: Date.now(),
    overall_risk_score: Math.round(overallRisk * 10) / 10,
    total_tenants: input.tenants.length,
    risk_distribution: distribution,
    total_monthly_rent: Math.round(totalRent * 100) / 100,
    expected_collection: Math.round(expectedCollection * 100) / 100,
    forecasts,
  };
}

function calculatePortfolioSummaryJS(input: PortfolioRiskInput): PortfolioSummary {
  const results = input.tenants.map(calculateTenantRiskJS);
  const totalRent = input.tenants.reduce((sum, t) => sum + t.rent_amount, 0);

  const riskScores = results.map(r => r.risk_score).sort((a, b) => a - b);
  const avgRisk = riskScores.reduce((a, b) => a + b, 0) / (riskScores.length || 1);
  const medianRisk = riskScores.length > 0
    ? riskScores[Math.floor(riskScores.length / 2)]
    : 0;

  const highestRisk = results.reduce((max, r) => r.risk_score > max.risk_score ? r : max, results[0]);
  const lowestRisk = results.reduce((min, r) => r.risk_score < min.risk_score ? r : min, results[0]);

  const atRisk = results.filter(r => r.risk_score > 50);
  const atRiskRent = atRisk.reduce((sum, r) => {
    const tenant = input.tenants.find(t => t.renter_id === r.renter_id);
    return sum + (tenant?.rent_amount || 0);
  }, 0);

  return {
    total_tenants: input.tenants.length,
    total_monthly_rent: Math.round(totalRent * 100) / 100,
    average_risk_score: Math.round(avgRisk * 10) / 10,
    median_risk_score: Math.round(medianRisk * 10) / 10,
    highest_risk_tenant: highestRisk?.renter_name,
    lowest_risk_tenant: lowestRisk?.renter_name,
    at_risk_count: atRisk.length,
    at_risk_rent_exposure: Math.round(atRiskRent * 100) / 100,
  };
}

// Helper functions
function getCreditTier(score: number): CreditTier {
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 650) return 'Fair';
  if (score >= 550) return 'Poor';
  return 'VeryPoor';
}

function getDepositMultiplier(tier: CreditTier): number {
  const multipliers: Record<CreditTier, number> = {
    Excellent: 1.0,
    Good: 1.0,
    Fair: 1.5,
    Poor: 2.0,
    VeryPoor: 2.5,
  };
  return multipliers[tier];
}

function getSeasonalFactor(month: number): number {
  const factors: Record<number, number> = {
    1: 0.95, 2: 0.95, 3: 1.02, 4: 1.02, 5: 1.0, 6: 1.0,
    7: 1.0, 8: 1.0, 9: 1.03, 10: 1.03, 11: 0.95, 12: 0.95,
  };
  return factors[month] || 1.0;
}

function formatMonth(base: string, offset: number): string {
  const [year, month] = base.split('-').map(Number);
  const totalMonths = year * 12 + month - 1 + offset;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

function generateRecommendedActions(category: RiskCategory, score: number): string[] {
  const actions: string[] = [];

  switch (category) {
    case 'Critical':
      actions.push('Immediate attention required');
      actions.push('Consider payment plan discussion');
      break;
    case 'High':
      actions.push('Schedule check-in with tenant');
      actions.push('Send payment reminder before due date');
      break;
    case 'Moderate':
      actions.push('Monitor payment pattern');
      break;
    case 'Low':
      actions.push('Tenant in good standing');
      break;
  }

  return actions;
}
