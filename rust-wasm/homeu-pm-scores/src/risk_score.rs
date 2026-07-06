//! Rent Roll Risk Score Calculator
//!
//! Calculates per-tenant risk score (0-100, higher = riskier) based on:
//! - Payment History (40%): late rate, days late, missed payments
//! - Balance Check (25%): sufficient funds, account status
//! - Income Stability (20%): rent-to-income ratio, employment verification
//! - Lease Status (15%): months remaining, month-to-month flag

use homeu_core::{
    types::*,
    utils::*,
    weights::TenantRiskWeights,
};
use wasm_bindgen::prelude::*;

/// Calculate tenant risk score from JSON input
#[wasm_bindgen]
pub fn calculate_tenant_risk(input_json: &str) -> Result<String, JsValue> {
    let input: TenantRiskInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_tenant_risk_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Calculate risk scores for multiple tenants
#[wasm_bindgen]
pub fn calculate_tenant_risks_batch(input_json: &str) -> Result<String, JsValue> {
    let inputs: Vec<TenantRiskInput> = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let results: Vec<TenantRiskResult> = inputs
        .iter()
        .map(calculate_tenant_risk_internal)
        .collect();

    serde_json::to_string(&results)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Core tenant risk calculation
pub fn calculate_tenant_risk_internal(input: &TenantRiskInput) -> TenantRiskResult {
    let weights = TenantRiskWeights::default();
    let mut factors = Vec::new();

    // 1. Payment History Risk (40%)
    let payment_risk = calculate_payment_history_risk(input);
    factors.push(ScoreFactor {
        name: "Payment History".to_string(),
        value: payment_risk,
        weight: weights.payment_history,
        contribution: payment_risk * weights.payment_history,
        description: format_payment_risk_description(input, payment_risk),
    });

    // 2. Balance Check Risk (25%)
    let balance_risk = calculate_balance_risk(input);
    factors.push(ScoreFactor {
        name: "Balance Status".to_string(),
        value: balance_risk,
        weight: weights.balance_check,
        contribution: balance_risk * weights.balance_check,
        description: format_balance_risk_description(input, balance_risk),
    });

    // 3. Income Stability Risk (20%)
    let income_risk = calculate_income_stability_risk(input);
    factors.push(ScoreFactor {
        name: "Income Stability".to_string(),
        value: income_risk,
        weight: weights.income_stability,
        contribution: income_risk * weights.income_stability,
        description: format_income_risk_description(input, income_risk),
    });

    // 4. Lease Status Risk (15%)
    let lease_risk = calculate_lease_status_risk(input);
    factors.push(ScoreFactor {
        name: "Lease Status".to_string(),
        value: lease_risk,
        weight: weights.lease_status,
        contribution: lease_risk * weights.lease_status,
        description: format_lease_risk_description(input, lease_risk),
    });

    // Calculate final risk score (0-100, higher = riskier)
    let risk_score = factors.iter().map(|f| f.contribution).sum::<f64>();
    let risk_score = clamp(risk_score, 0.0, 100.0);
    let risk_category = RiskCategory::from_score(risk_score);

    // Payment likelihood is inverse of risk
    let payment_likelihood = 100.0 - risk_score;

    // Generate recommended actions
    let recommended_actions = generate_recommended_actions(&risk_category, &factors, input);

    TenantRiskResult {
        renter_id: input.renter_id.clone(),
        renter_name: input.renter_name.clone(),
        property_address: input.property_address.clone(),
        risk_score: (risk_score * 10.0).round() / 10.0,
        payment_likelihood: (payment_likelihood * 10.0).round() / 10.0,
        risk_category,
        factors,
        recommended_actions,
    }
}

fn calculate_payment_history_risk(input: &TenantRiskInput) -> f64 {
    let total_payments = input.on_time_payments + input.late_payments + input.missed_payments;

    if total_payments == 0 {
        // No history - moderate risk
        return 50.0;
    }

    let mut risk = 0.0;

    // Late payment rate (0-50 risk points)
    let late_rate = (input.late_payments + input.missed_payments) as f64 / total_payments as f64;
    risk += late_rate * 50.0;

    // Average days late (0-25 risk points)
    if input.average_days_late > 0.0 {
        let days_late_risk = (input.average_days_late / 30.0).min(1.0) * 25.0;
        risk += days_late_risk;
    }

    // Missed payments penalty (0-25 risk points)
    let missed_risk = (input.missed_payments as f64 * 8.0).min(25.0);
    risk += missed_risk;

    clamp(risk, 0.0, 100.0)
}

fn calculate_balance_risk(input: &TenantRiskInput) -> f64 {
    let mut risk = 50.0; // Default moderate risk

    // Sufficient balance check
    if input.has_sufficient_balance {
        risk -= 40.0;
    } else {
        risk += 30.0;
    }

    // Account status
    match input.account_status.as_str() {
        "active" => risk -= 10.0,
        "inactive" => risk += 20.0,
        "unknown" | _ => risk += 10.0,
    }

    // Balance check freshness (if available)
    if let Some(check_date) = input.balance_check_date {
        let now = get_current_timestamp_ms();
        let days_since = (now - check_date) / (1000 * 60 * 60 * 24);

        if days_since > 30 {
            risk += 10.0; // Stale data adds risk
        } else if days_since > 14 {
            risk += 5.0;
        }
    } else {
        risk += 15.0; // No balance check
    }

    clamp(risk, 0.0, 100.0)
}

fn calculate_income_stability_risk(input: &TenantRiskInput) -> f64 {
    let mut risk = 50.0;

    // Employment verification
    if input.employment_verified {
        risk -= 20.0;
    } else {
        risk += 15.0;
    }

    // Rent-to-income ratio (if income is verified)
    if let Some(income) = input.verified_income {
        let ratio = rent_to_income_ratio(input.rent_amount, income);

        if ratio <= 25.0 {
            risk -= 25.0; // Very comfortable
        } else if ratio <= 30.0 {
            risk -= 15.0; // Comfortable
        } else if ratio <= 35.0 {
            risk -= 5.0;  // Acceptable
        } else if ratio <= 40.0 {
            risk += 10.0; // Stretched
        } else if ratio <= 50.0 {
            risk += 25.0; // High risk
        } else {
            risk += 40.0; // Very high risk
        }
    } else {
        // No verified income - add uncertainty risk
        risk += 10.0;
    }

    clamp(risk, 0.0, 100.0)
}

fn calculate_lease_status_risk(input: &TenantRiskInput) -> f64 {
    let mut risk = 30.0; // Base risk

    // Month-to-month is higher risk
    if input.is_month_to_month {
        risk += 40.0;
    } else {
        // Lease duration risk
        if input.lease_months_remaining >= 6 {
            risk -= 20.0; // Good runway
        } else if input.lease_months_remaining >= 3 {
            risk -= 10.0;
        } else if input.lease_months_remaining == 1 {
            risk += 15.0; // Lease ending soon
        } else if input.lease_months_remaining == 0 {
            risk += 30.0; // Lease expired
        }
    }

    // Tenure bonus (longer tenants = lower risk)
    let now = get_current_timestamp_ms();
    let tenure_months = months_between(input.lease_start_date, now);

    if tenure_months >= 24 {
        risk -= 15.0;
    } else if tenure_months >= 12 {
        risk -= 10.0;
    } else if tenure_months < 3 {
        risk += 10.0; // New tenant
    }

    clamp(risk, 0.0, 100.0)
}

fn format_payment_risk_description(input: &TenantRiskInput, risk: f64) -> String {
    let total = input.on_time_payments + input.late_payments + input.missed_payments;
    if total == 0 {
        return "No payment history available".to_string();
    }

    let on_time_rate = (input.on_time_payments as f64 / total as f64) * 100.0;
    format!(
        "{:.0}% on-time rate, {} late, {} missed, avg {:.0} days late",
        on_time_rate, input.late_payments, input.missed_payments, input.average_days_late
    )
}

fn format_balance_risk_description(input: &TenantRiskInput, risk: f64) -> String {
    let balance_status = if input.has_sufficient_balance {
        "sufficient funds"
    } else {
        "insufficient funds"
    };

    format!("Account {}, {}", input.account_status, balance_status)
}

fn format_income_risk_description(input: &TenantRiskInput, risk: f64) -> String {
    let verified = if input.employment_verified { "Verified" } else { "Unverified" };

    if let Some(income) = input.verified_income {
        let ratio = rent_to_income_ratio(input.rent_amount, income);
        format!("{} income, {:.0}% rent-to-income ratio", verified, ratio)
    } else {
        format!("{} employment, no income data", verified)
    }
}

fn format_lease_risk_description(input: &TenantRiskInput, risk: f64) -> String {
    if input.is_month_to_month {
        "Month-to-month lease".to_string()
    } else {
        format!("{} months remaining on lease", input.lease_months_remaining)
    }
}

fn generate_recommended_actions(
    category: &RiskCategory,
    factors: &[ScoreFactor],
    input: &TenantRiskInput,
) -> Vec<String> {
    let mut actions = Vec::new();

    match category {
        RiskCategory::Critical => {
            actions.push("Immediate attention required".to_string());
            actions.push("Consider payment plan discussion".to_string());
            if !input.has_sufficient_balance {
                actions.push("Request updated bank information".to_string());
            }
            if input.lease_months_remaining <= 1 {
                actions.push("Evaluate lease renewal terms carefully".to_string());
            }
        }
        RiskCategory::High => {
            actions.push("Schedule check-in with tenant".to_string());
            if input.late_payments > 2 {
                actions.push("Send payment reminder 5 days before due date".to_string());
            }
            if !input.employment_verified {
                actions.push("Request employment verification".to_string());
            }
        }
        RiskCategory::Moderate => {
            actions.push("Monitor payment pattern".to_string());
            if input.is_month_to_month {
                actions.push("Consider offering lease renewal with incentive".to_string());
            }
        }
        RiskCategory::Low => {
            actions.push("Tenant in good standing".to_string());
            if input.on_time_payments >= 12 {
                actions.push("Consider rent increase at renewal".to_string());
            }
        }
    }

    // Find highest risk factor and add specific action
    if let Some(highest_risk) = factors.iter().max_by(|a, b| {
        a.contribution.partial_cmp(&b.contribution).unwrap_or(std::cmp::Ordering::Equal)
    }) {
        if highest_risk.contribution > 20.0 {
            let action = match highest_risk.name.as_str() {
                "Payment History" => "Consider late fee enforcement or payment plan",
                "Balance Status" => "Update balance check before rent due date",
                "Income Stability" => "Request current employment verification",
                "Lease Status" => "Initiate lease renewal conversation",
                _ => "",
            };
            if !action.is_empty() && !actions.contains(&action.to_string()) {
                actions.push(action.to_string());
            }
        }
    }

    actions
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_input() -> TenantRiskInput {
        TenantRiskInput {
            renter_id: "user_123".to_string(),
            renter_name: "John Smith".to_string(),
            property_id: "prop_456".to_string(),
            property_address: "123 Main St, Apt 4B".to_string(),
            on_time_payments: 20,
            late_payments: 2,
            average_days_late: 5.0,
            missed_payments: 0,
            has_sufficient_balance: true,
            balance_check_date: Some(get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 7),
            account_status: "active".to_string(),
            rent_amount: 1500.0,
            verified_income: Some(65000.0),
            employment_verified: true,
            lease_months_remaining: 8,
            is_month_to_month: false,
            lease_start_date: get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 365,
        }
    }

    #[test]
    fn test_tenant_risk_calculation() {
        let input = sample_input();
        let result = calculate_tenant_risk_internal(&input);

        assert!(result.risk_score >= 0.0 && result.risk_score <= 100.0);
        assert!(result.payment_likelihood >= 0.0 && result.payment_likelihood <= 100.0);
        assert!(!result.factors.is_empty());
    }

    #[test]
    fn test_high_risk_tenant() {
        let mut input = sample_input();
        input.on_time_payments = 5;
        input.late_payments = 8;
        input.missed_payments = 2;
        input.has_sufficient_balance = false;
        input.is_month_to_month = true;

        let result = calculate_tenant_risk_internal(&input);

        assert!(result.risk_score > 50.0);
        assert!(matches!(
            result.risk_category,
            RiskCategory::High | RiskCategory::Critical
        ));
    }
}
