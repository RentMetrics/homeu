//! Rent Negotiation Calculator
//!
//! Analyzes tenant's negotiation leverage and provides:
//! - Negotiation power score (0-100)
//! - Suggested rent target
//! - Maximum discount percentage
//! - Leverage factors breakdown
//! - Negotiation scripts

use homeu_core::{
    types::*,
    utils::*,
    weights::NegotiationPoints,
};
use wasm_bindgen::prelude::*;

/// Calculate rent negotiation power from JSON input
#[wasm_bindgen]
pub fn calculate_negotiation(input_json: &str) -> Result<String, JsValue> {
    let input: NegotiationInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_negotiation_power(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Core negotiation calculation logic
pub fn calculate_negotiation_power(input: &NegotiationInput) -> NegotiationResult {
    let points = NegotiationPoints::default();
    let mut leverage_factors = Vec::new();
    let mut total_points = 0.0;

    // 1. Vacancy Leverage
    let vacancy_points = calculate_vacancy_leverage(&input, &points);
    if vacancy_points.abs() > 0.0 {
        leverage_factors.push(LeverageFactor {
            name: "Vacancy Rate".to_string(),
            points: vacancy_points,
            description: format_vacancy_description(input.occupancy_rate, vacancy_points),
        });
        total_points += vacancy_points;
    }

    // 2. Seasonality
    let season_points = calculate_seasonality(input.current_month, &points);
    leverage_factors.push(LeverageFactor {
        name: "Seasonality".to_string(),
        points: season_points,
        description: format_seasonality_description(input.current_month, season_points),
    });
    total_points += season_points;

    // 3. Tenant Value (tenure + payment history)
    let tenure_points = calculate_tenure_value(input.tenant_tenure_months, &points);
    if tenure_points > 0.0 {
        leverage_factors.push(LeverageFactor {
            name: "Tenant Tenure".to_string(),
            points: tenure_points,
            description: format!("{} months as a tenant", input.tenant_tenure_months),
        });
        total_points += tenure_points;
    }

    let payment_points = calculate_payment_value(input.on_time_payment_rate, &points);
    if payment_points > 0.0 {
        leverage_factors.push(LeverageFactor {
            name: "Payment History".to_string(),
            points: payment_points,
            description: format!("{:.0}% on-time payment rate", input.on_time_payment_rate),
        });
        total_points += payment_points;
    }

    // 4. Market Comparison
    let market_points = calculate_market_position(input.current_rent, input.market_rent, &points);
    if market_points > 0.0 {
        leverage_factors.push(LeverageFactor {
            name: "Market Position".to_string(),
            points: market_points,
            description: format_market_position_description(input.current_rent, input.market_rent),
        });
        total_points += market_points;
    }

    // 5. Competition factor
    if input.competing_offers > 0 {
        let competition_points = -5.0 * input.competing_offers as f64;
        leverage_factors.push(LeverageFactor {
            name: "Competition".to_string(),
            points: competition_points,
            description: format!("{} other applicants competing", input.competing_offers),
        });
        total_points += competition_points;
    }

    // Calculate final negotiation power (0-100 scale)
    // Base power is 30, max theoretical is 100
    let negotiation_power = clamp(30.0 + total_points, 0.0, 100.0);

    // Calculate suggested rent and max discount
    let max_discount_pct = calculate_max_discount(negotiation_power);
    let suggested_rent = input.current_rent * (1.0 - max_discount_pct / 100.0);
    let suggested_rent = suggested_rent.max(input.market_rent * 0.85); // Floor at 85% of market

    // Generate suggested asks
    let suggested_asks = generate_suggested_asks(negotiation_power, input);

    // Determine best timing
    let best_timing = determine_best_timing(input.current_month);

    // Generate negotiation scripts
    let scripts = generate_scripts(&leverage_factors, input, negotiation_power);

    NegotiationResult {
        negotiation_power: (negotiation_power * 10.0).round() / 10.0,
        suggested_rent: (suggested_rent * 100.0).round() / 100.0,
        max_discount: (max_discount_pct * 10.0).round() / 10.0,
        leverage_factors,
        suggested_asks,
        best_timing,
        scripts,
    }
}

fn calculate_vacancy_leverage(input: &NegotiationInput, points: &NegotiationPoints) -> f64 {
    if input.occupancy_rate < 85.0 {
        points.vacancy_high
    } else if input.occupancy_rate < 90.0 {
        points.vacancy_medium
    } else if input.occupancy_rate < 95.0 {
        points.vacancy_low
    } else {
        0.0 // High occupancy = no leverage
    }
}

fn calculate_seasonality(month: u32, points: &NegotiationPoints) -> f64 {
    match month {
        11 | 12 | 1 | 2 => points.winter_bonus,
        3 | 4 => points.spring_bonus,
        5 | 6 | 7 | 8 => points.summer_penalty,
        _ => 0.0,
    }
}

fn calculate_tenure_value(months: u32, points: &NegotiationPoints) -> f64 {
    if months >= 24 {
        points.long_tenure
    } else if months >= 12 {
        points.medium_tenure
    } else if months >= 6 {
        points.short_tenure
    } else {
        0.0
    }
}

fn calculate_payment_value(on_time_rate: f64, points: &NegotiationPoints) -> f64 {
    if on_time_rate >= 98.0 {
        points.excellent_payment
    } else if on_time_rate >= 95.0 {
        points.good_payment
    } else {
        0.0
    }
}

fn calculate_market_position(current_rent: f64, market_rent: f64, points: &NegotiationPoints) -> f64 {
    let ratio = current_rent / market_rent;
    if ratio >= 1.10 {
        points.above_market
    } else if ratio >= 1.0 {
        points.at_market
    } else {
        0.0 // Already below market, no leverage
    }
}

fn calculate_max_discount(negotiation_power: f64) -> f64 {
    // Higher negotiation power = higher potential discount
    // Power 0-30: 0-3% discount
    // Power 30-60: 3-8% discount
    // Power 60-80: 8-12% discount
    // Power 80-100: 12-15% discount
    if negotiation_power <= 30.0 {
        negotiation_power / 10.0
    } else if negotiation_power <= 60.0 {
        3.0 + (negotiation_power - 30.0) / 6.0
    } else if negotiation_power <= 80.0 {
        8.0 + (negotiation_power - 60.0) / 5.0
    } else {
        12.0 + (negotiation_power - 80.0) / 6.67
    }
}

fn format_vacancy_description(occupancy_rate: f64, points: f64) -> String {
    if points > 15.0 {
        format!("Low occupancy ({:.0}%) gives you strong leverage", occupancy_rate)
    } else if points > 5.0 {
        format!("Moderate occupancy ({:.0}%) provides some leverage", occupancy_rate)
    } else if points > 0.0 {
        format!("Occupancy at {:.0}% - limited leverage", occupancy_rate)
    } else {
        format!("High occupancy ({:.0}%) - minimal vacancy leverage", occupancy_rate)
    }
}

fn format_seasonality_description(month: u32, points: f64) -> String {
    let month_name = match month {
        1 => "January", 2 => "February", 3 => "March", 4 => "April",
        5 => "May", 6 => "June", 7 => "July", 8 => "August",
        9 => "September", 10 => "October", 11 => "November", 12 => "December",
        _ => "Unknown"
    };

    if points > 10.0 {
        format!("{} is an excellent time to negotiate (off-peak season)", month_name)
    } else if points > 0.0 {
        format!("{} offers moderate seasonal leverage", month_name)
    } else if points < 0.0 {
        format!("{} is peak rental season - less leverage", month_name)
    } else {
        format!("{} is a neutral time for negotiations", month_name)
    }
}

fn format_market_position_description(current: f64, market: f64) -> String {
    let diff_pct = ((current / market) - 1.0) * 100.0;
    if diff_pct > 10.0 {
        format!("You're paying {:.0}% above market - strong case for reduction", diff_pct)
    } else if diff_pct > 0.0 {
        format!("Rent is {:.0}% above market average", diff_pct)
    } else {
        format!("Rent is at or below market rate")
    }
}

fn generate_suggested_asks(power: f64, input: &NegotiationInput) -> Vec<String> {
    let mut asks = Vec::new();

    // Always suggest rent reduction if there's any power
    if power > 20.0 {
        let discount = calculate_max_discount(power);
        let savings = input.current_rent * discount / 100.0;
        asks.push(format!("Request {:.0}% rent reduction (${:.0}/month savings)", discount, savings));
    }

    // Free months based on power
    if power > 50.0 {
        asks.push("Ask for one month free on lease renewal".to_string());
    }

    // Waived fees
    if power > 30.0 {
        asks.push("Request waived renewal/administrative fees".to_string());
    }

    // Parking/storage
    if power > 40.0 {
        asks.push("Negotiate free or discounted parking/storage".to_string());
    }

    // Upgrades
    if power > 60.0 {
        asks.push("Request apartment upgrades (appliances, flooring, paint)".to_string());
    }

    // Lease flexibility
    if power > 35.0 {
        asks.push("Ask for lease term flexibility".to_string());
    }

    // If low power, still provide options
    if asks.is_empty() {
        asks.push("Focus on non-monetary benefits like maintenance priority".to_string());
        asks.push("Request early lease renewal to lock in current rate".to_string());
    }

    asks
}

fn determine_best_timing(current_month: u32) -> String {
    match current_month {
        11 | 12 | 1 | 2 => "Now is an excellent time to negotiate (off-peak season)".to_string(),
        3 | 4 => "Good timing - negotiate before peak season starts".to_string(),
        5 | 6 | 7 | 8 => "Consider waiting until fall/winter for better leverage".to_string(),
        9 | 10 => "Approach now to lock in before winter market".to_string(),
        _ => "Negotiate 60-90 days before lease renewal".to_string(),
    }
}

fn generate_scripts(factors: &[LeverageFactor], input: &NegotiationInput, power: f64) -> Vec<NegotiationScript> {
    let mut scripts = Vec::new();

    // Opening script
    scripts.push(NegotiationScript {
        scenario: "Opening Statement".to_string(),
        script: generate_opening_script(input, power),
    });

    // Market comparison script
    if input.current_rent > input.market_rent {
        scripts.push(NegotiationScript {
            scenario: "Market Comparison".to_string(),
            script: format!(
                "I've researched comparable units in the area and found the market rate is around ${:.0}. \
                My current rent of ${:.0} is {:.0}% above market. I'd like to discuss bringing my rent \
                closer to market rate.",
                input.market_rent,
                input.current_rent,
                ((input.current_rent / input.market_rent) - 1.0) * 100.0
            ),
        });
    }

    // Tenure/loyalty script
    if input.tenant_tenure_months >= 12 {
        scripts.push(NegotiationScript {
            scenario: "Loyalty Argument".to_string(),
            script: format!(
                "I've been a reliable tenant for {} months with a {:.0}% on-time payment record. \
                Finding a new tenant costs approximately one month's rent in turnover. \
                I'd like to stay long-term and would appreciate consideration for my loyalty.",
                input.tenant_tenure_months,
                input.on_time_payment_rate
            ),
        });
    }

    // Counter-offer script
    scripts.push(NegotiationScript {
        scenario: "Counter Offer".to_string(),
        script: generate_counter_script(input, power),
    });

    scripts
}

fn generate_opening_script(input: &NegotiationInput, power: f64) -> String {
    if power > 60.0 {
        format!(
            "Hi, I'd like to discuss my lease renewal. I've enjoyed living here for {} months \
            and would like to continue. However, I've noticed some factors that warrant a conversation \
            about my rent. Do you have time to discuss options?",
            input.tenant_tenure_months
        )
    } else {
        format!(
            "Hi, my lease is coming up for renewal and I wanted to discuss my options. \
            I've been a good tenant for {} months and I'm hoping we can find an arrangement \
            that works for both of us. When would be a good time to talk?",
            input.tenant_tenure_months
        )
    }
}

fn generate_counter_script(input: &NegotiationInput, power: f64) -> String {
    let discount = calculate_max_discount(power);
    let target_rent = input.current_rent * (1.0 - discount / 100.0);

    format!(
        "I appreciate the offer, but based on current market conditions and my history as a tenant, \
        I was hoping we could agree on ${:.0}/month. If that's not possible, would you consider \
        alternatives like waiving fees or including parking? I'm flexible on terms if we can \
        find the right balance.",
        target_rent
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_input() -> NegotiationInput {
        NegotiationInput {
            current_rent: 1800.0,
            market_rent: 1650.0,
            occupancy_rate: 87.0,
            current_month: 1, // January
            tenant_tenure_months: 24,
            on_time_payment_rate: 98.0,
            market_rent_growth: 3.0,
            competing_offers: 0,
        }
    }

    #[test]
    fn test_negotiation_calculation() {
        let input = sample_input();
        let result = calculate_negotiation_power(&input);

        assert!(result.negotiation_power > 0.0);
        assert!(result.negotiation_power <= 100.0);
        assert!(result.suggested_rent < input.current_rent);
        assert!(!result.leverage_factors.is_empty());
        assert!(!result.suggested_asks.is_empty());
    }

    #[test]
    fn test_high_leverage_scenario() {
        let mut input = sample_input();
        input.occupancy_rate = 80.0; // Very low occupancy
        input.current_month = 12;     // December
        input.tenant_tenure_months = 36;
        input.on_time_payment_rate = 100.0;

        let result = calculate_negotiation_power(&input);

        // Should have high negotiation power
        assert!(result.negotiation_power > 70.0);
        assert!(result.max_discount > 10.0);
    }
}
