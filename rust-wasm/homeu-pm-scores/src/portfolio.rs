//! Portfolio Risk Dashboard
//!
//! Aggregates risk data across all tenants for a property manager:
//! - Overall portfolio risk score
//! - Risk distribution breakdown
//! - Multi-month collection forecasts

use homeu_core::{
    types::*,
    utils::*,
};
use wasm_bindgen::prelude::*;

use crate::risk_score::calculate_tenant_risk_internal;
use crate::collection::calculate_collection_forecast_internal;

/// Input for portfolio risk calculation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortfolioRiskInput {
    pub property_manager_id: String,
    pub organization_id: String,
    pub tenants: Vec<TenantRiskInput>,
    pub historical_collection_rate: f64,
    pub forecast_months: Vec<String>, // e.g., ["2024-06", "2024-07", "2024-08"]
}

/// Calculate portfolio risk from JSON input
#[wasm_bindgen]
pub fn calculate_portfolio_risk(input_json: &str) -> Result<String, JsValue> {
    let input: PortfolioRiskInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_portfolio_risk_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Core portfolio risk calculation
pub fn calculate_portfolio_risk_internal(input: &PortfolioRiskInput) -> PortfolioRiskResult {
    // Calculate individual tenant risks
    let tenant_results: Vec<TenantRiskResult> = input.tenants
        .iter()
        .map(calculate_tenant_risk_internal)
        .collect();

    // Calculate risk distribution
    let risk_distribution = calculate_risk_distribution(&tenant_results);

    // Calculate overall portfolio risk score (weighted average)
    let overall_risk_score = calculate_overall_risk(&input.tenants, &tenant_results);

    // Calculate total monthly rent
    let total_monthly_rent: f64 = input.tenants.iter().map(|t| t.rent_amount).sum();

    // Generate forecasts for each requested month
    let forecasts: Vec<CollectionForecastResult> = input.forecast_months
        .iter()
        .map(|month| {
            let forecast_input = CollectionForecastInput {
                property_manager_id: input.property_manager_id.clone(),
                organization_id: input.organization_id.clone(),
                forecast_month: month.clone(),
                tenants: input.tenants.clone(),
                historical_collection_rate: input.historical_collection_rate,
                seasonal_adjustment: true,
            };
            calculate_collection_forecast_internal(&forecast_input)
        })
        .collect();

    // Calculate expected collection from first month's forecast
    let expected_collection = forecasts
        .first()
        .map(|f| f.expected_collection_amount)
        .unwrap_or(total_monthly_rent * 0.95);

    PortfolioRiskResult {
        property_manager_id: input.property_manager_id.clone(),
        snapshot_date: get_current_timestamp_ms(),
        overall_risk_score: (overall_risk_score * 10.0).round() / 10.0,
        total_tenants: input.tenants.len() as u32,
        risk_distribution,
        total_monthly_rent: round_to_cents(total_monthly_rent),
        expected_collection: round_to_cents(expected_collection),
        forecasts,
    }
}

fn calculate_risk_distribution(results: &[TenantRiskResult]) -> RiskDistribution {
    let mut distribution = RiskDistribution {
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
    };

    for result in results {
        match result.risk_category {
            RiskCategory::Low => distribution.low += 1,
            RiskCategory::Moderate => distribution.moderate += 1,
            RiskCategory::High => distribution.high += 1,
            RiskCategory::Critical => distribution.critical += 1,
        }
    }

    distribution
}

fn calculate_overall_risk(tenants: &[TenantRiskInput], results: &[TenantRiskResult]) -> f64 {
    if tenants.is_empty() {
        return 0.0;
    }

    let total_rent: f64 = tenants.iter().map(|t| t.rent_amount).sum();
    if total_rent == 0.0 {
        // Equal weight if no rent data
        return results.iter().map(|r| r.risk_score).sum::<f64>() / results.len() as f64;
    }

    // Weight by rent amount (higher rent = more impact on portfolio)
    let weighted_risk: f64 = tenants
        .iter()
        .zip(results.iter())
        .map(|(tenant, result)| tenant.rent_amount * result.risk_score)
        .sum();

    weighted_risk / total_rent
}

fn round_to_cents(amount: f64) -> f64 {
    (amount * 100.0).round() / 100.0
}

/// Summary statistics for a portfolio
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PortfolioSummary {
    pub total_tenants: u32,
    pub total_monthly_rent: f64,
    pub average_risk_score: f64,
    pub median_risk_score: f64,
    pub highest_risk_tenant: Option<String>,
    pub lowest_risk_tenant: Option<String>,
    pub at_risk_count: u32,
    pub at_risk_rent_exposure: f64,
}

/// Calculate portfolio summary statistics from JSON input
#[wasm_bindgen]
pub fn calculate_portfolio_summary(input_json: &str) -> Result<String, JsValue> {
    let input: PortfolioRiskInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let summary = calculate_portfolio_summary_internal(&input);

    serde_json::to_string(&summary)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

fn calculate_portfolio_summary_internal(input: &PortfolioRiskInput) -> PortfolioSummary {
    let tenant_results: Vec<TenantRiskResult> = input.tenants
        .iter()
        .map(calculate_tenant_risk_internal)
        .collect();

    let total_tenants = input.tenants.len() as u32;
    let total_monthly_rent: f64 = input.tenants.iter().map(|t| t.rent_amount).sum();

    // Calculate average risk
    let average_risk_score = if !tenant_results.is_empty() {
        tenant_results.iter().map(|r| r.risk_score).sum::<f64>() / tenant_results.len() as f64
    } else {
        0.0
    };

    // Calculate median risk
    let mut risk_scores: Vec<f64> = tenant_results.iter().map(|r| r.risk_score).collect();
    risk_scores.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median_risk_score = if !risk_scores.is_empty() {
        let mid = risk_scores.len() / 2;
        if risk_scores.len() % 2 == 0 {
            (risk_scores[mid - 1] + risk_scores[mid]) / 2.0
        } else {
            risk_scores[mid]
        }
    } else {
        0.0
    };

    // Find highest and lowest risk tenants
    let highest_risk_tenant = tenant_results
        .iter()
        .max_by(|a, b| a.risk_score.partial_cmp(&b.risk_score).unwrap_or(std::cmp::Ordering::Equal))
        .map(|r| r.renter_name.clone());

    let lowest_risk_tenant = tenant_results
        .iter()
        .min_by(|a, b| a.risk_score.partial_cmp(&b.risk_score).unwrap_or(std::cmp::Ordering::Equal))
        .map(|r| r.renter_name.clone());

    // Count at-risk tenants and their rent exposure
    let at_risk: Vec<(&TenantRiskInput, &TenantRiskResult)> = input.tenants
        .iter()
        .zip(tenant_results.iter())
        .filter(|(_, r)| r.risk_score > 50.0)
        .collect();

    let at_risk_count = at_risk.len() as u32;
    let at_risk_rent_exposure: f64 = at_risk.iter().map(|(t, _)| t.rent_amount).sum();

    PortfolioSummary {
        total_tenants,
        total_monthly_rent: round_to_cents(total_monthly_rent),
        average_risk_score: (average_risk_score * 10.0).round() / 10.0,
        median_risk_score: (median_risk_score * 10.0).round() / 10.0,
        highest_risk_tenant,
        lowest_risk_tenant,
        at_risk_count,
        at_risk_rent_exposure: round_to_cents(at_risk_rent_exposure),
    }
}

/// Trend analysis comparing current to previous period
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RiskTrend {
    pub current_average_risk: f64,
    pub previous_average_risk: f64,
    pub change: f64,
    pub trend_direction: String, // "improving", "stable", "worsening"
    pub tenants_improved: u32,
    pub tenants_worsened: u32,
    pub tenants_stable: u32,
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
                on_time_payments: 24,
                late_payments: 0,
                average_days_late: 0.0,
                missed_payments: 0,
                has_sufficient_balance: true,
                balance_check_date: Some(get_current_timestamp_ms()),
                account_status: "active".to_string(),
                rent_amount: 1500.0,
                verified_income: Some(65000.0),
                employment_verified: true,
                lease_months_remaining: 8,
                is_month_to_month: false,
                lease_start_date: get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 365 * 2,
            },
            TenantRiskInput {
                renter_id: "user_2".to_string(),
                renter_name: "Jane Doe".to_string(),
                property_id: "prop_2".to_string(),
                property_address: "456 Oak Ave".to_string(),
                on_time_payments: 10,
                late_payments: 3,
                average_days_late: 7.0,
                missed_payments: 1,
                has_sufficient_balance: true,
                balance_check_date: Some(get_current_timestamp_ms()),
                account_status: "active".to_string(),
                rent_amount: 1800.0,
                verified_income: Some(55000.0),
                employment_verified: true,
                lease_months_remaining: 3,
                is_month_to_month: false,
                lease_start_date: get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 365,
            },
            TenantRiskInput {
                renter_id: "user_3".to_string(),
                renter_name: "Bob Wilson".to_string(),
                property_id: "prop_3".to_string(),
                property_address: "789 Pine Dr".to_string(),
                on_time_payments: 6,
                late_payments: 5,
                average_days_late: 12.0,
                missed_payments: 2,
                has_sufficient_balance: false,
                balance_check_date: Some(get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 45),
                account_status: "active".to_string(),
                rent_amount: 2000.0,
                verified_income: None,
                employment_verified: false,
                lease_months_remaining: 1,
                is_month_to_month: false,
                lease_start_date: get_current_timestamp_ms() - 1000 * 60 * 60 * 24 * 330,
            },
        ]
    }

    #[test]
    fn test_portfolio_risk_calculation() {
        let input = PortfolioRiskInput {
            property_manager_id: "pm_123".to_string(),
            organization_id: "org_456".to_string(),
            tenants: sample_tenants(),
            historical_collection_rate: 94.0,
            forecast_months: vec!["2024-06".to_string(), "2024-07".to_string(), "2024-08".to_string()],
        };

        let result = calculate_portfolio_risk_internal(&input);

        assert_eq!(result.total_tenants, 3);
        assert!(result.overall_risk_score >= 0.0 && result.overall_risk_score <= 100.0);
        assert_eq!(result.forecasts.len(), 3);
        assert!(result.risk_distribution.low + result.risk_distribution.moderate +
                result.risk_distribution.high + result.risk_distribution.critical == 3);
    }

    #[test]
    fn test_portfolio_summary() {
        let input = PortfolioRiskInput {
            property_manager_id: "pm_123".to_string(),
            organization_id: "org_456".to_string(),
            tenants: sample_tenants(),
            historical_collection_rate: 94.0,
            forecast_months: vec![],
        };

        let summary = calculate_portfolio_summary_internal(&input);

        assert_eq!(summary.total_tenants, 3);
        assert!(summary.total_monthly_rent > 0.0);
        assert!(summary.average_risk_score >= 0.0);
        assert!(summary.highest_risk_tenant.is_some());
        assert!(summary.lowest_risk_tenant.is_some());
    }
}
