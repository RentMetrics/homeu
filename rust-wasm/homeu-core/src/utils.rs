//! Utility functions for scoring calculations

use wasm_bindgen::prelude::*;

/// Clamp a value between min and max
pub fn clamp(value: f64, min: f64, max: f64) -> f64 {
    value.max(min).min(max)
}

/// Normalize a value from one range to another
pub fn normalize(value: f64, old_min: f64, old_max: f64, new_min: f64, new_max: f64) -> f64 {
    if old_max == old_min {
        return new_min;
    }
    let ratio = (value - old_min) / (old_max - old_min);
    new_min + ratio * (new_max - new_min)
}

/// Calculate weighted average
pub fn weighted_average(values: &[(f64, f64)]) -> f64 {
    let (sum, weight_sum) = values.iter().fold((0.0, 0.0), |(sum, weight_sum), &(value, weight)| {
        (sum + value * weight, weight_sum + weight)
    });

    if weight_sum == 0.0 {
        0.0
    } else {
        sum / weight_sum
    }
}

/// Calculate payment rate from counts
pub fn calculate_payment_rate(on_time: u32, late: u32, missed: u32) -> f64 {
    let total = on_time + late + missed;
    if total == 0 {
        return 50.0; // Default to neutral if no history
    }
    (on_time as f64 / total as f64) * 100.0
}

/// Calculate rent to income ratio
pub fn rent_to_income_ratio(monthly_rent: f64, annual_income: f64) -> f64 {
    if annual_income <= 0.0 {
        return 100.0; // Worst case if no income
    }
    (monthly_rent * 12.0 / annual_income) * 100.0
}

/// Check if rent to income is acceptable (typically < 30%)
pub fn is_rent_affordable(monthly_rent: f64, annual_income: f64) -> bool {
    rent_to_income_ratio(monthly_rent, annual_income) <= 30.0
}

/// Calculate seasonal adjustment factor for collections
/// Winter months (Nov-Feb) typically have lower collection rates
pub fn seasonal_collection_factor(month: u32) -> f64 {
    match month {
        11 | 12 | 1 | 2 => 0.95, // Winter: -5%
        3 | 4 | 5 => 1.02,       // Spring: +2%
        6 | 7 | 8 => 1.0,        // Summer: neutral
        9 | 10 => 1.03,          // Fall: +3% (post summer, pre-holiday)
        _ => 1.0,
    }
}

/// Get negotiation seasonality bonus
/// Winter months and end of month are typically better for negotiating
pub fn negotiation_seasonality_points(month: u32) -> f64 {
    match month {
        11 | 12 | 1 | 2 => 15.0, // Winter: +15 points
        3 | 4 => 5.0,             // Early spring: +5 points
        5 | 6 | 7 | 8 => -10.0,   // Peak moving season: -10 points
        9 | 10 => 0.0,            // Neutral
        _ => 0.0,
    }
}

/// Calculate days until timestamp (milliseconds)
pub fn days_until(target_ms: i64, current_ms: i64) -> i32 {
    let diff_ms = target_ms - current_ms;
    (diff_ms / (1000 * 60 * 60 * 24)) as i32
}

/// Calculate months between two timestamps
pub fn months_between(start_ms: i64, end_ms: i64) -> u32 {
    let diff_ms = end_ms - start_ms;
    let days = diff_ms / (1000 * 60 * 60 * 24);
    (days / 30).max(0) as u32
}

/// Calculate standard deviation
pub fn standard_deviation(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    let mean = values.iter().sum::<f64>() / values.len() as f64;
    let variance = values.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / values.len() as f64;
    variance.sqrt()
}

/// Get current year (fallback for WASM)
#[wasm_bindgen]
pub fn get_current_year() -> u32 {
    let now = js_sys::Date::new_0();
    now.get_full_year()
}

/// Get current month (1-12)
#[wasm_bindgen]
pub fn get_current_month() -> u32 {
    let now = js_sys::Date::new_0();
    now.get_month() + 1 // JavaScript months are 0-indexed
}

/// Get current timestamp in milliseconds
#[wasm_bindgen]
pub fn get_current_timestamp_ms() -> i64 {
    js_sys::Date::now() as i64
}

/// Linear interpolation
pub fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * clamp(t, 0.0, 1.0)
}

/// Sigmoid function for smooth scoring curves
pub fn sigmoid(x: f64, midpoint: f64, steepness: f64) -> f64 {
    1.0 / (1.0 + (-steepness * (x - midpoint)).exp())
}

/// Convert score to percentile approximation
pub fn score_to_percentile(score: f64, mean: f64, std_dev: f64) -> f64 {
    if std_dev <= 0.0 {
        return 50.0;
    }
    let z = (score - mean) / std_dev;
    // Approximation of CDF for normal distribution
    let t = 1.0 / (1.0 + 0.2316419 * z.abs());
    let d = 0.3989423 * (-z * z / 2.0).exp();
    let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    if z > 0.0 {
        (1.0 - prob) * 100.0
    } else {
        prob * 100.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clamp() {
        assert_eq!(clamp(50.0, 0.0, 100.0), 50.0);
        assert_eq!(clamp(-10.0, 0.0, 100.0), 0.0);
        assert_eq!(clamp(150.0, 0.0, 100.0), 100.0);
    }

    #[test]
    fn test_normalize() {
        assert_eq!(normalize(50.0, 0.0, 100.0, 0.0, 1.0), 0.5);
        assert_eq!(normalize(0.0, 0.0, 100.0, 0.0, 1.0), 0.0);
        assert_eq!(normalize(100.0, 0.0, 100.0, 0.0, 1.0), 1.0);
    }

    #[test]
    fn test_weighted_average() {
        let values = vec![(80.0, 0.3), (70.0, 0.5), (90.0, 0.2)];
        let avg = weighted_average(&values);
        assert!((avg - 77.0).abs() < 0.01);
    }

    #[test]
    fn test_rent_to_income_ratio() {
        // $1500/month rent, $60000/year income = 30%
        let ratio = rent_to_income_ratio(1500.0, 60000.0);
        assert!((ratio - 30.0).abs() < 0.01);
    }
}
