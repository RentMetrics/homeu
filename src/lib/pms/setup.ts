/**
 * Per-provider setup requirements — drives the admin setup guide UI and the
 * credential-check endpoint. Keep in sync with docs/pms/*.md and the
 * adapters in providers.ts.
 */

export interface ProviderSetup {
  label: string;
  /** Env var suffixes required under PMS_{REF}_ */
  envSuffixes: string[];
  /** Fixed global env vars (not per-ref) */
  globalVars: string[];
  /** Connection fields that must be filled for submissions to work */
  requiredFields: Array<"externalPropertyId" | "apiBaseUrl" | "fallbackEmail">;
  /** One-line summary of how access is obtained */
  accessSummary: string;
  docPath: string;
}

export const PROVIDER_SETUP: Record<string, ProviderSetup> = {
  entrata: {
    label: "Entrata",
    envSuffixes: ["USERNAME", "PASSWORD"],
    globalVars: [],
    requiredFields: ["externalPropertyId", "apiBaseUrl"],
    accessSummary:
      "PM company requests a Web Services API user (Leads/sendLeads) from their Entrata account manager; base URL is their subdomain.",
    docPath: "docs/pms/entrata.md",
  },
  yardi: {
    label: "Yardi Voyager",
    envSuffixes: ["USERNAME", "PASSWORD"],
    globalVars: [
      "PMS_YARDI_SERVER_NAME",
      "PMS_YARDI_DATABASE",
      "PMS_YARDI_INTERFACE_LICENSE",
    ],
    requiredFields: ["externalPropertyId", "apiBaseUrl"],
    accessSummary:
      "PM company licenses the ILS/Guest Card standard interface from Yardi for vendor \"HomeU\" (expect weeks + license fee).",
    docPath: "docs/pms/yardi.md",
  },
  realpage: {
    label: "RealPage",
    envSuffixes: ["API_KEY"],
    globalVars: [],
    requiredFields: ["externalPropertyId", "apiBaseUrl"],
    accessSummary:
      "Apply to RealPage Exchange partner program; each PM company authorizes HomeU on their PMC account.",
    docPath: "docs/pms/realpage.md",
  },
  buildium: {
    label: "Buildium",
    envSuffixes: ["CLIENT_ID", "CLIENT_SECRET"],
    globalVars: [],
    requiredFields: ["externalPropertyId"],
    accessSummary:
      "Self-serve: the PM company creates an API key in Buildium (Settings → API keys) — fastest provider to launch.",
    docPath: "docs/pms/buildium.md",
  },
  rentmanager: {
    label: "Rent Manager",
    envSuffixes: ["API_KEY"],
    globalVars: [],
    requiredFields: ["externalPropertyId", "apiBaseUrl"],
    accessSummary:
      "PM company creates an API user scoped to Prospects; instance URL is per-corporation.",
    docPath: "docs/pms/rentmanager.md",
  },
  appfolio: {
    label: "AppFolio",
    envSuffixes: [],
    globalVars: [],
    requiredFields: ["fallbackEmail"],
    accessSummary:
      "No public applicant API — submissions are emailed to the leasing office. Pursue AppFolio Stack for direct delivery.",
    docPath: "docs/pms/appfolio.md",
  },
  email: {
    label: "Email only",
    envSuffixes: [],
    globalVars: [],
    requiredFields: ["fallbackEmail"],
    accessSummary:
      "Full application summary is emailed to the property manager — no PMS credentials needed.",
    docPath: "docs/pms/README.md",
  },
};

export function envVarName(ref: string, suffix: string): string {
  return `PMS_${ref.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${suffix}`;
}
