//! Scoring weight configurations for HomeU scoring modules

use serde::{Deserialize, Serialize};

// ============================================
// APARTMENT DESIRABILITY WEIGHTS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesirabilityWeights {
    pub market_factors: f64,  // 30%
    pub location: f64,        // 25%
    pub amenities: f64,       // 20%
    pub price_trends: f64,    // 15%
    pub value_position: f64,  // 10%
}

impl Default for DesirabilityWeights {
    fn default() -> Self {
        Self {
            market_factors: 0.30,
            location: 0.25,
            amenities: 0.20,
            price_trends: 0.15,
            value_position: 0.10,
        }
    }
}

// ============================================
// HOMEU RENTER SCORE WEIGHTS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenterScoreWeights {
    pub rental_history: f64,      // 30%
    pub employment_income: f64,   // 25%
    pub payment_history: f64,     // 25%
    pub verification_status: f64, // 15%
    pub financial_standing: f64,  // 5%
}

impl Default for RenterScoreWeights {
    fn default() -> Self {
        Self {
            rental_history: 0.30,
            employment_income: 0.25,
            payment_history: 0.25,
            verification_status: 0.15,
            financial_standing: 0.05,
        }
    }
}

// ============================================
// RENT ROLL RISK SCORE WEIGHTS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantRiskWeights {
    pub payment_history: f64,   // 40%
    pub balance_check: f64,     // 25%
    pub income_stability: f64,  // 20%
    pub lease_status: f64,      // 15%
}

impl Default for TenantRiskWeights {
    fn default() -> Self {
        Self {
            payment_history: 0.40,
            balance_check: 0.25,
            income_stability: 0.20,
            lease_status: 0.15,
        }
    }
}

// ============================================
// NEGOTIATION LEVERAGE POINTS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NegotiationPoints {
    // Vacancy leverage
    pub vacancy_high: f64,      // Occupancy < 85%: +20
    pub vacancy_medium: f64,    // Occupancy 85-90%: +10
    pub vacancy_low: f64,       // Occupancy 90-95%: +5

    // Seasonality
    pub winter_bonus: f64,      // Nov-Feb: +15
    pub spring_bonus: f64,      // Mar-Apr: +5
    pub summer_penalty: f64,    // May-Aug: -10

    // Tenant value
    pub long_tenure: f64,       // 24+ months: +15
    pub medium_tenure: f64,     // 12-24 months: +10
    pub short_tenure: f64,      // 6-12 months: +5
    pub excellent_payment: f64, // 98%+ on-time: +15
    pub good_payment: f64,      // 95%+ on-time: +10

    // Market comparison
    pub above_market: f64,      // Paying 10%+ above market: +10
    pub at_market: f64,         // At market rate: +5
}

impl Default for NegotiationPoints {
    fn default() -> Self {
        Self {
            vacancy_high: 20.0,
            vacancy_medium: 10.0,
            vacancy_low: 5.0,
            winter_bonus: 15.0,
            spring_bonus: 5.0,
            summer_penalty: -10.0,
            long_tenure: 15.0,
            medium_tenure: 10.0,
            short_tenure: 5.0,
            excellent_payment: 15.0,
            good_payment: 10.0,
            above_market: 10.0,
            at_market: 5.0,
        }
    }
}

// ============================================
// DEAL SCORE WEIGHTS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DealScoreWeights {
    pub rent_position: f64,     // 35%
    pub occupancy_signal: f64,  // 20%
    pub concession_value: f64,  // 15%
    pub price_sqft_value: f64,  // 15%
    pub trend_momentum: f64,    // 15%
}

impl Default for DealScoreWeights {
    fn default() -> Self {
        Self {
            rent_position: 0.35,
            occupancy_signal: 0.20,
            concession_value: 0.15,
            price_sqft_value: 0.15,
            trend_momentum: 0.15,
        }
    }
}

// ============================================
// LEVERAGE SCORE WEIGHTS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeverageScoreWeights {
    pub vacancy_leverage: f64,    // 30%
    pub seasonality: f64,         // 20%
    pub market_position: f64,     // 20%
    pub property_weakness: f64,   // 15%
    pub concession_climate: f64,  // 15%
}

impl Default for LeverageScoreWeights {
    fn default() -> Self {
        Self {
            vacancy_leverage: 0.30,
            seasonality: 0.20,
            market_position: 0.20,
            property_weakness: 0.15,
            concession_climate: 0.15,
        }
    }
}

// ============================================
// CREDIT PROXY SCORE ADJUSTMENTS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreditProxyAdjustments {
    pub base_score: u32,           // Starting point: 650

    // Payment history adjustments (+/-100)
    pub perfect_payments: i32,      // +100
    pub good_payments: i32,         // +50
    pub some_late: i32,             // -30
    pub many_late: i32,             // -60
    pub missed_payments: i32,       // -100

    // Rental tenure (+/-50)
    pub long_tenure: i32,           // 24+ months: +50
    pub medium_tenure: i32,         // 12-24 months: +25
    pub short_tenure: i32,          // 6-12 months: +10
    pub new_renter: i32,            // <6 months: -10

    // Employment stability (+/-50)
    pub verified_stable: i32,       // Verified, 24+ months: +50
    pub verified_recent: i32,       // Verified, <24 months: +25
    pub unverified: i32,            // Not verified: -25

    // Income consistency (+/-30)
    pub consistent_income: i32,     // +30
    pub variable_income: i32,       // -15

    // Eviction history
    pub eviction_penalty: i32,      // Per eviction: -150
}

impl Default for CreditProxyAdjustments {
    fn default() -> Self {
        Self {
            base_score: 650,
            perfect_payments: 100,
            good_payments: 50,
            some_late: -30,
            many_late: -60,
            missed_payments: -100,
            long_tenure: 50,
            medium_tenure: 25,
            short_tenure: 10,
            new_renter: -10,
            verified_stable: 50,
            verified_recent: 25,
            unverified: -25,
            consistent_income: 30,
            variable_income: -15,
            eviction_penalty: -150,
        }
    }
}

// ============================================
// TIER THRESHOLDS
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TierThresholds {
    pub platinum: f64,  // 90+
    pub gold: f64,      // 75+
    pub silver: f64,    // 60+
    pub bronze: f64,    // 0+
}

impl Default for TierThresholds {
    fn default() -> Self {
        Self {
            platinum: 90.0,
            gold: 75.0,
            silver: 60.0,
            bronze: 0.0,
        }
    }
}

impl TierThresholds {
    pub fn get_tier(&self, score: f64) -> &str {
        if score >= self.platinum {
            "platinum"
        } else if score >= self.gold {
            "gold"
        } else if score >= self.silver {
            "silver"
        } else {
            "bronze"
        }
    }
}

// ============================================
// GLOBAL CONFIGURATION
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScoringConfig {
    pub desirability: DesirabilityWeights,
    pub renter_score: RenterScoreWeights,
    pub tenant_risk: TenantRiskWeights,
    pub negotiation: NegotiationPoints,
    pub credit_proxy: CreditProxyAdjustments,
    pub tiers: TierThresholds,
}

impl ScoringConfig {
    pub fn new() -> Self {
        Self::default()
    }
}
