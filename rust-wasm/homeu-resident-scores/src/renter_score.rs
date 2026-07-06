//! HomeU Renter Score Calculator
//!
//! Calculates a unified tenant quality score (0-100) based on:
//! - Rental History (30%): tenure, stability, verified history
//! - Employment/Income (25%): verified, rent-to-income ratio
//! - Payment History (25%): on-time rate, streaks
//! - Verification Status (15%): identity, bank linked
//! - Financial Standing (5%): sufficient balance checks

use homeu_core::{
    types::*,
    utils::*,
    weights::{RenterScoreWeights, TierThresholds},
};
use wasm_bindgen::prelude::*;

/// Calculate HomeU Renter Score from JSON input
#[wasm_bindgen]
pub fn calculate_renter_score(input_json: &str) -> Result<String, JsValue> {
    let input: RenterScoreInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_renter_score_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Core renter score calculation logic
pub fn calculate_renter_score_internal(input: &RenterScoreInput) -> RenterScoreResult {
    let weights = RenterScoreWeights::default();
    let tiers = TierThresholds::default();
    let mut factors = Vec::new();

    // Check for disqualifying factors
    if input.eviction_history {
        return create_disqualified_result("Previous eviction on record");
    }

    // 1. Rental History (30%)
    let rental_score = calculate_rental_history_score(input);
    factors.push(ScoreFactor {
        name: "Rental History".to_string(),
        value: rental_score,
        weight: weights.rental_history,
        contribution: rental_score * weights.rental_history,
        description: format_rental_history_description(input, rental_score),
    });

    // 2. Employment/Income (25%)
    let employment_score = calculate_employment_score(input);
    factors.push(ScoreFactor {
        name: "Employment & Income".to_string(),
        value: employment_score,
        weight: weights.employment_income,
        contribution: employment_score * weights.employment_income,
        description: format_employment_description(input, employment_score),
    });

    // 3. Payment History (25%)
    let payment_score = calculate_payment_history_score(input);
    factors.push(ScoreFactor {
        name: "Payment History".to_string(),
        value: payment_score,
        weight: weights.payment_history,
        contribution: payment_score * weights.payment_history,
        description: format_payment_description(input, payment_score),
    });

    // 4. Verification Status (15%)
    let verification_score = calculate_verification_score(input);
    factors.push(ScoreFactor {
        name: "Verification Status".to_string(),
        value: verification_score,
        weight: weights.verification_status,
        contribution: verification_score * weights.verification_status,
        description: format_verification_description(input, verification_score),
    });

    // 5. Financial Standing (5%)
    let financial_score = calculate_financial_standing_score(input);
    factors.push(ScoreFactor {
        name: "Financial Standing".to_string(),
        value: financial_score,
        weight: weights.financial_standing,
        contribution: financial_score * weights.financial_standing,
        description: format_financial_description(input, financial_score),
    });

    // Calculate final score
    let final_score = factors.iter().map(|f| f.contribution).sum::<f64>();
    let final_score = clamp(final_score, 0.0, 100.0);
    let grade = ScoreGrade::from_score(final_score);
    let tier = tiers.get_tier(final_score).to_string();

    // Generate improvement tips
    let improvement_tips = generate_improvement_tips(&factors, input);

    // Generate verified badges
    let verified_badges = generate_verified_badges(input);

    RenterScoreResult {
        score: (final_score * 10.0).round() / 10.0,
        grade,
        tier,
        factors,
        improvement_tips,
        verified_badges,
    }
}

fn calculate_rental_history_score(input: &RenterScoreInput) -> f64 {
    let mut score = 50.0;

    // Tenure length (+/-30 points)
    if input.rental_history_months >= 60 {
        score += 30.0; // 5+ years
    } else if input.rental_history_months >= 36 {
        score += 25.0; // 3+ years
    } else if input.rental_history_months >= 24 {
        score += 20.0; // 2+ years
    } else if input.rental_history_months >= 12 {
        score += 10.0; // 1+ year
    } else if input.rental_history_months >= 6 {
        score += 0.0; // 6 months - neutral
    } else {
        score -= 15.0; // Less than 6 months
    }

    // Verified history bonus
    if input.verified_history {
        score += 10.0;
    }

    // Previous residences (stability indicator)
    // 1-3 in last 5 years is ideal
    let residences_in_5_years = input.previous_residences;
    if residences_in_5_years <= 2 {
        score += 10.0; // Stable
    } else if residences_in_5_years <= 3 {
        score += 5.0;
    } else if residences_in_5_years >= 5 {
        score -= 10.0; // Frequent moves
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_employment_score(input: &RenterScoreInput) -> f64 {
    let mut score = 50.0;

    // Employment verified
    if input.employment_verified {
        score += 20.0;
    } else {
        score -= 10.0;
    }

    // Rent-to-income ratio
    let ratio = rent_to_income_ratio(input.monthly_rent, input.annual_income);
    if ratio <= 25.0 {
        score += 25.0; // Excellent affordability
    } else if ratio <= 30.0 {
        score += 15.0; // Good affordability
    } else if ratio <= 35.0 {
        score += 5.0;  // Acceptable
    } else if ratio <= 40.0 {
        score -= 10.0; // Stretched
    } else {
        score -= 25.0; // High risk
    }

    // Employment tenure
    if input.employment_tenure_months >= 24 {
        score += 10.0;
    } else if input.employment_tenure_months >= 12 {
        score += 5.0;
    } else if input.employment_tenure_months < 3 {
        score -= 5.0;
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_payment_history_score(input: &RenterScoreInput) -> f64 {
    let mut score = 50.0;

    let total_payments = input.on_time_payments + input.late_payments + input.missed_payments;

    if total_payments == 0 {
        // No payment history - neutral but not penalized heavily
        return 50.0;
    }

    let on_time_rate = (input.on_time_payments as f64 / total_payments as f64) * 100.0;

    // On-time rate scoring
    if on_time_rate >= 98.0 {
        score += 35.0;
    } else if on_time_rate >= 95.0 {
        score += 25.0;
    } else if on_time_rate >= 90.0 {
        score += 15.0;
    } else if on_time_rate >= 80.0 {
        score += 0.0;
    } else if on_time_rate >= 70.0 {
        score -= 15.0;
    } else {
        score -= 30.0;
    }

    // Missed payments penalty
    score -= input.missed_payments as f64 * 10.0;

    // Current streak bonus
    if input.current_streak >= 24 {
        score += 15.0;
    } else if input.current_streak >= 12 {
        score += 10.0;
    } else if input.current_streak >= 6 {
        score += 5.0;
    }

    // Longest streak consideration
    if input.longest_streak >= 36 {
        score += 5.0;
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_verification_score(input: &RenterScoreInput) -> f64 {
    let mut score = 30.0; // Start lower, verification adds points

    // Identity verified (major factor)
    if input.identity_verified {
        score += 40.0;
    }

    // Bank linked
    if input.bank_linked {
        score += 30.0;
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_financial_standing_score(input: &RenterScoreInput) -> f64 {
    let mut score = 50.0;

    // Sufficient balance for rent
    if input.has_sufficient_balance {
        score += 30.0;
    } else {
        score -= 20.0;
    }

    // Balance check passed
    if input.balance_check_passed {
        score += 20.0;
    }

    clamp(score, 0.0, 100.0)
}

fn format_rental_history_description(input: &RenterScoreInput, score: f64) -> String {
    let years = input.rental_history_months / 12;
    let months = input.rental_history_months % 12;
    let verified_str = if input.verified_history { " (verified)" } else { "" };

    if years > 0 {
        format!("{} years {} months rental history{}", years, months, verified_str)
    } else {
        format!("{} months rental history{}", months, verified_str)
    }
}

fn format_employment_description(input: &RenterScoreInput, score: f64) -> String {
    let ratio = rent_to_income_ratio(input.monthly_rent, input.annual_income);
    let verified_str = if input.employment_verified { "Verified" } else { "Unverified" };

    format!(
        "{} employment, {:.0}% rent-to-income ratio",
        verified_str, ratio
    )
}

fn format_payment_description(input: &RenterScoreInput, score: f64) -> String {
    let total = input.on_time_payments + input.late_payments + input.missed_payments;
    if total == 0 {
        return "No payment history on HomeU yet".to_string();
    }

    let on_time_rate = (input.on_time_payments as f64 / total as f64) * 100.0;
    format!(
        "{:.0}% on-time ({} of {}), {} month current streak",
        on_time_rate, input.on_time_payments, total, input.current_streak
    )
}

fn format_verification_description(input: &RenterScoreInput, score: f64) -> String {
    let mut verifications = Vec::new();
    if input.identity_verified {
        verifications.push("Identity");
    }
    if input.bank_linked {
        verifications.push("Bank");
    }

    if verifications.is_empty() {
        "No verifications completed".to_string()
    } else {
        format!("Verified: {}", verifications.join(", "))
    }
}

fn format_financial_description(input: &RenterScoreInput, score: f64) -> String {
    if input.has_sufficient_balance && input.balance_check_passed {
        "Sufficient funds verified".to_string()
    } else if input.bank_linked {
        "Bank linked, awaiting balance check".to_string()
    } else {
        "Link bank account for balance verification".to_string()
    }
}

fn generate_improvement_tips(factors: &[ScoreFactor], input: &RenterScoreInput) -> Vec<String> {
    let mut tips = Vec::new();

    // Find lowest scoring factors
    for factor in factors {
        if factor.value < 60.0 {
            match factor.name.as_str() {
                "Rental History" => {
                    if !input.verified_history {
                        tips.push("Verify your rental history to boost your score".to_string());
                    }
                    if input.rental_history_months < 12 {
                        tips.push("Continue building your rental history on HomeU".to_string());
                    }
                }
                "Employment & Income" => {
                    if !input.employment_verified {
                        tips.push("Connect Argyle to verify your employment".to_string());
                    }
                    let ratio = rent_to_income_ratio(input.monthly_rent, input.annual_income);
                    if ratio > 30.0 {
                        tips.push("Consider finding a roommate or more affordable housing to improve your rent-to-income ratio".to_string());
                    }
                }
                "Payment History" => {
                    if input.current_streak < 6 {
                        tips.push("Build a payment streak by paying rent on-time each month".to_string());
                    }
                    if input.late_payments > 0 {
                        tips.push("Set up auto-pay to ensure on-time payments".to_string());
                    }
                }
                "Verification Status" => {
                    if !input.identity_verified {
                        tips.push("Complete identity verification for +40 points".to_string());
                    }
                    if !input.bank_linked {
                        tips.push("Link your bank account for +30 points".to_string());
                    }
                }
                "Financial Standing" => {
                    if !input.bank_linked {
                        tips.push("Link your bank account to verify your balance".to_string());
                    }
                }
                _ => {}
            }
        }
    }

    // Limit to top 5 tips
    tips.truncate(5);

    if tips.is_empty() {
        tips.push("Your score is excellent! Keep up the great rental history.".to_string());
    }

    tips
}

fn generate_verified_badges(input: &RenterScoreInput) -> Vec<String> {
    let mut badges = Vec::new();

    if input.identity_verified {
        badges.push("identity_verified".to_string());
    }
    if input.bank_linked {
        badges.push("bank_linked".to_string());
    }
    if input.employment_verified {
        badges.push("employment_verified".to_string());
    }
    if input.verified_history {
        badges.push("rental_history_verified".to_string());
    }

    // Payment streak badges
    if input.current_streak >= 24 {
        badges.push("streak_champion".to_string());
    } else if input.current_streak >= 12 {
        badges.push("year_streak".to_string());
    } else if input.current_streak >= 6 {
        badges.push("half_year_streak".to_string());
    }

    // On-time payment badges
    let total = input.on_time_payments + input.late_payments + input.missed_payments;
    if total > 0 {
        let rate = (input.on_time_payments as f64 / total as f64) * 100.0;
        if rate >= 100.0 && total >= 12 {
            badges.push("perfect_payer".to_string());
        } else if rate >= 95.0 && total >= 6 {
            badges.push("reliable_payer".to_string());
        }
    }

    badges
}

fn create_disqualified_result(reason: &str) -> RenterScoreResult {
    RenterScoreResult {
        score: 0.0,
        grade: ScoreGrade::VeryPoor,
        tier: "disqualified".to_string(),
        factors: vec![ScoreFactor {
            name: "Disqualifying Factor".to_string(),
            value: 0.0,
            weight: 1.0,
            contribution: 0.0,
            description: reason.to_string(),
        }],
        improvement_tips: vec![
            "Contact us for assistance with your situation".to_string(),
        ],
        verified_badges: vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_input() -> RenterScoreInput {
        RenterScoreInput {
            rental_history_months: 36,
            verified_history: true,
            previous_residences: 2,
            eviction_history: false,
            employment_verified: true,
            annual_income: 75000.0,
            monthly_rent: 1800.0,
            employment_tenure_months: 24,
            on_time_payments: 24,
            late_payments: 1,
            missed_payments: 0,
            current_streak: 12,
            longest_streak: 18,
            identity_verified: true,
            bank_linked: true,
            has_sufficient_balance: true,
            balance_check_passed: true,
        }
    }

    #[test]
    fn test_renter_score_calculation() {
        let input = sample_input();
        let result = calculate_renter_score_internal(&input);

        assert!(result.score > 0.0);
        assert!(result.score <= 100.0);
        assert!(!result.tier.is_empty());
        assert!(!result.factors.is_empty());
    }

    #[test]
    fn test_eviction_disqualification() {
        let mut input = sample_input();
        input.eviction_history = true;

        let result = calculate_renter_score_internal(&input);

        assert_eq!(result.score, 0.0);
        assert_eq!(result.tier, "disqualified");
    }

    #[test]
    fn test_excellent_score() {
        let mut input = sample_input();
        input.on_time_payments = 48;
        input.late_payments = 0;
        input.current_streak = 48;
        input.longest_streak = 48;
        input.rental_history_months = 60;

        let result = calculate_renter_score_internal(&input);

        assert!(result.score >= 90.0);
        assert_eq!(result.tier, "platinum");
    }
}
