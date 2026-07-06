//! Apartment Desirability Score Calculator
//!
//! Calculates a 0-100 score representing how desirable an apartment is based on:
//! - Market factors (30%): rent vs market, occupancy, trends
//! - Location (25%): Google rating, walkability, transit
//! - Amenities (20%): count, building age, unit size
//! - Price trends (15%): 3/12 month trends, concessions
//! - Value position (10%): price per sqft comparison

use homeu_core::{
    types::*,
    utils::*,
    weights::DesirabilityWeights,
};
use wasm_bindgen::prelude::*;

/// Calculate apartment desirability score from JSON input
#[wasm_bindgen]
pub fn calculate_desirability(input_json: &str) -> Result<String, JsValue> {
    let input: DesirabilityInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;

    let result = calculate_desirability_score(&input);

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Core calculation logic
pub fn calculate_desirability_score(input: &DesirabilityInput) -> DesirabilityResult {
    let weights = DesirabilityWeights::default();
    let mut factors = Vec::new();

    // 1. Market Factors (30%)
    let market_score = calculate_market_score(input);
    factors.push(ScoreFactor {
        name: "Market Factors".to_string(),
        value: market_score,
        weight: weights.market_factors,
        contribution: market_score * weights.market_factors,
        description: format_market_description(input, market_score),
    });

    // 2. Location (25%)
    let location_score = calculate_location_score(input);
    factors.push(ScoreFactor {
        name: "Location".to_string(),
        value: location_score,
        weight: weights.location,
        contribution: location_score * weights.location,
        description: format_location_description(input, location_score),
    });

    // 3. Amenities (20%)
    let amenities_score = calculate_amenities_score(input);
    factors.push(ScoreFactor {
        name: "Amenities".to_string(),
        value: amenities_score,
        weight: weights.amenities,
        contribution: amenities_score * weights.amenities,
        description: format_amenities_description(input, amenities_score),
    });

    // 4. Price Trends (15%)
    let trends_score = calculate_trends_score(input);
    factors.push(ScoreFactor {
        name: "Price Trends".to_string(),
        value: trends_score,
        weight: weights.price_trends,
        contribution: trends_score * weights.price_trends,
        description: format_trends_description(input, trends_score),
    });

    // 5. Value Position (10%)
    let value_score = calculate_value_score(input);
    factors.push(ScoreFactor {
        name: "Value Position".to_string(),
        value: value_score,
        weight: weights.value_position,
        contribution: value_score * weights.value_position,
        description: format_value_description(input, value_score),
    });

    // Calculate final score
    let final_score = factors.iter().map(|f| f.contribution).sum::<f64>();
    let final_score = clamp(final_score, 0.0, 100.0);
    let grade = ScoreGrade::from_score(final_score);

    let summary = generate_summary(&grade, final_score, input);
    let recommendation = generate_recommendation(&grade, final_score, input);

    DesirabilityResult {
        score: (final_score * 10.0).round() / 10.0,
        grade,
        factors,
        summary,
        recommendation,
    }
}

fn calculate_market_score(input: &DesirabilityInput) -> f64 {
    let mut score = 50.0; // Base score

    // Rent vs market comparison (-30 to +30)
    let rent_ratio = input.current_rent / input.market_rent;
    if rent_ratio < 0.85 {
        score += 30.0; // Great deal
    } else if rent_ratio < 0.95 {
        score += 20.0; // Good deal
    } else if rent_ratio < 1.05 {
        score += 10.0; // Fair
    } else if rent_ratio < 1.15 {
        score -= 10.0; // Above market
    } else {
        score -= 30.0; // Well above market
    }

    // Occupancy rate effect (-10 to +20)
    if input.occupancy_rate < 85.0 {
        score += 20.0; // Low occupancy = negotiation leverage
    } else if input.occupancy_rate < 92.0 {
        score += 10.0;
    } else if input.occupancy_rate > 98.0 {
        score -= 10.0; // Very high demand
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_location_score(input: &DesirabilityInput) -> f64 {
    let mut score = 50.0;

    // Google rating (0-5 scale, contributes up to 30 points)
    if let Some(rating) = input.google_rating {
        score += (rating - 2.5) * 12.0; // 2.5 = neutral, 5.0 = +30, 0 = -30
    }

    // Walkability (0-100 scale, contributes up to 10 points)
    if let Some(walk_score) = input.walkability_score {
        score += ((walk_score as f64) - 50.0) / 5.0;
    }

    // Transit score (0-100 scale, contributes up to 10 points)
    if let Some(transit_score) = input.transit_score {
        score += ((transit_score as f64) - 50.0) / 5.0;
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_amenities_score(input: &DesirabilityInput) -> f64 {
    let mut score = 50.0;

    // Amenity count (0-20+ amenities, contributes up to 20 points)
    let amenity_points = (input.amenity_count as f64 * 2.0).min(20.0);
    score += amenity_points - 10.0;

    // Building age effect
    let current_year = get_current_year();
    let building_age = current_year.saturating_sub(input.building_year);

    if building_age <= 5 {
        score += 15.0; // New construction
    } else if building_age <= 15 {
        score += 10.0; // Modern
    } else if building_age <= 30 {
        score += 0.0; // Neutral
    } else if building_age <= 50 {
        score -= 5.0; // Older
    } else {
        score -= 10.0; // Very old
    }

    // Unit size (baseline 800 sqft)
    let size_adjustment = ((input.unit_sqft - 800.0) / 100.0).min(10.0).max(-10.0);
    score += size_adjustment;

    clamp(score, 0.0, 100.0)
}

fn calculate_trends_score(input: &DesirabilityInput) -> f64 {
    let mut score = 50.0;

    // 3-month rent trend (-10% to +10% = +30 to -30 points)
    let trend_3mo_points = -input.rent_trend_3mo * 3.0;
    score += clamp(trend_3mo_points, -30.0, 30.0);

    // 12-month rent trend (less weight than recent)
    let trend_12mo_points = -input.rent_trend_12mo * 1.5;
    score += clamp(trend_12mo_points, -15.0, 15.0);

    // Concessions bonus
    if input.has_concessions {
        let concession_bonus = (input.concession_value / input.current_rent * 10.0).min(10.0);
        score += concession_bonus;
    }

    clamp(score, 0.0, 100.0)
}

fn calculate_value_score(input: &DesirabilityInput) -> f64 {
    let mut score = 50.0;

    // Price per sqft comparison
    if input.market_price_per_sqft > 0.0 {
        let value_ratio = input.price_per_sqft / input.market_price_per_sqft;

        if value_ratio < 0.85 {
            score += 40.0; // Excellent value
        } else if value_ratio < 0.95 {
            score += 25.0; // Good value
        } else if value_ratio < 1.05 {
            score += 10.0; // Fair value
        } else if value_ratio < 1.15 {
            score -= 15.0; // Below average value
        } else {
            score -= 30.0; // Poor value
        }
    }

    clamp(score, 0.0, 100.0)
}

fn format_market_description(input: &DesirabilityInput, score: f64) -> String {
    let rent_diff_pct = ((input.current_rent / input.market_rent) - 1.0) * 100.0;
    if rent_diff_pct < -10.0 {
        format!("Excellent! Rent is {:.0}% below market rate. Occupancy at {:.0}%.", -rent_diff_pct, input.occupancy_rate)
    } else if rent_diff_pct < 0.0 {
        format!("Good value. Rent is {:.0}% below market. Occupancy at {:.0}%.", -rent_diff_pct, input.occupancy_rate)
    } else if rent_diff_pct < 10.0 {
        format!("Rent is near market rate ({:+.0}%). Occupancy at {:.0}%.", rent_diff_pct, input.occupancy_rate)
    } else {
        format!("Rent is {:.0}% above market rate. Consider negotiating.", rent_diff_pct)
    }
}

fn format_location_description(input: &DesirabilityInput, score: f64) -> String {
    let rating_str = input.google_rating
        .map(|r| format!("{:.1}/5 rating", r))
        .unwrap_or_else(|| "No rating".to_string());

    let walk_str = input.walkability_score
        .map(|w| format!("walkability {}", w))
        .unwrap_or_else(|| "walkability N/A".to_string());

    format!("Google {}, {}", rating_str, walk_str)
}

fn format_amenities_description(input: &DesirabilityInput, score: f64) -> String {
    let current_year = get_current_year();
    let age = current_year.saturating_sub(input.building_year);
    format!("{} amenities, built {} ({} years old), {} sqft unit",
            input.amenity_count, input.building_year, age, input.unit_sqft as u32)
}

fn format_trends_description(input: &DesirabilityInput, score: f64) -> String {
    let trend_3mo = if input.rent_trend_3mo > 0.0 { "+" } else { "" };
    let trend_12mo = if input.rent_trend_12mo > 0.0 { "+" } else { "" };
    let concession_str = if input.has_concessions {
        format!(", ${:.0} in concessions available", input.concession_value)
    } else {
        String::new()
    };
    format!("3-mo trend: {}{:.1}%, 12-mo trend: {}{:.1}%{}",
            trend_3mo, input.rent_trend_3mo, trend_12mo, input.rent_trend_12mo, concession_str)
}

fn format_value_description(input: &DesirabilityInput, score: f64) -> String {
    format!("${:.2}/sqft vs market ${:.2}/sqft", input.price_per_sqft, input.market_price_per_sqft)
}

fn generate_summary(grade: &ScoreGrade, score: f64, input: &DesirabilityInput) -> String {
    match grade {
        ScoreGrade::Excellent => format!(
            "This apartment scores {:.0}/100 - an excellent choice! It offers great value relative to the market.",
            score
        ),
        ScoreGrade::Good => format!(
            "This apartment scores {:.0}/100 - a good option. It compares favorably to similar units in the area.",
            score
        ),
        ScoreGrade::Fair => format!(
            "This apartment scores {:.0}/100 - fair value. Consider comparing with other options in the area.",
            score
        ),
        ScoreGrade::Poor => format!(
            "This apartment scores {:.0}/100. There may be better options available at this price point.",
            score
        ),
        ScoreGrade::VeryPoor => format!(
            "This apartment scores {:.0}/100. We recommend exploring other options in the market.",
            score
        ),
    }
}

fn generate_recommendation(grade: &ScoreGrade, score: f64, input: &DesirabilityInput) -> String {
    let rent_ratio = input.current_rent / input.market_rent;

    if rent_ratio > 1.1 && input.occupancy_rate < 92.0 {
        return "Strong negotiation opportunity. Rent is above market and occupancy is moderate. Request a rent reduction.".to_string();
    }

    if input.has_concessions {
        return format!("Take advantage of current concessions worth ${:.0}. Lock in before they expire.", input.concession_value);
    }

    match grade {
        ScoreGrade::Excellent | ScoreGrade::Good => {
            "This is a solid choice. If you're ready, consider applying soon as good deals move quickly.".to_string()
        }
        ScoreGrade::Fair => {
            "Acceptable option but shop around. Check comparable listings within a mile radius.".to_string()
        }
        _ => {
            "We recommend exploring other options. Use our search filters to find better-value apartments.".to_string()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_input() -> DesirabilityInput {
        DesirabilityInput {
            current_rent: 1500.0,
            market_rent: 1600.0,
            occupancy_rate: 88.0,
            rent_trend_3mo: -2.0,
            rent_trend_12mo: 3.0,
            google_rating: Some(4.2),
            walkability_score: Some(75),
            transit_score: Some(60),
            amenity_count: 12,
            building_year: 2015,
            unit_sqft: 850.0,
            price_per_sqft: 1.76,
            market_price_per_sqft: 1.85,
            has_concessions: true,
            concession_value: 500.0,
        }
    }

    #[test]
    fn test_desirability_calculation() {
        let input = sample_input();
        let result = calculate_desirability_score(&input);

        assert!(result.score > 0.0 && result.score <= 100.0);
        assert!(!result.factors.is_empty());
        assert!(!result.summary.is_empty());
    }
}
