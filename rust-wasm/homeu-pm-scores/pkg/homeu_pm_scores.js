/* @ts-self-types="./homeu_pm_scores.d.ts" */

import * as wasm from "./homeu_pm_scores_bg.wasm";
import { __wbg_set_wasm } from "./homeu_pm_scores_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    calculate_collection_forecast, calculate_creditworthiness, calculate_creditworthiness_batch, calculate_portfolio_risk, calculate_portfolio_summary, calculate_tenant_risk, calculate_tenant_risks_batch, get_current_month, get_current_timestamp_ms, get_current_year, get_version, health_check, init
} from "./homeu_pm_scores_bg.js";
