/**
 * WASM Module Loader
 *
 * Provides lazy initialization of WASM modules for scoring calculations.
 * Modules are loaded on-demand to reduce initial bundle size.
 */

// Type definitions for WASM modules
interface ResidentScoresModule {
  calculate_desirability: (input: string) => string;
  calculate_negotiation: (input: string) => string;
  calculate_renter_score: (input: string) => string;
  calculate_deal_score: (input: string) => string;
  calculate_leverage_score: (input: string) => string;
  calculate_renewal_strategy: (input: string) => string;
  get_version: () => string;
  health_check: () => boolean;
}

interface PMScoresModule {
  calculate_tenant_risk: (input: string) => string;
  calculate_tenant_risks_batch: (input: string) => string;
  calculate_creditworthiness: (input: string) => string;
  calculate_creditworthiness_batch: (input: string) => string;
  calculate_collection_forecast: (input: string) => string;
  calculate_portfolio_risk: (input: string) => string;
  calculate_portfolio_summary: (input: string) => string;
  get_version: () => string;
  health_check: () => boolean;
}

// Module singletons
let residentModule: ResidentScoresModule | null = null;
let pmModule: PMScoresModule | null = null;
let initPromise: { resident?: Promise<ResidentScoresModule>; pm?: Promise<PMScoresModule> } = {};

/**
 * Check if WASM is supported in the current environment
 */
export function isWasmSupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(
        new Uint8Array([0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])
      );
      return module instanceof WebAssembly.Module;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Initialize the resident scores WASM module
 */
export async function initResidentScores(): Promise<ResidentScoresModule> {
  if (residentModule) {
    return residentModule;
  }

  if (initPromise.resident) {
    return initPromise.resident;
  }

  initPromise.resident = (async () => {
    try {
      // Dynamic import of the WASM module (bundler target auto-initializes)
      const wasm = await import('../../../rust-wasm/homeu-resident-scores/pkg/homeu_resident_scores');

      residentModule = wasm as unknown as ResidentScoresModule;

      // Verify module loaded correctly
      if (!residentModule.health_check()) {
        throw new Error('Resident scores module health check failed');
      }

      console.log(`[WASM] Resident scores module loaded, version: ${residentModule.get_version()}`);
      return residentModule;
    } catch (error) {
      console.error('[WASM] Failed to load resident scores module:', error);
      throw error;
    }
  })();

  return initPromise.resident;
}

/**
 * Initialize the property manager scores WASM module
 */
export async function initPMScores(): Promise<PMScoresModule> {
  if (pmModule) {
    return pmModule;
  }

  if (initPromise.pm) {
    return initPromise.pm;
  }

  initPromise.pm = (async () => {
    try {
      // Dynamic import of the WASM module (bundler target auto-initializes)
      const wasm = await import('../../../rust-wasm/homeu-pm-scores/pkg/homeu_pm_scores');

      pmModule = wasm as unknown as PMScoresModule;

      // Verify module loaded correctly
      if (!pmModule.health_check()) {
        throw new Error('PM scores module health check failed');
      }

      console.log(`[WASM] PM scores module loaded, version: ${pmModule.get_version()}`);
      return pmModule;
    } catch (error) {
      console.error('[WASM] Failed to load PM scores module:', error);
      throw error;
    }
  })();

  return initPromise.pm;
}

/**
 * Get the resident scores module (must be initialized first)
 */
export function getResidentScores(): ResidentScoresModule | null {
  return residentModule;
}

/**
 * Get the PM scores module (must be initialized first)
 */
export function getPMScores(): PMScoresModule | null {
  return pmModule;
}

/**
 * Initialize all WASM modules
 */
export async function initAllModules(): Promise<void> {
  await Promise.all([
    initResidentScores(),
    initPMScores(),
  ]);
}

/**
 * Clear loaded modules (useful for testing)
 */
export function clearModules(): void {
  residentModule = null;
  pmModule = null;
  initPromise = {};
}

// Re-export types
export * from './types';
