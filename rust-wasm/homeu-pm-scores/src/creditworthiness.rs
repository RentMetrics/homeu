//! Credit Worthiness Assessment
//!
//! Calculates credit score (300-850) either from:
//! - Actual credit score if available
//! - Proxy score built from HomeU data

use homeu_core::{
    types::*,
    utils::*,
    weights::CreditProxyAdjustments,
};
use wasm_bindgen::prelude::*;

/// Calculate credit worthiness from JSON input
#[wasm_bindgen]
pub fn calculate_creditworthiness(input_json: &str) -> Result<String, JsValue> {
    let input: CreditworthinessInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_creditworthiness_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Calculate credit worthiness for multiple renters
#[wasm_bindgen]
pub fn calculate_creditworthiness_batch(input_json: &str) -> Result<String, JsValue> {
    let inputs: Vec<CreditworthinessInput> = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let results: Vec<CreditworthinessResult> = inputs
        .iter()
        .map(calculate_creditworthiness_internal)
        .collect();

    serde_json::to_string(&results)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Core creditworthiness calculation
pub fn calculate_creditworthiness_internal(input: &CreditworthinessInput) -> CreditworthinessResult {
    // Use actual credit score if available
    if let Some(actual_score) = input.actual_credit_score {
        return create_actual_score_result(&input.renter_id, actual_score);
    }

    // Otherwise, calculate proxy score
    calculate_proxy_score(input)
}

fn create_actual_score_result(renter_id: &str, score: u32) -> CreditworthinessResult {
    let tier = CreditTier::from_score(score);
    let deposit_multiplier = tier.deposit_multiplier();

    CreditworthinessResult {
        renter_id: renter_id.to_string(),
        credit_score: score,
        is_proxy: false,
        credit_tier: tier.clone(),
        deposit_multiplier,
        factors: vec![ScoreFactor {
            name: "Credit Bureau Score".to_string(),
            value: score as f64,
            weight: 1.0,
            contribution: score as f64,
            description: format!("Actual credit score from bureau: {}", score),
        }],
        recommendations: generate_recommendations_for_tier(&tier, false),
    }
}

fn calculate_proxy_score(input: &CreditworthinessInput) -> CreditworthinessResult {
    let adjustments = CreditProxyAdjustments::default();
    let mut factors = Vec::new();
    let mut score = adjustments.base_score as i32;

    // 1. Payment History Adjustment (+/-100)
    let payment_adjustment = calculate_payment_adjustment(input, &adjustments);
    factors.push(ScoreFactor {
        name: "Payment History".to_string(),
        value: payment_adjustment as f64,
        weight: 1.0,
        contribution: payment_adjustment as f64,
        description: format_payment_adjustment_description(input, payment_adjustment),
    });
    score += payment_adjustment;

    // 2. Rental Tenure Adjustment (+/-50)
    let tenure_adjustment = calculate_tenure_adjustment(input, &adjustments);
    factors.push(ScoreFactor {
        name: "Rental Tenure".to_string(),
        value: tenure_adjustment as f64,
        weight: 1.0,
        contribution: tenure_adjustment as f64,
        description: format_tenure_description(input, tenure_adjustment),
    });
    score += tenure_adjustment;

    // 3. Employment Stability Adjustment (+/-50)
    let employment_adjustment = calculate_employment_adjustment(input, &adjustments);
    factors.push(ScoreFactor {
        name: "Employment Stability".to_string(),
        value: employment_adjustment as f64,
        weight: 1.0,
        contribution: employment_adjustment as f64,
        description: format_employment_adjustment_description(input, employment_adjustment),
    });
    score += employment_adjustment;

    // 4. Income Consistency Adjustment (+/-30)
    let income_adjustment = calculate_income_adjustment(input, &adjustments);
    factors.push(ScoreFactor {
        name: "Income Consistency".to_string(),
        value: income_adjustment as f64,
        weight: 1.0,
        contribution: income_adjustment as f64,
        description: format_income_description(input, income_adjustment),
    });
    score += income_adjustment;

    // 5. Eviction History Penalty
    let eviction_penalty = input.previous_evictions as i32 * adjustments.eviction_penalty;
    if eviction_penalty < 0 {
        factors.push(ScoreFactor {
            name: "Eviction History".to_string(),
            value: eviction_penalty as f64,
            weight: 1.0,
            contribution: eviction_penalty as f64,
            description: format!("{} previous eviction(s)", input.previous_evictions),
        });
        score += eviction_penalty;
    }

    // Clamp to valid credit score range
    let final_score = clamp(score as f64, 300.0, 850.0) as u32;
    let tier = CreditTier::from_score(final_score);
    let deposit_multiplier = tier.deposit_multiplier();

    CreditworthinessResult {
        renter_id: input.renter_id.clone(),
        credit_score: final_score,
        is_proxy: true,
        credit_tier: tier.clone(),
        deposit_multiplier,
        factors,
        recommendations: generate_recommendations_for_tier(&tier, true),
    }
}

fn calculate_payment_adjustment(input: &CreditworthinessInput, adj: &CreditProxyAdjustments) -> i32 {
    let total = input.on_time_payments + input.late_payments + input.missed_payments;

    if total == 0 {
        return 0; // No data
    }

    let on_time_rate = input.on_time_payments as f64 / total as f64;

    // Missed payments are heavily penalized
    if input.missed_payments >= 3 {
        return adj.missed_payments;
    }

    // Calculate adjustment based on on-time rate
    if on_time_rate >= 0.98 {
        adj.perfect_payments
    } else if on_time_rate >= 0.95 {
        adj.good_payments
    } else if on_time_rate >= 0.85 {
        adj.some_late
    } else if on_time_rate >= 0.70 {
        adj.many_late
    } else {
        adj.missed_payments
    }
}

fn calculate_tenure_adjustment(input: &CreditworthinessInput, adj: &CreditProxyAdjustments) -> i32 {
    if input.rental_tenure_months >= 24 {
        adj.long_tenure
    } else if input.rental_tenure_months >= 12 {
        adj.medium_tenure
    } else if input.rental_tenure_months >= 6 {
        adj.short_tenure
    } else {
        adj.new_renter
    }
}

fn calculate_employment_adjustment(input: &CreditworthinessInput, adj: &CreditProxyAdjustments) -> i32 {
    if !input.employment_verified {
        return adj.unverified;
    }

    if input.employment_months >= 24 {
        adj.verified_stable
    } else {
        adj.verified_recent
    }
}

fn calculate_income_adjustment(input: &CreditworthinessInput, adj: &CreditProxyAdjustments) -> i32 {
    if input.income_consistency >= 80.0 {
        adj.consistent_income
    } else if input.income_consistency >= 50.0 {
        0 // Neutral
    } else {
        adj.variable_income
    }
}

fn format_payment_adjustment_description(input: &CreditworthinessInput, adjustment: i32) -> String {
    let total = input.on_time_payments + input.late_payments + input.missed_payments;
    if total == 0 {
        return "No payment history available".to_string();
    }

    let rate = (input.on_time_payments as f64 / total as f64) * 100.0;
    let direction = if adjustment > 0 { "+" } else { "" };
    format!("{:.0}% on-time payment rate ({}{} points)", rate, direction, adjustment)
}

fn format_tenure_description(input: &CreditworthinessInput, adjustment: i32) -> String {
    let years = input.rental_tenure_months / 12;
    let months = input.rental_tenure_months % 12;
    let direction = if adjustment > 0 { "+" } else { "" };

    if years > 0 {
        format!("{} years {} months rental history ({}{} points)", years, months, direction, adjustment)
    } else {
        format!("{} months rental history ({}{} points)", months, direction, adjustment)
    }
}

fn format_employment_adjustment_description(input: &CreditworthinessInput, adjustment: i32) -> String {
    let status = if input.employment_verified { "Verified" } else { "Unverified" };
    let direction = if adjustment > 0 { "+" } else { "" };
    format!("{} employment, {} months ({}{} points)", status, input.employment_months, direction, adjustment)
}

fn format_income_description(input: &CreditworthinessInput, adjustment: i32) -> String {
    let direction = if adjustment > 0 { "+" } else if adjustment < 0 { "" } else { "+" };
    format!("{:.0}% income consistency ({}{} points)", input.income_consistency, direction, adjustment)
}

fn generate_recommendations_for_tier(tier: &CreditTier, is_proxy: bool) -> Vec<String> {
    let mut recommendations = Vec::new();

    match tier {
        CreditTier::Excellent => {
            recommendations.push("Tenant is an excellent credit risk".to_string());
            recommendations.push("Standard deposit recommended".to_string());
        }
        CreditTier::Good => {
            recommendations.push("Tenant is a good credit risk".to_string());
            recommendations.push("Standard deposit recommended".to_string());
        }
        CreditTier::Fair => {
            recommendations.push("Tenant presents moderate credit risk".to_string());
            recommendations.push("Consider 1.5x deposit".to_string());
            if is_proxy {
                recommendations.push("Request actual credit report for verification".to_string());
            }
        }
        CreditTier::Poor => {
            recommendations.push("Tenant presents higher credit risk".to_string());
            recommendations.push("Recommend 2x deposit".to_string());
            recommendations.push("Consider requiring guarantor".to_string());
            if is_proxy {
                recommendations.push("Strongly recommend actual credit check".to_string());
            }
        }
        CreditTier::VeryPoor => {
            recommendations.push("Significant credit risk".to_string());
            recommendations.push("Recommend 2.5x deposit or guarantor required".to_string());
            recommendations.push("Consider additional screening".to_string());
            if is_proxy {
                recommendations.push("Actual credit check required before approval".to_string());
            }
        }
    }

    if is_proxy {
        recommendations.push("Note: Score is estimated from HomeU data, not bureau report".to_string());
    }

    recommendations
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_input() -> CreditworthinessInput {
        CreditworthinessInput {
            renter_id: "user_123".to_string(),
            actual_credit_score: None,
            on_time_payments: 22,
            late_payments: 2,
            missed_payments: 0,
            rental_tenure_months: 24,
            employment_months: 36,
            employment_verified: true,
            income_consistency: 85.0,
            previous_evictions: 0,
        }
    }

    #[test]
    fn test_proxy_score_calculation() {
        let input = sample_input();
        let result = calculate_creditworthiness_internal(&input);

        assert!(result.credit_score >= 300 && result.credit_score <= 850);
        assert!(result.is_proxy);
        assert!(!result.factors.is_empty());
    }

    #[test]
    fn test_actual_score_used() {
        let mut input = sample_input();
        input.actual_credit_score = Some(750);

        let result = calculate_creditworthiness_internal(&input);

        assert_eq!(result.credit_score, 750);
        assert!(!result.is_proxy);
    }

    #[test]
    fn test_eviction_penalty() {
        let mut input = sample_input();
        input.previous_evictions = 1;

        let result = calculate_creditworthiness_internal(&input);

        // Score should be lower due to eviction
        let no_eviction_input = sample_input();
        let no_eviction_result = calculate_creditworthiness_internal(&no_eviction_input);

        assert!(result.credit_score < no_eviction_result.credit_score);
    }
}
