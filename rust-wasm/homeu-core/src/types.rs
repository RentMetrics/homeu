//! Shared type definitions for HomeU scoring system

use serde::{Deserialize, Serialize};

// ============================================
// COMMON TYPES
// ============================================

/// Score grade based on numeric score
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScoreGrade {
    Excellent,  // 90-100
    Good,       // 75-89
    Fair,       // 60-74
    Poor,       // 40-59
    VeryPoor,   // 0-39
}

impl ScoreGrade {
    pub fn from_score(score: f64) -> Self {
        match score as u32 {
            90..=100 => ScoreGrade::Excellent,
            75..=89 => ScoreGrade::Good,
            60..=74 => ScoreGrade::Fair,
            40..=59 => ScoreGrade::Poor,
            _ => ScoreGrade::VeryPoor,
        }
    }

    pub fn label(&self) -> &str {
        match self {
            ScoreGrade::Excellent => "Excellent",
            ScoreGrade::Good => "Good",
            ScoreGrade::Fair => "Fair",
            ScoreGrade::Poor => "Poor",
            ScoreGrade::VeryPoor => "Very Poor",
        }
    }

    pub fn color(&self) -> &str {
        match self {
            ScoreGrade::Excellent => "green",
            ScoreGrade::Good => "blue",
            ScoreGrade::Fair => "yellow",
            ScoreGrade::Poor => "orange",
            ScoreGrade::VeryPoor => "red",
        }
    }
}

/// Factor contributing to a score
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoreFactor {
    pub name: String,
    pub value: f64,
    pub weight: f64,
    pub contribution: f64,
    pub description: String,
}

/// Risk category for tenant risk scoring
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RiskCategory {
    Low,
    Moderate,
    High,
    Critical,
}

impl RiskCategory {
    pub fn from_score(risk_score: f64) -> Self {
        match risk_score as u32 {
            0..=25 => RiskCategory::Low,
            26..=50 => RiskCategory::Moderate,
            51..=75 => RiskCategory::High,
            _ => RiskCategory::Critical,
        }
    }

    pub fn label(&self) -> &str {
        match self {
            RiskCategory::Low => "Low Risk",
            RiskCategory::Moderate => "Moderate Risk",
            RiskCategory::High => "High Risk",
            RiskCategory::Critical => "Critical Risk",
        }
    }
}

/// Credit tier based on credit score
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CreditTier {
    Excellent, // 750+
    Good,      // 700-749
    Fair,      // 650-699
    Poor,      // 550-649
    VeryPoor,  // Below 550
}

impl CreditTier {
    pub fn from_score(credit_score: u32) -> Self {
        match credit_score {
            750.. => CreditTier::Excellent,
            700..=749 => CreditTier::Good,
            650..=699 => CreditTier::Fair,
            550..=649 => CreditTier::Poor,
            _ => CreditTier::VeryPoor,
        }
    }

    pub fn deposit_multiplier(&self) -> f64 {
        match self {
            CreditTier::Excellent => 1.0,
            CreditTier::Good => 1.0,
            CreditTier::Fair => 1.5,
            CreditTier::Poor => 2.0,
            CreditTier::VeryPoor => 2.5,
        }
    }

    pub fn label(&self) -> &str {
        match self {
            CreditTier::Excellent => "Excellent",
            CreditTier::Good => "Good",
            CreditTier::Fair => "Fair",
            CreditTier::Poor => "Poor",
            CreditTier::VeryPoor => "Very Poor",
        }
    }
}

// ============================================
// INPUT TYPES - RESIDENT SCORING
// ============================================

/// Input data for apartment desirability calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesirabilityInput {
    // Market factors
    pub current_rent: f64,
    pub market_rent: f64,
    pub occupancy_rate: f64,       // 0-100
    pub rent_trend_3mo: f64,       // percentage change
    pub rent_trend_12mo: f64,      // percentage change

    // Location factors
    pub google_rating: Option<f64>, // 0-5
    pub walkability_score: Option<u32>, // 0-100
    pub transit_score: Option<u32>,     // 0-100

    // Amenities
    pub amenity_count: u32,
    pub building_year: u32,
    pub unit_sqft: f64,

    // Value
    pub price_per_sqft: f64,
    pub market_price_per_sqft: f64,
    pub has_concessions: bool,
    pub concession_value: f64,
}

/// Input data for rent negotiation calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NegotiationInput {
    pub current_rent: f64,
    pub market_rent: f64,
    pub occupancy_rate: f64,
    pub current_month: u32,          // 1-12
    pub tenant_tenure_months: u32,
    pub on_time_payment_rate: f64,   // 0-100
    pub market_rent_growth: f64,     // annual percentage
    pub competing_offers: u32,
}

/// Input data for HomeU Renter Score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenterScoreInput {
    // Rental history
    pub rental_history_months: u32,
    pub verified_history: bool,
    pub previous_residences: u32,
    pub eviction_history: bool,

    // Employment/Income
    pub employment_verified: bool,
    pub annual_income: f64,
    pub monthly_rent: f64,
    pub employment_tenure_months: u32,

    // Payment history (from HomeU platform)
    pub on_time_payments: u32,
    pub late_payments: u32,
    pub missed_payments: u32,
    pub current_streak: u32,
    pub longest_streak: u32,

    // Verification status
    pub identity_verified: bool,
    pub bank_linked: bool,

    // Financial standing
    pub has_sufficient_balance: bool,
    pub balance_check_passed: bool,
}

// ============================================
// INPUT TYPES - MARKET INTELLIGENCE
// ============================================

/// Input for Deal Score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DealScoreInput {
    pub current_rent: f64,
    pub market_rent: f64,
    pub avg_rent_per_sqft: f64,
    pub unit_sqft: f64,
    pub occupancy_rate: f64,      // 0-100
    pub market_occupancy: f64,    // 0-100
    pub concession_value: f64,
    pub market_concession_value: f64,
    pub rent_trend_3mo: f64,      // % change
    pub rent_trend_12mo: f64,     // % change
    pub google_rating: Option<f64>,
    pub building_year: u32,
    pub amenity_count: u32,
}

/// Input for Leverage Score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeverageScoreInput {
    pub occupancy_rate: f64,
    pub market_occupancy: f64,
    pub current_month: u32,       // 1-12
    pub rent_vs_market_pct: f64,  // e.g., 1.05 = 5% above market
    pub concession_prevalence: f64, // % of properties offering concessions
    pub building_age: u32,
    pub google_rating: Option<f64>,
    pub property_units: u32,
}

/// Input for Renewal Strategy calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenewalStrategyInput {
    pub current_rent: f64,
    pub market_rent: f64,
    pub occupancy_rate: f64,
    pub tenant_tenure_months: u32,
    pub on_time_payment_rate: f64, // 0-100
    pub current_month: u32,        // 1-12
    pub rent_trend_3mo: f64,
    pub concession_value: f64,
    pub lease_end_month: u32,      // 1-12
}

// ============================================
// OUTPUT TYPES - MARKET INTELLIGENCE
// ============================================

/// Result of Deal Score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DealScoreResult {
    pub score: f64,            // 0-100
    pub grade: ScoreGrade,
    pub factors: Vec<ScoreFactor>,
    pub summary: String,
    pub recommendation: String,
}

/// Result of Leverage Score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeverageScoreResult {
    pub score: f64,            // 0-100
    pub grade: ScoreGrade,
    pub factors: Vec<ScoreFactor>,
    pub negotiation_tips: Vec<String>,
    pub best_timing: String,
}

/// Result of Renewal Strategy calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenewalStrategyResult {
    pub recommended_action: String, // "negotiate", "renew", "explore"
    pub target_rent: f64,
    pub max_discount_pct: f64,
    pub leverage_score: f64,
    pub talking_points: Vec<String>,
    pub scripts: Vec<NegotiationScript>,
    pub timing_advice: String,
}

// ============================================
// INPUT TYPES - PROPERTY MANAGER SCORING
// ============================================

/// Input data for single tenant risk assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantRiskInput {
    pub renter_id: String,
    pub renter_name: String,
    pub property_id: String,
    pub property_address: String,

    // Payment history
    pub on_time_payments: u32,
    pub late_payments: u32,
    pub average_days_late: f64,
    pub missed_payments: u32,

    // Balance check
    pub has_sufficient_balance: bool,
    pub balance_check_date: Option<i64>,
    pub account_status: String, // "active", "inactive", "unknown"

    // Income/Employment
    pub rent_amount: f64,
    pub verified_income: Option<f64>,
    pub employment_verified: bool,

    // Lease info
    pub lease_months_remaining: u32,
    pub is_month_to_month: bool,
    pub lease_start_date: i64,
}

/// Input for credit worthiness assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreditworthinessInput {
    pub renter_id: String,

    // Actual credit score if available
    pub actual_credit_score: Option<u32>,

    // HomeU data for proxy calculation
    pub on_time_payments: u32,
    pub late_payments: u32,
    pub missed_payments: u32,
    pub rental_tenure_months: u32,
    pub employment_months: u32,
    pub employment_verified: bool,
    pub income_consistency: f64, // 0-100, how consistent income is
    pub previous_evictions: u32,
}

/// Input for collection likelihood forecast
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionForecastInput {
    pub property_manager_id: String,
    pub organization_id: String,
    pub forecast_month: String, // "YYYY-MM"
    pub tenants: Vec<TenantRiskInput>,
    pub historical_collection_rate: f64, // 0-100
    pub seasonal_adjustment: bool,
}

// ============================================
// OUTPUT TYPES - RESIDENT SCORING
// ============================================

/// Result of apartment desirability calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesirabilityResult {
    pub score: f64,            // 0-100
    pub grade: ScoreGrade,
    pub factors: Vec<ScoreFactor>,
    pub summary: String,
    pub recommendation: String,
}

/// Result of rent negotiation calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NegotiationResult {
    pub negotiation_power: f64, // 0-100
    pub suggested_rent: f64,
    pub max_discount: f64,
    pub leverage_factors: Vec<LeverageFactor>,
    pub suggested_asks: Vec<String>,
    pub best_timing: String,
    pub scripts: Vec<NegotiationScript>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeverageFactor {
    pub name: String,
    pub points: f64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NegotiationScript {
    pub scenario: String,
    pub script: String,
}

/// Result of HomeU Renter Score calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenterScoreResult {
    pub score: f64,            // 0-100
    pub grade: ScoreGrade,
    pub tier: String,          // "bronze", "silver", "gold", "platinum"
    pub factors: Vec<ScoreFactor>,
    pub improvement_tips: Vec<String>,
    pub verified_badges: Vec<String>,
}

// ============================================
// OUTPUT TYPES - PROPERTY MANAGER SCORING
// ============================================

/// Result of single tenant risk assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantRiskResult {
    pub renter_id: String,
    pub renter_name: String,
    pub property_address: String,
    pub risk_score: f64,       // 0-100, higher = riskier
    pub payment_likelihood: f64, // 0-100
    pub risk_category: RiskCategory,
    pub factors: Vec<ScoreFactor>,
    pub recommended_actions: Vec<String>,
}

/// Result of credit worthiness assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreditworthinessResult {
    pub renter_id: String,
    pub credit_score: u32,     // 300-850
    pub is_proxy: bool,        // true if calculated from HomeU data
    pub credit_tier: CreditTier,
    pub deposit_multiplier: f64,
    pub factors: Vec<ScoreFactor>,
    pub recommendations: Vec<String>,
}

/// Result of collection likelihood forecast
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionForecastResult {
    pub forecast_month: String,
    pub total_expected_rent: f64,
    pub expected_collection_rate: f64, // 0-100
    pub expected_collection_amount: f64,
    pub expected_shortfall: f64,
    pub confidence_interval: ConfidenceInterval,
    pub at_risk_tenants: Vec<AtRiskTenant>,
    pub monthly_forecasts: Vec<MonthlyForecast>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfidenceInterval {
    pub lower: f64,
    pub upper: f64,
    pub confidence: f64, // e.g., 0.95 for 95%
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtRiskTenant {
    pub renter_id: String,
    pub renter_name: String,
    pub property_address: String,
    pub rent_amount: f64,
    pub risk_score: f64,
    pub payment_likelihood: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyForecast {
    pub month: String,
    pub expected_rate: f64,
    pub expected_amount: f64,
    pub confidence: f64,
}

/// Portfolio risk snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioRiskResult {
    pub property_manager_id: String,
    pub snapshot_date: i64,
    pub overall_risk_score: f64,
    pub total_tenants: u32,
    pub risk_distribution: RiskDistribution,
    pub total_monthly_rent: f64,
    pub expected_collection: f64,
    pub forecasts: Vec<CollectionForecastResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskDistribution {
    pub low: u32,
    pub moderate: u32,
    pub high: u32,
    pub critical: u32,
}
