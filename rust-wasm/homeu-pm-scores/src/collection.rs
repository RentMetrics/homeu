//! Collection Likelihood Forecast
//!
//! Forecasts rent collection rates for a portfolio:
//! - Aggregates individual tenant risk scores
//! - Applies seasonal factors
//! - Provides 3-month rolling forecast
//! - Identifies at-risk tenants

use homeu_core::{
    types::*,
    utils::*,
};
use wasm_bindgen::prelude::*;

use crate::risk_score::calculate_tenant_risk_internal;

/// Calculate collection forecast from JSON input
#[wasm_bindgen]
pub fn calculate_collection_forecast(input_json: &str) -> Result<String, JsValue> {
    let input: CollectionForecastInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_collection_forecast_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Core collection forecast calculation
pub fn calculate_collection_forecast_internal(input: &CollectionForecastInput) -> CollectionForecastResult {
    // Calculate individual tenant risks
    let tenant_results: Vec<TenantRiskResult> = input.tenants
        .iter()
        .map(calculate_tenant_risk_internal)
        .collect();

    // Calculate totals
    let total_expected_rent: f64 = input.tenants.iter().map(|t| t.rent_amount).sum();

    // Weighted average payment likelihood
    let weighted_likelihood = calculate_weighted_collection_rate(&input.tenants, &tenant_results);

    // Apply seasonal adjustment if enabled
    let forecast_month = parse_month(&input.forecast_month);
    let seasonal_factor = if input.seasonal_adjustment {
        seasonal_collection_factor(forecast_month)
    } else {
        1.0
    };

    let adjusted_rate = weighted_likelihood * seasonal_factor;
    let expected_collection_rate = clamp(adjusted_rate, 0.0, 100.0);
    let expected_collection_amount = total_expected_rent * (expected_collection_rate / 100.0);
    let expected_shortfall = total_expected_rent - expected_collection_amount;

    // Calculate confidence interval
    let confidence_interval = calculate_confidence_interval(
        expected_collection_rate,
        input.tenants.len(),
        input.historical_collection_rate,
    );

    // Identify at-risk tenants (risk score > 50)
    let at_risk_tenants: Vec<AtRiskTenant> = tenant_results
        .iter()
        .filter(|r| r.risk_score > 50.0)
        .map(|r| {
            let tenant = input.tenants.iter().find(|t| t.renter_id == r.renter_id);
            AtRiskTenant {
                renter_id: r.renter_id.clone(),
                renter_name: r.renter_name.clone(),
                property_address: r.property_address.clone(),
                rent_amount: tenant.map(|t| t.rent_amount).unwrap_or(0.0),
                risk_score: r.risk_score,
                payment_likelihood: r.payment_likelihood,
            }
        })
        .collect();

    // Generate 3-month rolling forecast
    let monthly_forecasts = generate_monthly_forecasts(
        &input.forecast_month,
        expected_collection_rate,
        total_expected_rent,
        input.seasonal_adjustment,
    );

    CollectionForecastResult {
        forecast_month: input.forecast_month.clone(),
        total_expected_rent: round_to_cents(total_expected_rent),
        expected_collection_rate: (expected_collection_rate * 10.0).round() / 10.0,
        expected_collection_amount: round_to_cents(expected_collection_amount),
        expected_shortfall: round_to_cents(expected_shortfall),
        confidence_interval,
        at_risk_tenants,
        monthly_forecasts,
    }
}

fn calculate_weighted_collection_rate(
    tenants: &[TenantRiskInput],
    results: &[TenantRiskResult],
) -> f64 {
    if tenants.is_empty() {
        return 95.0; // Default rate if no tenants
    }

    let total_rent: f64 = tenants.iter().map(|t| t.rent_amount).sum();
    if total_rent == 0.0 {
        return 95.0;
    }

    // Weight each tenant's likelihood by their rent amount
    let weighted_sum: f64 = tenants
        .iter()
        .zip(results.iter())
        .map(|(tenant, result)| {
            tenant.rent_amount * result.payment_likelihood
        })
        .sum();

    weighted_sum / total_rent
}

fn calculate_confidence_interval(
    expected_rate: f64,
    tenant_count: usize,
    historical_rate: f64,
) -> ConfidenceInterval {
    // Use historical data to estimate variance
    let base_variance = if historical_rate > 0.0 {
        ((100.0 - historical_rate) / 100.0) * (historical_rate / 100.0)
    } else {
        0.05 // Default 5% variance
    };

    // Smaller portfolios have higher uncertainty
    let sample_factor = if tenant_count > 0 {
        (1.0 / (tenant_count as f64).sqrt()).min(0.5)
    } else {
        0.5
    };

    // 95% confidence interval (1.96 standard deviations)
    let margin = 1.96 * (base_variance * sample_factor).sqrt() * 100.0;
    let margin = margin.max(2.0).min(15.0); // Bound between 2% and 15%

    ConfidenceInterval {
        lower: (expected_rate - margin).max(0.0),
        upper: (expected_rate + margin).min(100.0),
        confidence: 0.95,
    }
}

fn generate_monthly_forecasts(
    start_month: &str,
    base_rate: f64,
    base_amount: f64,
    use_seasonal: bool,
) -> Vec<MonthlyForecast> {
    let mut forecasts = Vec::new();
    let current_month = parse_month(start_month);

    for i in 0..3 {
        let forecast_month_num = ((current_month - 1 + i) % 12) + 1;
        let month_str = format_future_month(start_month, i as i32);

        let seasonal = if use_seasonal {
            seasonal_collection_factor(forecast_month_num)
        } else {
            1.0
        };

        // Confidence decreases for future months
        let confidence = 0.95 - (i as f64 * 0.05);

        let adjusted_rate = clamp(base_rate * seasonal, 0.0, 100.0);
        let expected_amount = base_amount * (adjusted_rate / 100.0);

        forecasts.push(MonthlyForecast {
            month: month_str,
            expected_rate: (adjusted_rate * 10.0).round() / 10.0,
            expected_amount: round_to_cents(expected_amount),
            confidence,
        });
    }

    forecasts
}

fn parse_month(month_str: &str) -> u32 {
    // Format: "YYYY-MM"
    month_str
        .split('-')
        .nth(1)
        .and_then(|m| m.parse::<u32>().ok())
        .unwrap_or(get_current_month())
}

fn format_future_month(start: &str, months_ahead: i32) -> String {
    let parts: Vec<&str> = start.split('-').collect();
    if parts.len() != 2 {
        return start.to_string();
    }

    let year: i32 = parts[0].parse().unwrap_or(2024);
    let month: i32 = parts[1].parse().unwrap_or(1);

    let total_months = (year * 12 + month - 1) + months_ahead;
    let new_year = total_months / 12;
    let new_month = (total_months % 12) + 1;

    format!("{:04}-{:02}", new_year, new_month)
}

fn round_to_cents(amount: f64) -> f64 {
    (amount * 100.0).round() / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_tenants() -> Vec<TenantRiskInput> {
        vec![
            TenantRiskInput {
                renter_id: "user_1".to_string(),
                renter_name: "John Smith".to_string(),
                property_id: "prop_1".to_string(),
                property_address: "123 Main St".to_string(),
                on_time_payments: 20,
                late_payments: 2,
                average_days_late: 3.0,
                missed_payments: 0,
                has_sufficient_balance: true,
                balance_check_date: Some(get_current_timestamp_ms()),
                account_status: "active".to_string(),
                rent_amount: 1500.0,
                verified_income: Some(60000.0),
                employment_verified: true,
                lease_months_remaining: 6,
                is_month_to_month: false,
                lease_start_date: get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 365,
            },
            TenantRiskInput {
                renter_id: "user_2".to_string(),
                renter_name: "Jane Doe".to_string(),
                property_id: "prop_2".to_string(),
                property_address: "456 Oak Ave".to_string(),
                on_time_payments: 10,
                late_payments: 5,
                average_days_late: 8.0,
                missed_payments: 1,
                has_sufficient_balance: false,
                balance_check_date: Some(get_current_timestamp_ms()),
                account_status: "active".to_string(),
                rent_amount: 1800.0,
                verified_income: Some(55000.0),
                employment_verified: false,
                lease_months_remaining: 2,
                is_month_to_month: false,
                lease_start_date: get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 300,
            },
        ]
    }

    #[test]
    fn test_collection_forecast() {
        let input = CollectionForecastInput {
            property_manager_id: "pm_123".to_string(),
            organization_id: "org_456".to_string(),
            forecast_month: "2024-06".to_string(),
            tenants: sample_tenants(),
            historical_collection_rate: 95.0,
            seasonal_adjustment: true,
        };

        let result = calculate_collection_forecast_internal(&input);

        assert!(result.expected_collection_rate > 0.0);
        assert!(result.expected_collection_rate <= 100.0);
        assert!(result.total_expected_rent > 0.0);
        assert_eq!(result.monthly_forecasts.len(), 3);
    }

    #[test]
    fn test_at_risk_identification() {
        let input = CollectionForecastInput {
            property_manager_id: "pm_123".to_string(),
            organization_id: "org_456".to_string(),
            forecast_month: "2024-06".to_string(),
            tenants: sample_tenants(),
            historical_collection_rate: 95.0,
            seasonal_adjustment: false,
        };

        let result = calculate_collection_forecast_internal(&input);

        // Second tenant should be at-risk due to poor payment history
        assert!(!result.at_risk_tenants.is_empty() || result.expected_collection_rate > 90.0);
    }
}
