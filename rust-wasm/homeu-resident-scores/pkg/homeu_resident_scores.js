/* @ts-self-types="./homeu_resident_scores.d.ts" */

import * as wasm from "./homeu_resident_scores_bg.wasm";
import { __wbg_set_wasm } from "./homeu_resident_scores_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    calculate_deal_score, calculate_desirability, calculate_leverage_score, calculate_negotiation, calculate_renewal_strategy, calculate_renter_score, get_current_month, get_current_timestamp_ms, get_current_year, get_version, health_check, init
} from "./homeu_resident_scores_bg.js";
