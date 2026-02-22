/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as admin from "../admin.js";
import type * as argyle from "../argyle.js";
import type * as blockchain from "../blockchain.js";
import type * as enrich_properties from "../enrich_properties.js";
import type * as google_places from "../google_places.js";
import type * as google_places_enrichment from "../google_places_enrichment.js";
import type * as homeuFees from "../homeuFees.js";
import type * as leases from "../leases.js";
import type * as monthly_data from "../monthly_data.js";
import type * as multifamilyproperties from "../multifamilyproperties.js";
import type * as points from "../points.js";
import type * as properties from "../properties.js";
import type * as propertyImages from "../propertyImages.js";
import type * as propertyManagers from "../propertyManagers.js";
import type * as rentPayments from "../rentPayments.js";
import type * as rentPredictions from "../rentPredictions.js";
import type * as rentalHistory from "../rentalHistory.js";
import type * as renters from "../renters.js";
import type * as rewards from "../rewards.js";
import type * as seed from "../seed.js";
import type * as statements from "../statements.js";
import type * as straddle from "../straddle.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  admin: typeof admin;
  argyle: typeof argyle;
  blockchain: typeof blockchain;
  enrich_properties: typeof enrich_properties;
  google_places: typeof google_places;
  google_places_enrichment: typeof google_places_enrichment;
  homeuFees: typeof homeuFees;
  leases: typeof leases;
  monthly_data: typeof monthly_data;
  multifamilyproperties: typeof multifamilyproperties;
  points: typeof points;
  properties: typeof properties;
  propertyImages: typeof propertyImages;
  propertyManagers: typeof propertyManagers;
  rentPayments: typeof rentPayments;
  rentPredictions: typeof rentPredictions;
  rentalHistory: typeof rentalHistory;
  renters: typeof renters;
  rewards: typeof rewards;
  seed: typeof seed;
  statements: typeof statements;
  straddle: typeof straddle;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
