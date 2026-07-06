//! Market Intelligence Scoring Module
//!
//! Three scoring functions for Market Intelligence:
//! - Deal Score: Is this property a good deal?
//! - Leverage Score: Can the renter negotiate?
//! - Renewal Strategy: What approach for lease renewal?

use homeu_core::{
    types::*,
    utils::*,
    weights::{DealScoreWeights, LeverageScoreWeights},
};
use wasm_bindgen::prelude::*;

// ============================================
// DEAL SCORE
// ============================================

/// Calculate deal score from JSON input
#[wasm_bindgen]
pub fn calculate_deal_score(input_json: &str) -> Result<String, JsValue> {
    let input: DealScoreInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_deal_score_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

pub fn calculate_deal_score_internal(input: &DealScoreInput) -> DealScoreResult {
    let weights = DealScoreWeights::default();
    let mut factors = Vec::new();

    // 1. Rent Position (35%)
    let rent_position_score = calculate_rent_position(input);
    factors.push(ScoreFactor {
        name: "Rent Position".to_string(),
        value: rent_position_score,
        weight: weights.rent_position,
        contribution: rent_position_score * weights.rent_position,
        description: format_rent_position_desc(input),
    });

    // 2. Occupancy Signal (20%)
    let occupancy_score = calculate_occupancy_signal(input);
    factors.push(ScoreFactor {
        name: "Occupancy Signal".to_string(),
        value: occupancy_score,
        weight: weights.occupancy_signal,
        contribution: occupancy_score * weights.occupancy_signal,
        description: format!(
            "{:.0}% occupancy vs {:.0}% market avg",
            input.occupancy_rate, input.market_occupancy
        ),
    });

    // 3. Concession Value (15%)
    let concession_score = calculate_concession_value(input);
    factors.push(ScoreFactor {
        name: "Concession Value".to_string(),
        value: concession_score,
        weight: weights.concession_value,
        contribution: concession_score * weights.concession_value,
        description: format!(
            "${:.0} concession vs ${:.0} market avg",
            input.concession_value, input.market_concession_value
        ),
    });

    // 4. Price/SqFt Value (15%)
    let sqft_score = calculate_price_sqft_value(input);
    factors.push(ScoreFactor {
        name: "Price/SqFt Value".to_string(),
        value: sqft_score,
        weight: weights.price_sqft_value,
        contribution: sqft_score * weights.price_sqft_value,
        description: format_sqft_desc(input),
    });

    // 5. Trend Momentum (15%)
    let trend_score = calculate_trend_momentum(input);
    factors.push(ScoreFactor {
        name: "Trend Momentum".to_string(),
        value: trend_score,
        weight: weights.trend_momentum,
        contribution: trend_score * weights.trend_momentum,
        description: format!(
            "3-mo: {:+.1}%, 12-mo: {:+.1}%",
            input.rent_trend_3mo, input.rent_trend_12mo
        ),
    });

    let final_score = factors.iter().map(|f| f.contribution).sum::<f64>();
    let final_score = clamp(final_score, 0.0, 100.0);
    let final_score = (final_score * 10.0).round() / 10.0;
    let grade = ScoreGrade::from_score(final_score);

    let summary = generate_deal_summary(&grade, final_score, input);
    let recommendation = generate_deal_recommendation(&grade, final_score, input);

    DealScoreResult {
        score: final_score,
        grade,
        factors,
        summary,
        recommendation,
    }
}

fn calculate_rent_position(input: &DealScoreInput) -> f64 {
    if input.market_rent <= 0.0 {
        return 50.0;
    }
    let diff_pct = (input.market_rent - input.current_rent) / input.market_rent * 100.0;
    // diff_pct > 0 means below market (good), < 0 means above market
    let score = 50.0 + diff_pct * 2.5;
    clamp(score, 0.0, 100.0)
}

fn calculate_occupancy_signal(input: &DealScoreInput) -> f64 {
    // Lower occupancy = better deal (more leverage)
    let mut score = 50.0;

    if input.occupancy_rate < 80.0 {
        score += 40.0;
    } else if input.occupancy_rate < 85.0 {
        score += 30.0;
    } else if input.occupancy_rate < 90.0 {
        score += 20.0;
    } else if input.occupancy_rate < 95.0 {
        score += 5.0;
    } else {
        score -= 15.0; // Very high occupancy = less deal leverage
    }

    // Compare to market: if property occupancy < market, even better
    if input.market_occupancy > 0.0 {
        let occ_diff = input.market_occupancy - input.occupancy_rate;
        score += occ_diff * 1.5; // Each % below market adds points
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_concession_value(input: &DealScoreInput) -> f64 {
    let mut score = 50.0;

    if input.concession_value > 0.0 {
        score += 15.0; // Has concessions = bonus
        if input.market_concession_value > 0.0 {
            let ratio = input.concession_value / input.market_concession_value;
            if ratio > 1.5 {
                score += 25.0; // Way above market concessions
            } else if ratio > 1.0 {
                score += 15.0;
            } else if ratio > 0.5 {
                score += 5.0;
            }
        } else {
            score += 20.0; // Has concessions when market avg is 0
        }
    } else if input.market_concession_value > 0.0 {
        score -= 15.0; // No concessions when others offer them
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_price_sqft_value(input: &DealScoreInput) -> f64 {
    if input.avg_rent_per_sqft <= 0.0 || input.unit_sqft <= 0.0 {
        return 50.0;
    }
    let unit_price_per_sqft = input.current_rent / input.unit_sqft;
    let ratio = unit_price_per_sqft / input.avg_rent_per_sqft;

    if ratio < 0.80 {
        95.0
    } else if ratio < 0.90 {
        80.0
    } else if ratio < 1.0 {
        65.0
    } else if ratio < 1.10 {
        45.0
    } else if ratio < 1.20 {
        30.0
    } else {
        15.0
    }
}

fn calculate_trend_momentum(input: &DealScoreInput) -> f64 {
    let mut score = 50.0;

    // Falling rents = better deal
    if input.rent_trend_3mo < -3.0 {
        score += 30.0;
    } else if input.rent_trend_3mo < -1.0 {
        score += 20.0;
    } else if input.rent_trend_3mo < 0.0 {
        score += 10.0;
    } else if input.rent_trend_3mo > 3.0 {
        score -= 20.0;
    } else if input.rent_trend_3mo > 1.0 {
        score -= 10.0;
    }

    // 12-month trend (less weight)
    if input.rent_trend_12mo < -2.0 {
        score += 10.0;
    } else if input.rent_trend_12mo > 5.0 {
        score -= 10.0;
    }

    clamp(score, 0.0, 100.0)
}

fn format_rent_position_desc(input: &DealScoreInput) -> String {
    if input.market_rent <= 0.0 {
        return "Market rent data unavailable".to_string();
    }
    let diff_pct = ((input.current_rent / input.market_rent) - 1.0) * 100.0;
    if diff_pct < -5.0 {
        format!("{:.0}% below market rent — great value", -diff_pct)
    } else if diff_pct < 0.0 {
        format!("{:.0}% below market rent", -diff_pct)
    } else if diff_pct < 5.0 {
        format!("Near market rate ({:+.0}%)", diff_pct)
    } else {
        format!("{:.0}% above market rent — overpriced", diff_pct)
    }
}

fn format_sqft_desc(input: &DealScoreInput) -> String {
    if input.unit_sqft <= 0.0 || input.avg_rent_per_sqft <= 0.0 {
        return "Price per sqft data unavailable".to_string();
    }
    let unit_ppsqft = input.current_rent / input.unit_sqft;
    format!("${:.2}/sqft vs ${:.2}/sqft market avg", unit_ppsqft, input.avg_rent_per_sqft)
}

fn generate_deal_summary(grade: &ScoreGrade, score: f64, input: &DealScoreInput) -> String {
    match grade {
        ScoreGrade::Excellent => format!(
            "Deal Score {:.0}/100 — Excellent deal! This property is priced well below market with strong value indicators.",
            score
        ),
        ScoreGrade::Good => format!(
            "Deal Score {:.0}/100 — Good deal. This property offers solid value compared to the local market.",
            score
        ),
        ScoreGrade::Fair => format!(
            "Deal Score {:.0}/100 — Fair deal. Pricing is close to market average. Negotiation may improve value.",
            score
        ),
        ScoreGrade::Poor => format!(
            "Deal Score {:.0}/100 — Below average. Consider negotiating or comparing with alternatives.",
            score
        ),
        ScoreGrade::VeryPoor => format!(
            "Deal Score {:.0}/100 — Overpriced relative to market. We recommend exploring other options.",
            score
        ),
    }
}

fn generate_deal_recommendation(grade: &ScoreGrade, score: f64, input: &DealScoreInput) -> String {
    if input.market_rent > 0.0 && input.current_rent > input.market_rent * 1.1 && input.occupancy_rate < 92.0 {
        return "Rent is above market and occupancy is moderate — strong position to negotiate a reduction.".to_string();
    }
    if input.concession_value > 0.0 {
        return format!(
            "Lock in the ${:.0} concession currently offered. This adds significant value to the deal.",
            input.concession_value
        );
    }
    match grade {
        ScoreGrade::Excellent | ScoreGrade::Good => {
            "This is a strong deal. Apply soon — well-priced units move quickly.".to_string()
        }
        ScoreGrade::Fair => {
            "Consider negotiating move-in costs or lease term flexibility before committing.".to_string()
        }
        _ => {
            "We recommend comparing at least 3 alternative properties in this market.".to_string()
        }
    }
}

// ============================================
// LEVERAGE SCORE
// ============================================

/// Calculate leverage score from JSON input
#[wasm_bindgen]
pub fn calculate_leverage_score(input_json: &str) -> Result<String, JsValue> {
    let input: LeverageScoreInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_leverage_score_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

pub fn calculate_leverage_score_internal(input: &LeverageScoreInput) -> LeverageScoreResult {
    let weights = LeverageScoreWeights::default();
    let mut factors = Vec::new();

    // 1. Vacancy Leverage (30%)
    let vacancy_score = calculate_vacancy_leverage(input);
    factors.push(ScoreFactor {
        name: "Vacancy Leverage".to_string(),
        value: vacancy_score,
        weight: weights.vacancy_leverage,
        contribution: vacancy_score * weights.vacancy_leverage,
        description: format!("{:.0}% occupancy (market: {:.0}%)", input.occupancy_rate, input.market_occupancy),
    });

    // 2. Seasonality (20%)
    let season_score = calculate_seasonality_score(input.current_month);
    factors.push(ScoreFactor {
        name: "Seasonality".to_string(),
        value: season_score,
        weight: weights.seasonality,
        contribution: season_score * weights.seasonality,
        description: format_seasonality_desc(input.current_month),
    });

    // 3. Market Position (20%)
    let market_score = calculate_market_position_score(input);
    factors.push(ScoreFactor {
        name: "Market Position".to_string(),
        value: market_score,
        weight: weights.market_position,
        contribution: market_score * weights.market_position,
        description: format!("Rent is {:+.0}% vs market", (input.rent_vs_market_pct - 1.0) * 100.0),
    });

    // 4. Property Weakness (15%)
    let weakness_score = calculate_property_weakness(input);
    factors.push(ScoreFactor {
        name: "Property Weakness".to_string(),
        value: weakness_score,
        weight: weights.property_weakness,
        contribution: weakness_score * weights.property_weakness,
        description: format_weakness_desc(input),
    });

    // 5. Concession Climate (15%)
    let concession_score = calculate_concession_climate(input);
    factors.push(ScoreFactor {
        name: "Concession Climate".to_string(),
        value: concession_score,
        weight: weights.concession_climate,
        contribution: concession_score * weights.concession_climate,
        description: format!("{:.0}% of properties offering concessions", input.concession_prevalence),
    });

    let final_score = factors.iter().map(|f| f.contribution).sum::<f64>();
    let final_score = clamp(final_score, 0.0, 100.0);
    let final_score = (final_score * 10.0).round() / 10.0;
    let grade = ScoreGrade::from_score(final_score);

    let negotiation_tips = generate_leverage_tips(&factors, input);
    let best_timing = generate_best_timing(input);

    LeverageScoreResult {
        score: final_score,
        grade,
        factors,
        negotiation_tips,
        best_timing,
    }
}

fn calculate_vacancy_leverage(input: &LeverageScoreInput) -> f64 {
    let mut score = 40.0;

    // Below-market occupancy = strong leverage
    let occ_diff = input.market_occupancy - input.occupancy_rate;
    if occ_diff > 10.0 {
        score += 50.0;
    } else if occ_diff > 5.0 {
        score += 35.0;
    } else if occ_diff > 0.0 {
        score += 15.0;
    } else {
        score -= 10.0;
    }

    // Absolute occupancy
    if input.occupancy_rate < 80.0 {
        score += 10.0;
    } else if input.occupancy_rate > 97.0 {
        score -= 20.0;
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_seasonality_score(month: u32) -> f64 {
    match month {
        11 | 12 | 1 | 2 => 85.0, // Winter = strong leverage
        3 | 4 => 60.0,            // Spring = moderate
        9 | 10 => 50.0,           // Fall = neutral
        5 | 6 | 7 | 8 => 25.0,   // Summer = low leverage
        _ => 50.0,
    }
}

fn calculate_market_position_score(input: &LeverageScoreInput) -> f64 {
    let pct_above = (input.rent_vs_market_pct - 1.0) * 100.0;
    if pct_above > 15.0 {
        95.0 // Significantly overpriced = high leverage
    } else if pct_above > 10.0 {
        80.0
    } else if pct_above > 5.0 {
        65.0
    } else if pct_above > 0.0 {
        50.0
    } else if pct_above > -5.0 {
        35.0
    } else {
        20.0 // Below market = low leverage (already a deal)
    }
}

fn calculate_property_weakness(input: &LeverageScoreInput) -> f64 {
    let mut score = 40.0;

    // Old buildings have more leverage
    if input.building_age > 40 {
        score += 25.0;
    } else if input.building_age > 25 {
        score += 15.0;
    } else if input.building_age > 15 {
        score += 5.0;
    } else if input.building_age < 5 {
        score -= 15.0; // New construction = less leverage
    }

    // Low Google rating = leverage
    if let Some(rating) = input.google_rating {
        if rating < 3.0 {
            score += 25.0;
        } else if rating < 3.5 {
            score += 15.0;
        } else if rating < 4.0 {
            score += 5.0;
        } else if rating >= 4.5 {
            score -= 10.0;
        }
    }

    // Large complexes have more vacancies to fill
    if input.property_units > 300 {
        score += 10.0;
    } else if input.property_units > 150 {
        score += 5.0;
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_concession_climate(input: &LeverageScoreInput) -> f64 {
    if input.concession_prevalence > 60.0 {
        90.0 // Many properties offering concessions = strong leverage
    } else if input.concession_prevalence > 40.0 {
        75.0
    } else if input.concession_prevalence > 20.0 {
        55.0
    } else if input.concession_prevalence > 5.0 {
        35.0
    } else {
        20.0 // Almost no concessions = tight market
    }
}

fn format_seasonality_desc(month: u32) -> String {
    match month {
        11 | 12 | 1 | 2 => "Winter — peak negotiation season, low demand".to_string(),
        3 | 4 => "Spring — moderate demand, some leverage".to_string(),
        5 | 6 | 7 | 8 => "Summer — peak moving season, limited leverage".to_string(),
        9 | 10 => "Fall — demand cooling, neutral leverage".to_string(),
        _ => "Neutral season".to_string(),
    }
}

fn format_weakness_desc(input: &LeverageScoreInput) -> String {
    let mut parts = Vec::new();
    if input.building_age > 25 {
        parts.push(format!("{} years old", input.building_age));
    }
    if let Some(rating) = input.google_rating {
        if rating < 4.0 {
            parts.push(format!("{:.1}/5 rating", rating));
        }
    }
    if input.property_units > 150 {
        parts.push(format!("{} units", input.property_units));
    }
    if parts.is_empty() {
        "No significant weaknesses identified".to_string()
    } else {
        parts.join(", ")
    }
}

fn generate_leverage_tips(factors: &[ScoreFactor], input: &LeverageScoreInput) -> Vec<String> {
    let mut tips = Vec::new();

    if input.occupancy_rate < 90.0 {
        tips.push("Vacancy is your strongest card — mention you have other options.".to_string());
    }
    if input.rent_vs_market_pct > 1.05 {
        tips.push("Your rent is above market average. Present comparable listings as evidence.".to_string());
    }
    if input.concession_prevalence > 30.0 {
        tips.push("Competitors are offering concessions. Ask for matching incentives.".to_string());
    }
    if let Some(rating) = input.google_rating {
        if rating < 3.5 {
            tips.push("Low resident satisfaction gives you leverage — reference reviews.".to_string());
        }
    }
    if input.building_age > 30 {
        tips.push("The building's age may mean deferred maintenance — ask about upcoming renovations.".to_string());
    }

    if tips.is_empty() {
        tips.push("Market conditions are tight. Focus on demonstrating your value as a reliable tenant.".to_string());
    }

    tips
}

fn generate_best_timing(input: &LeverageScoreInput) -> String {
    match input.current_month {
        11 | 12 | 1 | 2 => {
            "Now is an excellent time to negotiate. Winter months have the lowest demand.".to_string()
        }
        3 | 4 => {
            "Negotiate soon before spring demand picks up.".to_string()
        }
        5 | 6 | 7 | 8 => {
            "Consider waiting until fall/winter for better leverage, unless your lease ends soon.".to_string()
        }
        9 | 10 => {
            "Good timing as summer demand cools. Negotiate before the holiday slowdown.".to_string()
        }
        _ => "Current timing is neutral for negotiations.".to_string(),
    }
}

// ============================================
// RENEWAL STRATEGY
// ============================================

/// Calculate renewal strategy from JSON input
#[wasm_bindgen]
pub fn calculate_renewal_strategy(input_json: &str) -> Result<String, JsValue> {
    let input: RenewalStrategyInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_renewal_strategy_internal(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

pub fn calculate_renewal_strategy_internal(input: &RenewalStrategyInput) -> RenewalStrategyResult {
    // Base leverage from market comparison
    let mut leverage_score = 30.0;

    // Rent vs market
    let rent_ratio = if input.market_rent > 0.0 {
        input.current_rent / input.market_rent
    } else {
        1.0
    };

    if rent_ratio > 1.15 {
        leverage_score += 25.0;
    } else if rent_ratio > 1.05 {
        leverage_score += 15.0;
    } else if rent_ratio > 1.0 {
        leverage_score += 5.0;
    } else if rent_ratio < 0.90 {
        leverage_score -= 15.0;
    }

    // Occupancy
    if input.occupancy_rate < 85.0 {
        leverage_score += 20.0;
    } else if input.occupancy_rate < 90.0 {
        leverage_score += 10.0;
    } else if input.occupancy_rate < 95.0 {
        leverage_score += 5.0;
    } else {
        leverage_score -= 5.0;
    }

    // Loyalty bonus: 2% per year of tenure, up to 10%
    let tenure_years = input.tenant_tenure_months as f64 / 12.0;
    let loyalty_discount = (tenure_years * 2.0).min(10.0);

    // Payment history bonus
    let payment_bonus = if input.on_time_payment_rate >= 98.0 {
        5.0
    } else if input.on_time_payment_rate >= 95.0 {
        3.0
    } else {
        0.0
    };

    // Seasonality for lease end month
    let seasonal_adjustment = match input.lease_end_month {
        11 | 12 | 1 | 2 => 5.0,   // Winter lease end = more leverage
        5 | 6 | 7 | 8 => -5.0,    // Summer lease end = less leverage
        _ => 0.0,
    };

    // Trend bonus
    if input.rent_trend_3mo < -2.0 {
        leverage_score += 10.0;
    } else if input.rent_trend_3mo < 0.0 {
        leverage_score += 5.0;
    }

    leverage_score += seasonal_adjustment;
    leverage_score = clamp(leverage_score, 0.0, 100.0);

    // Total max discount
    let base_discount = if leverage_score > 70.0 {
        8.0
    } else if leverage_score > 50.0 {
        5.0
    } else if leverage_score > 30.0 {
        3.0
    } else {
        1.0
    };
    let max_discount_pct = (base_discount + loyalty_discount + payment_bonus).min(20.0);

    let target_rent = input.current_rent * (1.0 - max_discount_pct / 100.0);
    let target_rent = (target_rent * 100.0).round() / 100.0;

    // Determine recommended action
    let recommended_action = if rent_ratio > 1.10 && input.occupancy_rate < 92.0 {
        "negotiate".to_string()
    } else if rent_ratio < 0.95 || (input.occupancy_rate > 97.0 && rent_ratio < 1.05) {
        "renew".to_string()
    } else if leverage_score > 60.0 {
        "negotiate".to_string()
    } else if max_discount_pct < 3.0 && input.occupancy_rate > 95.0 {
        "explore".to_string()
    } else {
        "negotiate".to_string()
    };

    let talking_points = generate_talking_points(input, leverage_score, loyalty_discount, payment_bonus);
    let scripts = generate_renewal_scripts(input, max_discount_pct, &recommended_action);
    let timing_advice = generate_timing_advice(input);

    RenewalStrategyResult {
        recommended_action,
        target_rent,
        max_discount_pct: (max_discount_pct * 10.0).round() / 10.0,
        leverage_score: (leverage_score * 10.0).round() / 10.0,
        talking_points,
        scripts,
        timing_advice,
    }
}

fn generate_talking_points(
    input: &RenewalStrategyInput,
    leverage: f64,
    loyalty_discount: f64,
    payment_bonus: f64,
) -> Vec<String> {
    let mut points = Vec::new();

    if input.tenant_tenure_months >= 12 {
        points.push(format!(
            "You've been a reliable tenant for {} months — turnover costs landlords $3,000-$5,000.",
            input.tenant_tenure_months
        ));
    }

    if input.on_time_payment_rate >= 95.0 {
        points.push(format!(
            "Your {:.0}% on-time payment rate makes you a low-risk tenant.",
            input.on_time_payment_rate
        ));
    }

    if input.current_rent > input.market_rent && input.market_rent > 0.0 {
        let pct = ((input.current_rent / input.market_rent) - 1.0) * 100.0;
        points.push(format!(
            "Your rent is {:.0}% above current market rate for comparable units.",
            pct
        ));
    }

    if input.occupancy_rate < 90.0 {
        points.push(format!(
            "The property has {:.0}% occupancy — filling your unit with a new tenant is costly.",
            input.occupancy_rate
        ));
    }

    if input.concession_value > 0.0 {
        points.push(format!(
            "New tenants are getting ${:.0} in concessions — you deserve comparable value for loyalty.",
            input.concession_value
        ));
    }

    if loyalty_discount > 0.0 {
        points.push(format!(
            "A {:.0}% loyalty discount is standard for {:.0}-year tenants in this market.",
            loyalty_discount, input.tenant_tenure_months as f64 / 12.0
        ));
    }

    if points.is_empty() {
        points.push("Emphasize your reliability and interest in a long-term stay.".to_string());
    }

    points
}

fn generate_renewal_scripts(
    input: &RenewalStrategyInput,
    max_discount: f64,
    action: &str,
) -> Vec<NegotiationScript> {
    let mut scripts = Vec::new();

    scripts.push(NegotiationScript {
        scenario: "Opening Request".to_string(),
        script: format!(
            "Hi, I'd like to discuss my lease renewal. I've been a great tenant for {} months with an excellent payment record. \
             I'd like to renew, but I've been researching comparable units in the area and believe a rate adjustment is fair. \
             Would you consider renewing at ${:.0}/month?",
            input.tenant_tenure_months,
            input.current_rent * (1.0 - max_discount / 100.0)
        ),
    });

    if action == "negotiate" {
        scripts.push(NegotiationScript {
            scenario: "Pushback Response".to_string(),
            script: format!(
                "I understand you have costs to consider. However, finding and screening a new tenant \
                 typically costs $3,000-$5,000 in turnover costs plus lost rent. I'm offering guaranteed \
                 occupancy at a competitive rate. Can we meet in the middle at ${:.0}/month?",
                input.current_rent * (1.0 - max_discount / 200.0)
            ),
        });
    }

    scripts.push(NegotiationScript {
        scenario: "Alternative Ask".to_string(),
        script: "If a rent reduction isn't possible, I'd be open to other concessions — \
                 waived parking fees, a storage unit, or a month of free rent spread across the lease term."
            .to_string(),
    });

    scripts
}

fn generate_timing_advice(input: &RenewalStrategyInput) -> String {
    let months_before_end = if input.lease_end_month >= input.current_month {
        input.lease_end_month - input.current_month
    } else {
        12 - input.current_month + input.lease_end_month
    };

    if months_before_end >= 3 && months_before_end <= 4 {
        "Perfect timing — 60-90 days before lease end is the ideal negotiation window.".to_string()
    } else if months_before_end > 4 {
        format!(
            "Your lease ends in ~{} months. Start the conversation 60-90 days before expiration for best results.",
            months_before_end
        )
    } else if months_before_end >= 1 {
        "You're close to your lease end. Initiate negotiations immediately to avoid defaulting to a month-to-month rate.".to_string()
    } else {
        "Your lease may have already expired. Contact your landlord immediately to negotiate before month-to-month rates kick in.".to_string()
    }
}

// ============================================
// TESTS
// ============================================

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_deal_input() -> DealScoreInput {
        DealScoreInput {
            current_rent: 1500.0,
            market_rent: 1600.0,
            avg_rent_per_sqft: 1.85,
            unit_sqft: 850.0,
            occupancy_rate: 88.0,
            market_occupancy: 93.0,
            concession_value: 500.0,
            market_concession_value: 300.0,
            rent_trend_3mo: -1.5,
            rent_trend_12mo: 2.0,
            google_rating: Some(4.0),
            building_year: 2010,
            amenity_count: 10,
        }
    }

    fn sample_leverage_input() -> LeverageScoreInput {
        LeverageScoreInput {
            occupancy_rate: 88.0,
            market_occupancy: 93.0,
            current_month: 12,
            rent_vs_market_pct: 1.08,
            concession_prevalence: 35.0,
            building_age: 20,
            google_rating: Some(3.5),
            property_units: 180,
        }
    }

    fn sample_renewal_input() -> RenewalStrategyInput {
        RenewalStrategyInput {
            current_rent: 1600.0,
            market_rent: 1500.0,
            occupancy_rate: 88.0,
            tenant_tenure_months: 24,
            on_time_payment_rate: 98.5,
            current_month: 11,
            rent_trend_3mo: -1.0,
            concession_value: 400.0,
            lease_end_month: 2,
        }
    }

    #[test]
    fn test_deal_score() {
        let input = sample_deal_input();
        let result = calculate_deal_score_internal(&input);
        assert!(result.score > 0.0 && result.score <= 100.0);
        assert_eq!(result.factors.len(), 5);
        assert!(!result.summary.is_empty());
        assert!(!result.recommendation.is_empty());
    }

    #[test]
    fn test_deal_score_overpriced() {
        let mut input = sample_deal_input();
        input.current_rent = 2000.0;
        input.market_rent = 1500.0;
        let result = calculate_deal_score_internal(&input);
        assert!(result.score < 50.0, "Overpriced property should score low");
    }

    #[test]
    fn test_deal_score_great_deal() {
        let mut input = sample_deal_input();
        input.current_rent = 1200.0;
        input.market_rent = 1600.0;
        input.occupancy_rate = 78.0;
        let result = calculate_deal_score_internal(&input);
        assert!(result.score > 70.0, "Great deal should score high");
    }

    #[test]
    fn test_leverage_score() {
        let input = sample_leverage_input();
        let result = calculate_leverage_score_internal(&input);
        assert!(result.score > 0.0 && result.score <= 100.0);
        assert!(!result.negotiation_tips.is_empty());
        assert!(!result.best_timing.is_empty());
    }

    #[test]
    fn test_renewal_strategy() {
        let input = sample_renewal_input();
        let result = calculate_renewal_strategy_internal(&input);
        assert!(result.target_rent > 0.0);
        assert!(result.max_discount_pct >= 0.0 && result.max_discount_pct <= 20.0);
        assert!(!result.talking_points.is_empty());
        assert!(!result.scripts.is_empty());
        assert!(!result.timing_advice.is_empty());
        assert!(["negotiate", "renew", "explore"].contains(&result.recommended_action.as_str()));
    }

    #[test]
    fn test_renewal_strategy_below_market() {
        let mut input = sample_renewal_input();
        input.current_rent = 1300.0;
        input.market_rent = 1500.0;
        input.occupancy_rate = 98.0;
        let result = calculate_renewal_strategy_internal(&input);
        assert_eq!(result.recommended_action, "renew");
    }

    #[test]
    fn test_zero_values() {
        let input = DealScoreInput {
            current_rent: 0.0,
            market_rent: 0.0,
            avg_rent_per_sqft: 0.0,
            unit_sqft: 0.0,
            occupancy_rate: 0.0,
            market_occupancy: 0.0,
            concession_value: 0.0,
            market_concession_value: 0.0,
            rent_trend_3mo: 0.0,
            rent_trend_12mo: 0.0,
            google_rating: None,
            building_year: 2020,
            amenity_count: 0,
        };
        let result = calculate_deal_score_internal(&input);
        assert!(result.score >= 0.0 && result.score <= 100.0);
    }
}
