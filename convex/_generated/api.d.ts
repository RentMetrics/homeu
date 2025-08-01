/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as enrich_properties from "../enrich_properties.js";
import type * as google_places from "../google_places.js";
import type * as leases from "../leases.js";
import type * as monthly_data from "../monthly_data.js";
import type * as multifamilyproperties from "../multifamilyproperties.js";
import type * as properties from "../properties.js";
import type * as renters from "../renters.js";
import type * as seed from "../seed.js";
import type * as straddle from "../straddle.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  enrich_properties: typeof enrich_properties;
  google_places: typeof google_places;
  leases: typeof leases;
  monthly_data: typeof monthly_data;
  multifamilyproperties: typeof multifamilyproperties;
  properties: typeof properties;
  renters: typeof renters;
  seed: typeof seed;
  straddle: typeof straddle;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
