//! HomeU Resident Scores WASM Module
//!
//! Provides high-performance scoring calculations for residents:
//! - Apartment Desirability Score
//! - Rent Negotiation Calculator
//! - HomeU Renter Score

use wasm_bindgen::prelude::*;

pub mod desirability;
pub mod market_analysis;
pub mod negotiation;
pub mod renter_score;

pub use desirability::*;
pub use market_analysis::*;
pub use negotiation::*;
pub use renter_score::*;

/// Initialize the WASM module (called automatically)
#[wasm_bindgen(start)]
pub fn init() {
    // Set up panic hook for better error messages in browser console
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Get module version
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Health check
#[wasm_bindgen]
pub fn health_check() -> bool {
    true
}
