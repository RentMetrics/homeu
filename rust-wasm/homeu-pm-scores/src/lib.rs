//! HomeU Property Manager Scores WASM Module
//!
//! Provides high-performance scoring calculations for property managers:
//! - Rent Roll Risk Score (per-tenant payment likelihood)
//! - Credit Worthiness Assessment (proxy credit scoring)
//! - Collection Likelihood by Month (portfolio forecasting)
//! - Portfolio Risk Dashboard

use wasm_bindgen::prelude::*;

pub mod risk_score;
pub mod creditworthiness;
pub mod collection;
pub mod portfolio;

pub use risk_score::*;
pub use creditworthiness::*;
pub use collection::*;
pub use portfolio::*;

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
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
