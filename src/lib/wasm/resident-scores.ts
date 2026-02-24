/**
 * Resident Scores TypeScript Wrapper
 *
 * Provides typed functions for resident-facing scoring calculations.
 * Falls back to JavaScript implementation if WASM is unavailable.
 */

import { initResidentScores, isWasmSupported } from './index';
import type {
  DesirabilityInput,
  DesirabilityResult,
  NegotiationInput,
  NegotiationResult,
  RenterScoreInput,
  RenterScoreResult,
  DealScoreInput,
  DealScoreResult,
  LeverageScoreInput,
  LeverageScoreResult,
  RenewalStrategyInput,
  RenewalStrategyResult,
  ScoreGrade,
} from './types';

/**
 * Calculate apartment desirability score
 */
export async function calculateDesirability(
  input: DesirabilityInput
): Promise<DesirabilityResult> {
  try {
    if (isWasmSupported()) {
      const module = await initResidentScores();
      const resultJson = module.calculate_desirability(JSON.stringify(input));
      return JSON.parse(resultJson) as DesirabilityResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  // JavaScript fallback
  return calculateDesirabilityJS(input);
}

/**
 * Calculate rent negotiation power
 */
export async function calculateNegotiation(
  input: NegotiationInput
): Promise<NegotiationResult> {
  try {
    if (isWasmSupported()) {
      const module = await initResidentScores();
      const resultJson = module.calculate_negotiation(JSON.stringify(input));
      return JSON.parse(resultJson) as NegotiationResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  // JavaScript fallback
  return calculateNegotiationJS(input);
}

/**
 * Calculate HomeU Renter Score
 */
export async function calculateRenterScore(
  input: RenterScoreInput
): Promise<RenterScoreResult> {
  try {
    if (isWasmSupported()) {
      const module = await initResidentScores();
      const resultJson = module.calculate_renter_score(JSON.stringify(input));
      return JSON.parse(resultJson) as RenterScoreResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM calculation failed, using JS fallback:', error);
  }

  // JavaScript fallback
  return calculateRenterScoreJS(input);
}

/**
 * Calculate deal score for market intelligence
 */
export async function calculateDealScore(
  input: DealScoreInput
): Promise<DealScoreResult> {
  try {
    if (isWasmSupported()) {
      const module = await initResidentScores();
      const resultJson = module.calculate_deal_score(JSON.stringify(input));
      return JSON.parse(resultJson) as DealScoreResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM deal score failed, using JS fallback:', error);
  }

  return calculateDealScoreJS(input);
}

/**
 * Calculate leverage score for negotiation power
 */
export async function calculateLeverageScore(
  input: LeverageScoreInput
): Promise<LeverageScoreResult> {
  try {
    if (isWasmSupported()) {
      const module = await initResidentScores();
      const resultJson = module.calculate_leverage_score(JSON.stringify(input));
      return JSON.parse(resultJson) as LeverageScoreResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM leverage score failed, using JS fallback:', error);
  }

  return calculateLeverageScoreJS(input);
}

/**
 * Calculate renewal strategy for lease negotiations
 */
export async function calculateRenewalStrategy(
  input: RenewalStrategyInput
): Promise<RenewalStrategyResult> {
  try {
    if (isWasmSupported()) {
      const module = await initResidentScores();
      const resultJson = module.calculate_renewal_strategy(JSON.stringify(input));
      return JSON.parse(resultJson) as RenewalStrategyResult;
    }
  } catch (error) {
    console.warn('[Scores] WASM renewal strategy failed, using JS fallback:', error);
  }

  return calculateRenewalStrategyJS(input);
}

// ============================================
// JAVASCRIPT FALLBACK IMPLEMENTATIONS
// ============================================

function calculateDesirabilityJS(input: DesirabilityInput): DesirabilityResult {
  let score = 50; // Base score

  // Market factors (30%)
  const rentRatio = input.current_rent / input.market_rent;
  let marketScore = 50;
  if (rentRatio < 0.85) marketScore = 80;
  else if (rentRatio < 0.95) marketScore = 70;
  else if (rentRatio < 1.05) marketScore = 60;
  else if (rentRatio < 1.15) marketScore = 40;
  else marketScore = 20;

  // Occupancy effect
  if (input.occupancy_rate < 85) marketScore += 20;
  else if (input.occupancy_rate < 92) marketScore += 10;

  // Location (25%)
  let locationScore = 50;
  if (input.google_rating) {
    locationScore += (input.google_rating - 2.5) * 12;
  }
  if (input.walkability_score) {
    locationScore += (input.walkability_score - 50) / 5;
  }

  // Amenities (20%)
  let amenitiesScore = 50;
  amenitiesScore += Math.min(input.amenity_count * 2, 20) - 10;
  const age = new Date().getFullYear() - input.building_year;
  if (age <= 5) amenitiesScore += 15;
  else if (age <= 15) amenitiesScore += 10;
  else if (age > 50) amenitiesScore -= 10;

  // Price trends (15%)
  let trendsScore = 50 - input.rent_trend_3mo * 3 - input.rent_trend_12mo * 1.5;
  if (input.has_concessions) {
    trendsScore += Math.min(input.concession_value / input.current_rent * 10, 10);
  }

  // Value (10%)
  let valueScore = 50;
  if (input.market_price_per_sqft > 0) {
    const valueRatio = input.price_per_sqft / input.market_price_per_sqft;
    if (valueRatio < 0.85) valueScore = 90;
    else if (valueRatio < 0.95) valueScore = 75;
    else if (valueRatio < 1.05) valueScore = 60;
    else if (valueRatio < 1.15) valueScore = 35;
    else valueScore = 20;
  }

  // Clamp all scores
  marketScore = Math.max(0, Math.min(100, marketScore));
  locationScore = Math.max(0, Math.min(100, locationScore));
  amenitiesScore = Math.max(0, Math.min(100, amenitiesScore));
  trendsScore = Math.max(0, Math.min(100, trendsScore));
  valueScore = Math.max(0, Math.min(100, valueScore));

  score = marketScore * 0.3 + locationScore * 0.25 + amenitiesScore * 0.2 + trendsScore * 0.15 + valueScore * 0.1;
  score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));

  const grade = getGrade(score);

  return {
    score,
    grade,
    factors: [
      { name: 'Market Factors', value: marketScore, weight: 0.3, contribution: marketScore * 0.3, description: `Rent vs market: ${((rentRatio - 1) * 100).toFixed(0)}%` },
      { name: 'Location', value: locationScore, weight: 0.25, contribution: locationScore * 0.25, description: input.google_rating ? `${input.google_rating}/5 rating` : 'No rating' },
      { name: 'Amenities', value: amenitiesScore, weight: 0.2, contribution: amenitiesScore * 0.2, description: `${input.amenity_count} amenities` },
      { name: 'Price Trends', value: trendsScore, weight: 0.15, contribution: trendsScore * 0.15, description: `3mo: ${input.rent_trend_3mo}%` },
      { name: 'Value Position', value: valueScore, weight: 0.1, contribution: valueScore * 0.1, description: `$${input.price_per_sqft.toFixed(2)}/sqft` },
    ],
    summary: `This apartment scores ${score}/100 - ${grade.toLowerCase()}.`,
    recommendation: score >= 75 ? 'This is a solid choice.' : 'Consider comparing with other options.',
  };
}

function calculateNegotiationJS(input: NegotiationInput): NegotiationResult {
  let power = 30; // Base power

  // Vacancy leverage
  if (input.occupancy_rate < 85) power += 20;
  else if (input.occupancy_rate < 90) power += 10;
  else if (input.occupancy_rate < 95) power += 5;

  // Seasonality
  const month = input.current_month;
  if ([11, 12, 1, 2].includes(month)) power += 15;
  else if ([3, 4].includes(month)) power += 5;
  else if ([5, 6, 7, 8].includes(month)) power -= 10;

  // Tenure
  if (input.tenant_tenure_months >= 24) power += 15;
  else if (input.tenant_tenure_months >= 12) power += 10;
  else if (input.tenant_tenure_months >= 6) power += 5;

  // Payment history
  if (input.on_time_payment_rate >= 98) power += 15;
  else if (input.on_time_payment_rate >= 95) power += 10;

  // Market position
  const rentRatio = input.current_rent / input.market_rent;
  if (rentRatio >= 1.1) power += 10;
  else if (rentRatio >= 1.0) power += 5;

  // Competition
  power -= input.competing_offers * 5;

  power = Math.max(0, Math.min(100, power));

  // Calculate discount
  let maxDiscount = 0;
  if (power <= 30) maxDiscount = power / 10;
  else if (power <= 60) maxDiscount = 3 + (power - 30) / 6;
  else if (power <= 80) maxDiscount = 8 + (power - 60) / 5;
  else maxDiscount = 12 + (power - 80) / 6.67;

  const suggestedRent = Math.max(input.current_rent * (1 - maxDiscount / 100), input.market_rent * 0.85);

  return {
    negotiation_power: Math.round(power * 10) / 10,
    suggested_rent: Math.round(suggestedRent * 100) / 100,
    max_discount: Math.round(maxDiscount * 10) / 10,
    leverage_factors: [
      { name: 'Occupancy', points: input.occupancy_rate < 90 ? 10 : 0, description: `${input.occupancy_rate}% occupancy` },
      { name: 'Tenure', points: input.tenant_tenure_months >= 12 ? 10 : 0, description: `${input.tenant_tenure_months} months` },
    ],
    suggested_asks: [
      `Request ${maxDiscount.toFixed(0)}% rent reduction`,
      'Ask for waived fees',
    ],
    best_timing: [11, 12, 1, 2].includes(month) ? 'Now is a good time to negotiate' : 'Consider waiting for off-peak season',
    scripts: [
      { scenario: 'Opening', script: 'Hi, I\'d like to discuss my lease renewal...' },
    ],
  };
}

function calculateRenterScoreJS(input: RenterScoreInput): RenterScoreResult {
  if (input.eviction_history) {
    return {
      score: 0,
      grade: 'VeryPoor',
      tier: 'disqualified',
      factors: [{ name: 'Eviction', value: 0, weight: 1, contribution: 0, description: 'Previous eviction on record' }],
      improvement_tips: ['Contact us for assistance'],
      verified_badges: [],
    };
  }

  // Rental history (30%)
  let rentalScore = 50;
  if (input.rental_history_months >= 60) rentalScore += 30;
  else if (input.rental_history_months >= 36) rentalScore += 25;
  else if (input.rental_history_months >= 24) rentalScore += 20;
  else if (input.rental_history_months >= 12) rentalScore += 10;
  else if (input.rental_history_months < 6) rentalScore -= 15;
  if (input.verified_history) rentalScore += 10;

  // Employment (25%)
  let employmentScore = 50;
  if (input.employment_verified) employmentScore += 20;
  else employmentScore -= 10;
  const ratio = (input.monthly_rent * 12 / input.annual_income) * 100;
  if (ratio <= 25) employmentScore += 25;
  else if (ratio <= 30) employmentScore += 15;
  else if (ratio <= 35) employmentScore += 5;
  else if (ratio > 40) employmentScore -= 25;

  // Payment history (25%)
  let paymentScore = 50;
  const total = input.on_time_payments + input.late_payments + input.missed_payments;
  if (total > 0) {
    const rate = (input.on_time_payments / total) * 100;
    if (rate >= 98) paymentScore += 35;
    else if (rate >= 95) paymentScore += 25;
    else if (rate >= 90) paymentScore += 15;
    else if (rate < 70) paymentScore -= 30;
  }
  if (input.current_streak >= 24) paymentScore += 15;
  else if (input.current_streak >= 12) paymentScore += 10;

  // Verification (15%)
  let verificationScore = 30;
  if (input.identity_verified) verificationScore += 40;
  if (input.bank_linked) verificationScore += 30;

  // Financial (5%)
  let financialScore = 50;
  if (input.has_sufficient_balance) financialScore += 30;
  else financialScore -= 20;
  if (input.balance_check_passed) financialScore += 20;

  // Clamp
  rentalScore = Math.max(0, Math.min(100, rentalScore));
  employmentScore = Math.max(0, Math.min(100, employmentScore));
  paymentScore = Math.max(0, Math.min(100, paymentScore));
  verificationScore = Math.max(0, Math.min(100, verificationScore));
  financialScore = Math.max(0, Math.min(100, financialScore));

  const score = rentalScore * 0.3 + employmentScore * 0.25 + paymentScore * 0.25 + verificationScore * 0.15 + financialScore * 0.05;
  const finalScore = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
  const grade = getGrade(finalScore);
  const tier = getTier(finalScore);

  const badges: string[] = [];
  if (input.identity_verified) badges.push('identity_verified');
  if (input.bank_linked) badges.push('bank_linked');
  if (input.employment_verified) badges.push('employment_verified');

  return {
    score: finalScore,
    grade,
    tier,
    factors: [
      { name: 'Rental History', value: rentalScore, weight: 0.3, contribution: rentalScore * 0.3, description: `${input.rental_history_months} months` },
      { name: 'Employment & Income', value: employmentScore, weight: 0.25, contribution: employmentScore * 0.25, description: `${ratio.toFixed(0)}% rent-to-income` },
      { name: 'Payment History', value: paymentScore, weight: 0.25, contribution: paymentScore * 0.25, description: `${input.current_streak} month streak` },
      { name: 'Verification Status', value: verificationScore, weight: 0.15, contribution: verificationScore * 0.15, description: badges.length > 0 ? badges.join(', ') : 'None' },
      { name: 'Financial Standing', value: financialScore, weight: 0.05, contribution: financialScore * 0.05, description: input.has_sufficient_balance ? 'Sufficient' : 'Insufficient' },
    ],
    improvement_tips: generateImprovementTips(input, rentalScore, employmentScore, paymentScore, verificationScore),
    verified_badges: badges,
  };
}

function getGrade(score: number): ScoreGrade {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'VeryPoor';
}

function getTier(score: number): string {
  if (score >= 90) return 'platinum';
  if (score >= 75) return 'gold';
  if (score >= 60) return 'silver';
  return 'bronze';
}

function generateImprovementTips(
  input: RenterScoreInput,
  rentalScore: number,
  employmentScore: number,
  paymentScore: number,
  verificationScore: number
): string[] {
  const tips: string[] = [];

  if (!input.identity_verified) tips.push('Complete identity verification for +40 points');
  if (!input.bank_linked) tips.push('Link your bank account for +30 points');
  if (!input.employment_verified) tips.push('Connect Argyle to verify employment');
  if (input.current_streak < 6) tips.push('Build a payment streak by paying on-time');

  if (tips.length === 0) tips.push('Your score is excellent! Keep it up.');

  return tips.slice(0, 5);
}

// ============================================
// MARKET INTELLIGENCE JS FALLBACKS
// ============================================

function calculateDealScoreJS(input: DealScoreInput): DealScoreResult {
  // 1. Rent Position (35%)
  let rentScore = 50;
  if (input.market_rent > 0) {
    const diffPct = (input.market_rent - input.current_rent) / input.market_rent * 100;
    rentScore = Math.max(0, Math.min(100, 50 + diffPct * 2.5));
  }

  // 2. Occupancy Signal (20%)
  let occScore = 50;
  if (input.occupancy_rate < 80) occScore += 40;
  else if (input.occupancy_rate < 85) occScore += 30;
  else if (input.occupancy_rate < 90) occScore += 20;
  else if (input.occupancy_rate < 95) occScore += 5;
  else occScore -= 15;
  if (input.market_occupancy > 0) {
    occScore += (input.market_occupancy - input.occupancy_rate) * 1.5;
  }
  occScore = Math.max(0, Math.min(100, occScore));

  // 3. Concession Value (15%)
  let conScore = 50;
  if (input.concession_value > 0) {
    conScore += 15;
    if (input.market_concession_value > 0) {
      const ratio = input.concession_value / input.market_concession_value;
      if (ratio > 1.5) conScore += 25;
      else if (ratio > 1.0) conScore += 15;
      else conScore += 5;
    } else {
      conScore += 20;
    }
  } else if (input.market_concession_value > 0) {
    conScore -= 15;
  }
  conScore = Math.max(0, Math.min(100, conScore));

  // 4. Price/SqFt Value (15%)
  let sqftScore = 50;
  if (input.avg_rent_per_sqft > 0 && input.unit_sqft > 0) {
    const unitPpsqft = input.current_rent / input.unit_sqft;
    const ratio = unitPpsqft / input.avg_rent_per_sqft;
    if (ratio < 0.80) sqftScore = 95;
    else if (ratio < 0.90) sqftScore = 80;
    else if (ratio < 1.0) sqftScore = 65;
    else if (ratio < 1.10) sqftScore = 45;
    else if (ratio < 1.20) sqftScore = 30;
    else sqftScore = 15;
  }

  // 5. Trend Momentum (15%)
  let trendScore = 50;
  if (input.rent_trend_3mo < -3) trendScore += 30;
  else if (input.rent_trend_3mo < -1) trendScore += 20;
  else if (input.rent_trend_3mo < 0) trendScore += 10;
  else if (input.rent_trend_3mo > 3) trendScore -= 20;
  else if (input.rent_trend_3mo > 1) trendScore -= 10;
  if (input.rent_trend_12mo < -2) trendScore += 10;
  else if (input.rent_trend_12mo > 5) trendScore -= 10;
  trendScore = Math.max(0, Math.min(100, trendScore));

  const score = Math.round(
    (rentScore * 0.35 + occScore * 0.20 + conScore * 0.15 + sqftScore * 0.15 + trendScore * 0.15) * 10
  ) / 10;
  const finalScore = Math.max(0, Math.min(100, score));
  const grade = getGrade(finalScore);

  return {
    score: finalScore,
    grade,
    factors: [
      { name: 'Rent Position', value: rentScore, weight: 0.35, contribution: rentScore * 0.35, description: `${input.market_rent > 0 ? ((1 - input.current_rent / input.market_rent) * 100).toFixed(0) + '% vs market' : 'N/A'}` },
      { name: 'Occupancy Signal', value: occScore, weight: 0.20, contribution: occScore * 0.20, description: `${input.occupancy_rate}% occ` },
      { name: 'Concession Value', value: conScore, weight: 0.15, contribution: conScore * 0.15, description: `$${input.concession_value} concession` },
      { name: 'Price/SqFt Value', value: sqftScore, weight: 0.15, contribution: sqftScore * 0.15, description: input.unit_sqft > 0 ? `$${(input.current_rent / input.unit_sqft).toFixed(2)}/sqft` : 'N/A' },
      { name: 'Trend Momentum', value: trendScore, weight: 0.15, contribution: trendScore * 0.15, description: `3-mo: ${input.rent_trend_3mo > 0 ? '+' : ''}${input.rent_trend_3mo}%` },
    ],
    summary: `Deal Score ${finalScore}/100 — ${grade.toLowerCase()} deal.`,
    recommendation: finalScore >= 75 ? 'This is a strong deal. Apply soon.' : 'Consider negotiating or comparing alternatives.',
  };
}

function calculateLeverageScoreJS(input: LeverageScoreInput): LeverageScoreResult {
  // 1. Vacancy Leverage (30%)
  let vacScore = 40;
  const occDiff = input.market_occupancy - input.occupancy_rate;
  if (occDiff > 10) vacScore += 50;
  else if (occDiff > 5) vacScore += 35;
  else if (occDiff > 0) vacScore += 15;
  else vacScore -= 10;
  if (input.occupancy_rate < 80) vacScore += 10;
  else if (input.occupancy_rate > 97) vacScore -= 20;
  vacScore = Math.max(0, Math.min(100, vacScore));

  // 2. Seasonality (20%)
  const seasonScores: Record<number, number> = { 11: 85, 12: 85, 1: 85, 2: 85, 3: 60, 4: 60, 5: 25, 6: 25, 7: 25, 8: 25, 9: 50, 10: 50 };
  const seasonScore = seasonScores[input.current_month] ?? 50;

  // 3. Market Position (20%)
  const pctAbove = (input.rent_vs_market_pct - 1.0) * 100;
  let mktScore = pctAbove > 15 ? 95 : pctAbove > 10 ? 80 : pctAbove > 5 ? 65 : pctAbove > 0 ? 50 : pctAbove > -5 ? 35 : 20;

  // 4. Property Weakness (15%)
  let weakScore = 40;
  if (input.building_age > 40) weakScore += 25;
  else if (input.building_age > 25) weakScore += 15;
  else if (input.building_age > 15) weakScore += 5;
  else if (input.building_age < 5) weakScore -= 15;
  if (input.google_rating !== undefined) {
    if (input.google_rating < 3.0) weakScore += 25;
    else if (input.google_rating < 3.5) weakScore += 15;
    else if (input.google_rating < 4.0) weakScore += 5;
    else if (input.google_rating >= 4.5) weakScore -= 10;
  }
  if (input.property_units > 300) weakScore += 10;
  else if (input.property_units > 150) weakScore += 5;
  weakScore = Math.max(0, Math.min(100, weakScore));

  // 5. Concession Climate (15%)
  let climateScore = input.concession_prevalence > 60 ? 90 : input.concession_prevalence > 40 ? 75 : input.concession_prevalence > 20 ? 55 : input.concession_prevalence > 5 ? 35 : 20;

  const score = Math.round(
    (vacScore * 0.30 + seasonScore * 0.20 + mktScore * 0.20 + weakScore * 0.15 + climateScore * 0.15) * 10
  ) / 10;
  const finalScore = Math.max(0, Math.min(100, score));
  const grade = getGrade(finalScore);

  const tips: string[] = [];
  if (input.occupancy_rate < 90) tips.push('Vacancy is your strongest card — mention you have other options.');
  if (input.rent_vs_market_pct > 1.05) tips.push('Your rent is above market average. Present comparable listings as evidence.');
  if (input.concession_prevalence > 30) tips.push('Competitors are offering concessions. Ask for matching incentives.');
  if (tips.length === 0) tips.push('Market conditions are tight. Focus on demonstrating your value as a reliable tenant.');

  const bestTiming = [11, 12, 1, 2].includes(input.current_month)
    ? 'Now is an excellent time to negotiate. Winter months have the lowest demand.'
    : [5, 6, 7, 8].includes(input.current_month)
    ? 'Consider waiting until fall/winter for better leverage.'
    : 'Current timing is moderate for negotiations.';

  return {
    score: finalScore,
    grade,
    factors: [
      { name: 'Vacancy Leverage', value: vacScore, weight: 0.30, contribution: vacScore * 0.30, description: `${input.occupancy_rate}% occupancy` },
      { name: 'Seasonality', value: seasonScore, weight: 0.20, contribution: seasonScore * 0.20, description: `Month ${input.current_month}` },
      { name: 'Market Position', value: mktScore, weight: 0.20, contribution: mktScore * 0.20, description: `${pctAbove > 0 ? '+' : ''}${pctAbove.toFixed(0)}% vs market` },
      { name: 'Property Weakness', value: weakScore, weight: 0.15, contribution: weakScore * 0.15, description: `${input.building_age}yr old, ${input.property_units} units` },
      { name: 'Concession Climate', value: climateScore, weight: 0.15, contribution: climateScore * 0.15, description: `${input.concession_prevalence}% offering concessions` },
    ],
    negotiation_tips: tips,
    best_timing: bestTiming,
  };
}

function calculateRenewalStrategyJS(input: RenewalStrategyInput): RenewalStrategyResult {
  let leverage = 30;
  const rentRatio = input.market_rent > 0 ? input.current_rent / input.market_rent : 1;

  if (rentRatio > 1.15) leverage += 25;
  else if (rentRatio > 1.05) leverage += 15;
  else if (rentRatio > 1.0) leverage += 5;
  else if (rentRatio < 0.90) leverage -= 15;

  if (input.occupancy_rate < 85) leverage += 20;
  else if (input.occupancy_rate < 90) leverage += 10;
  else if (input.occupancy_rate < 95) leverage += 5;
  else leverage -= 5;

  const tenureYears = input.tenant_tenure_months / 12;
  const loyaltyDiscount = Math.min(tenureYears * 2, 10);
  const paymentBonus = input.on_time_payment_rate >= 98 ? 5 : input.on_time_payment_rate >= 95 ? 3 : 0;

  const seasonalAdj = [11, 12, 1, 2].includes(input.lease_end_month) ? 5 : [5, 6, 7, 8].includes(input.lease_end_month) ? -5 : 0;
  if (input.rent_trend_3mo < -2) leverage += 10;
  else if (input.rent_trend_3mo < 0) leverage += 5;
  leverage += seasonalAdj;
  leverage = Math.max(0, Math.min(100, leverage));

  const baseDiscount = leverage > 70 ? 8 : leverage > 50 ? 5 : leverage > 30 ? 3 : 1;
  const maxDiscount = Math.min(baseDiscount + loyaltyDiscount + paymentBonus, 20);
  const targetRent = Math.round(input.current_rent * (1 - maxDiscount / 100) * 100) / 100;

  let action: string;
  if (rentRatio > 1.10 && input.occupancy_rate < 92) action = 'negotiate';
  else if (rentRatio < 0.95 || (input.occupancy_rate > 97 && rentRatio < 1.05)) action = 'renew';
  else if (leverage > 60) action = 'negotiate';
  else if (maxDiscount < 3 && input.occupancy_rate > 95) action = 'explore';
  else action = 'negotiate';

  const talkingPoints: string[] = [];
  if (input.tenant_tenure_months >= 12) talkingPoints.push(`You've been a reliable tenant for ${input.tenant_tenure_months} months — turnover costs landlords $3,000-$5,000.`);
  if (input.on_time_payment_rate >= 95) talkingPoints.push(`Your ${input.on_time_payment_rate.toFixed(0)}% on-time payment rate makes you a low-risk tenant.`);
  if (input.current_rent > input.market_rent && input.market_rent > 0) talkingPoints.push(`Your rent is ${((rentRatio - 1) * 100).toFixed(0)}% above current market rate.`);
  if (talkingPoints.length === 0) talkingPoints.push('Emphasize your reliability and interest in a long-term stay.');

  const monthsBeforeEnd = input.lease_end_month >= input.current_month
    ? input.lease_end_month - input.current_month
    : 12 - input.current_month + input.lease_end_month;
  const timingAdvice = monthsBeforeEnd >= 3 && monthsBeforeEnd <= 4
    ? 'Perfect timing — 60-90 days before lease end is the ideal negotiation window.'
    : monthsBeforeEnd > 4
    ? `Your lease ends in ~${monthsBeforeEnd} months. Start the conversation 60-90 days before expiration.`
    : 'Initiate negotiations immediately to avoid defaulting to month-to-month rates.';

  return {
    recommended_action: action,
    target_rent: targetRent,
    max_discount_pct: Math.round(maxDiscount * 10) / 10,
    leverage_score: Math.round(leverage * 10) / 10,
    talking_points: talkingPoints,
    scripts: [
      { scenario: 'Opening Request', script: `Hi, I'd like to discuss my lease renewal. I've been a great tenant for ${input.tenant_tenure_months} months. Would you consider renewing at $${targetRent}/month?` },
      { scenario: 'Alternative Ask', script: 'If a rent reduction isn\'t possible, I\'d be open to other concessions — waived parking fees, a storage unit, or a month of free rent.' },
    ],
    timing_advice: timingAdvice,
  };
}
