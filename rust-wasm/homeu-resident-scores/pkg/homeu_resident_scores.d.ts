/* tslint:disable */
/* eslint-disable */

/**
 * Calculate deal score from JSON input
 */
export function calculate_deal_score(input_json: string): string;

/**
 * Calculate apartment desirability score from JSON input
 */
export function calculate_desirability(input_json: string): string;

/**
 * Calculate leverage score from JSON input
 */
export function calculate_leverage_score(input_json: string): string;

/**
 * Calculate rent negotiation power from JSON input
 */
export function calculate_negotiation(input_json: string): string;

/**
 * Calculate renewal strategy from JSON input
 */
export function calculate_renewal_strategy(input_json: string): string;

/**
 * Calculate HomeU Renter Score from JSON input
 */
export function calculate_renter_score(input_json: string): string;

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
 * Initialize the WASM module (called automatically)
 */
export function init(): void;
