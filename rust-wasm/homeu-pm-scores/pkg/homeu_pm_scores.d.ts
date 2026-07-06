/* tslint:disable */
/* eslint-disable */

/**
 * Calculate collection forecast from JSON input
 */
export function calculate_collection_forecast(input_json: string): string;

/**
 * Calculate credit worthiness from JSON input
 */
export function calculate_creditworthiness(input_json: string): string;

/**
 * Calculate credit worthiness for multiple renters
 */
export function calculate_creditworthiness_batch(input_json: string): string;

/**
 * Calculate portfolio risk from JSON input
 */
export function calculate_portfolio_risk(input_json: string): string;

/**
 * Calculate portfolio summary statistics from JSON input
 */
export function calculate_portfolio_summary(input_json: string): string;

/**
 * Calculate tenant risk score from JSON input
 */
export function calculate_tenant_risk(input_json: string): string;

/**
 * Calculate risk scores for multiple tenants
 */
export function calculate_tenant_risks_batch(input_json: string): string;

/**
 * Get current month (1-12)
 */
export function get_current_month(): number;

/**
 * Get current timestamp in milliseconds
 */
export function get_current_timestamp_ms(): bigint;

/**
 * Get current year (fallback for WASM)
 */
export function get_current_year(): number;

/**
 * Get module version
 */
export function get_version(): string;

/**
 * Health check
 */
export function health_check(): boolean;

/**
 * Initialize the WASM module
 */
export function init(): void;
