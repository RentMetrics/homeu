/**
 * TypeScript type definitions for HomeU WASM scoring modules
 */

// ============================================
// COMMON TYPES
// ============================================

export type ScoreGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'VeryPoor';

export interface ScoreFactor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
  description: string;
}

export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Critical';

export type CreditTier = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'VeryPoor';

// ============================================
// RESIDENT SCORING TYPES
// ============================================

/** Input for apartment desirability calculation */
export interface DesirabilityInput {
  // Market factors
  current_rent: number;
  market_rent: number;
  occupancy_rate: number; // 0-100
  rent_trend_3mo: number; // percentage change
  rent_trend_12mo: number; // percentage change

  // Location factors
  google_rating?: number; // 0-5
  walkability_score?: number; // 0-100
  transit_score?: number; // 0-100

  // Amenities
  amenity_count: number;
  building_year: number;
  unit_sqft: number;

  // Value
  price_per_sqft: number;
  market_price_per_sqft: number;
  has_concessions: boolean;
  concession_value: number;
}

/** Result of apartment desirability calculation */
export interface DesirabilityResult {
  score: number; // 0-100
  grade: ScoreGrade;
  factors: ScoreFactor[];
  summary: string;
  recommendation: string;
}

/** Input for rent negotiation calculation */
export interface NegotiationInput {
  current_rent: number;
  market_rent: number;
  occupancy_rate: number;
  current_month: number; // 1-12
  tenant_tenure_months: number;
  on_time_payment_rate: number; // 0-100
  market_rent_growth: number; // annual percentage
  competing_offers: number;
}

export interface LeverageFactor {
  name: string;
  points: number;
  description: string;
}

export interface NegotiationScript {
  scenario: string;
  script: string;
}

/** Result of rent negotiation calculation */
export interface NegotiationResult {
  negotiation_power: number; // 0-100
  suggested_rent: number;
  max_discount: number;
  leverage_factors: LeverageFactor[];
  suggested_asks: string[];
  best_timing: string;
  scripts: NegotiationScript[];
}

/** Input for HomeU Renter Score calculation */
export interface RenterScoreInput {
  // Rental history
  rental_history_months: number;
  verified_history: boolean;
  previous_residences: number;
  eviction_history: boolean;

  // Employment/Income
  employment_verified: boolean;
  annual_income: number;
  monthly_rent: number;
  employment_tenure_months: number;

  // Payment history
  on_time_payments: number;
  late_payments: number;
  missed_payments: number;
  current_streak: number;
  longest_streak: number;

  // Verification status
  identity_verified: boolean;
  bank_linked: boolean;

  // Financial standing
  has_sufficient_balance: boolean;
  balance_check_passed: boolean;
}

/** Result of HomeU Renter Score calculation */
export interface RenterScoreResult {
  score: number; // 0-100
  grade: ScoreGrade;
  tier: string; // "bronze", "silver", "gold", "platinum"
  factors: ScoreFactor[];
  improvement_tips: string[];
  verified_badges: string[];
}

// ============================================
// MARKET INTELLIGENCE TYPES
// ============================================

/** Input for Deal Score calculation */
export interface DealScoreInput {
  current_rent: number;
  market_rent: number;
  avg_rent_per_sqft: number;
  unit_sqft: number;
  occupancy_rate: number;       // 0-100
  market_occupancy: number;     // 0-100
  concession_value: number;
  market_concession_value: number;
  rent_trend_3mo: number;       // % change
  rent_trend_12mo: number;      // % change
  google_rating?: number;
  building_year: number;
  amenity_count: number;
}

/** Result of Deal Score calculation */
export interface DealScoreResult {
  score: number;              // 0-100
  grade: ScoreGrade;
  factors: ScoreFactor[];
  summary: string;
  recommendation: string;
}

/** Input for Leverage Score calculation */
export interface LeverageScoreInput {
  occupancy_rate: number;
  market_occupancy: number;
  current_month: number;        // 1-12
  rent_vs_market_pct: number;   // e.g., 1.05 = 5% above market
  concession_prevalence: number; // % of properties offering concessions
  building_age: number;
  google_rating?: number;
  property_units: number;
}

/** Result of Leverage Score calculation */
export interface LeverageScoreResult {
  score: number;              // 0-100
  grade: ScoreGrade;
  factors: ScoreFactor[];
  negotiation_tips: string[];
  best_timing: string;
}

/** Input for Renewal Strategy calculation */
export interface RenewalStrategyInput {
  current_rent: number;
  market_rent: number;
  occupancy_rate: number;
  tenant_tenure_months: number;
  on_time_payment_rate: number;  // 0-100
  current_month: number;         // 1-12
  rent_trend_3mo: number;
  concession_value: number;
  lease_end_month: number;       // 1-12
}

/** Result of Renewal Strategy calculation */
export interface RenewalStrategyResult {
  recommended_action: string;   // "negotiate" | "renew" | "explore"
  target_rent: number;
  max_discount_pct: number;
  leverage_score: number;
  talking_points: string[];
  scripts: NegotiationScript[];
  timing_advice: string;
}

// ============================================
// PROPERTY MANAGER SCORING TYPES
// ============================================

/** Input for single tenant risk assessment */
export interface TenantRiskInput {
  renter_id: string;
  renter_name: string;
  property_id: string;
  property_address: string;

  // Payment history
  on_time_payments: number;
  late_payments: number;
  average_days_late: number;
  missed_payments: number;

  // Balance check
  has_sufficient_balance: boolean;
  balance_check_date?: number;
  account_status: string; // "active", "inactive", "unknown"

  // Income/Employment
  rent_amount: number;
  verified_income?: number;
  employment_verified: boolean;

  // Lease info
  lease_months_remaining: number;
  is_month_to_month: boolean;
  lease_start_date: number;
}

/** Result of single tenant risk assessment */
export interface TenantRiskResult {
  renter_id: string;
  renter_name: string;
  property_address: string;
  risk_score: number; // 0-100, higher = riskier
  payment_likelihood: number; // 0-100
  risk_category: RiskCategory;
  factors: ScoreFactor[];
  recommended_actions: string[];
}

/** Input for credit worthiness assessment */
export interface CreditworthinessInput {
  renter_id: string;

  // Actual credit score if available
  actual_credit_score?: number;

  // HomeU data for proxy calculation
  on_time_payments: number;
  late_payments: number;
  missed_payments: number;
  rental_tenure_months: number;
  employment_months: number;
  employment_verified: boolean;
  income_consistency: number; // 0-100
  previous_evictions: number;
}

/** Result of credit worthiness assessment */
export interface CreditworthinessResult {
  renter_id: string;
  credit_score: number; // 300-850
  is_proxy: boolean;
  credit_tier: CreditTier;
  deposit_multiplier: number;
  factors: ScoreFactor[];
  recommendations: string[];
}

/** Input for collection likelihood forecast */
export interface CollectionForecastInput {
  property_manager_id: string;
  organization_id: string;
  forecast_month: string; // "YYYY-MM"
  tenants: TenantRiskInput[];
  historical_collection_rate: number; // 0-100
  seasonal_adjustment: boolean;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number; // e.g., 0.95 for 95%
}

export interface AtRiskTenant {
  renter_id: string;
  renter_name: string;
  property_address: string;
  rent_amount: number;
  risk_score: number;
  payment_likelihood: number;
}

export interface MonthlyForecast {
  month: string;
  expected_rate: number;
  expected_amount: number;
  confidence: number;
}

/** Result of collection likelihood forecast */
export interface CollectionForecastResult {
  forecast_month: string;
  total_expected_rent: number;
  expected_collection_rate: number; // 0-100
  expected_collection_amount: number;
  expected_shortfall: number;
  confidence_interval: ConfidenceInterval;
  at_risk_tenants: AtRiskTenant[];
  monthly_forecasts: MonthlyForecast[];
}

export interface RiskDistribution {
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

/** Portfolio risk snapshot */
export interface PortfolioRiskResult {
  property_manager_id: string;
  snapshot_date: number;
  overall_risk_score: number;
  total_tenants: number;
  risk_distribution: RiskDistribution;
  total_monthly_rent: number;
  expected_collection: number;
  forecasts: CollectionForecastResult[];
}

/** Input for portfolio risk calculation */
export interface PortfolioRiskInput {
  property_manager_id: string;
  organization_id: string;
  tenants: TenantRiskInput[];
  historical_collection_rate: number;
  forecast_months: string[]; // e.g., ["2024-06", "2024-07", "2024-08"]
}

/** Portfolio summary statistics */
export interface PortfolioSummary {
  total_tenants: number;
  total_monthly_rent: number;
  average_risk_score: number;
  median_risk_score: number;
  highest_risk_tenant?: string;
  lowest_risk_tenant?: string;
  at_risk_count: number;
  at_risk_rent_exposure: number;
}

// ============================================
// GRADE UTILITIES
// ============================================

export function getGradeColor(grade: ScoreGrade): string {
  const colors: Record<ScoreGrade, string> = {
    Excellent: 'green',
    Good: 'blue',
    Fair: 'yellow',
    Poor: 'orange',
    VeryPoor: 'red',
  };
  return colors[grade];
}

export function getGradeLabel(grade: ScoreGrade): string {
  const labels: Record<ScoreGrade, string> = {
    Excellent: 'Excellent',
    Good: 'Good',
    Fair: 'Fair',
    Poor: 'Poor',
    VeryPoor: 'Very Poor',
  };
  return labels[grade];
}

export function getRiskCategoryColor(category: RiskCategory): string {
  const colors: Record<RiskCategory, string> = {
    Low: 'green',
    Moderate: 'yellow',
    High: 'orange',
    Critical: 'red',
  };
  return colors[category];
}

export function getCreditTierColor(tier: CreditTier): string {
  const colors: Record<CreditTier, string> = {
    Excellent: 'green',
    Good: 'blue',
    Fair: 'yellow',
    Poor: 'orange',
    VeryPoor: 'red',
  };
  return colors[tier];
}

export function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  };
  return labels[tier] || tier;
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  };
  return colors[tier] || '#888888';
}
