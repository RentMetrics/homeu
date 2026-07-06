/**
 * BusinessSignal — HomeU snapshot endpoint
 * Polled every 15 min by AIMarketingHub.
 */

import { ConvexHttpClient } from "convex/browser";
import {
  createMetricsHandler,
  emptySnapshot,
  type SnapshotInput,
} from "@/lib/business-signal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECRET = process.env.BUSINESS_SIGNAL_SECRET;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

async function collect(): Promise<SnapshotInput> {
  const base = emptySnapshot();
  if (!CONVEX_URL) return { ...base, health: { ok: false } };

  // TODO: replace with a Convex query — see INTEGRATION.md
  // Suggested tables: users, organizations, awards, integrations
  // const convex = new ConvexHttpClient(CONVEX_URL);
  // const stats = await convex.query(api.businessSignal.getStats, {});

  return {
    ...base,
    custom: {
      // boolean is fine at runtime (JSON-serialized as-is); SnapshotInput's
      // custom record only admits string | number | null, hence the cast
      wired: true as unknown as string,
      note: "Implement convex/businessSignal.getStats — see INTEGRATION.md",
    },
  };
}

export const GET = SECRET
  ? createMetricsHandler({ business: "homeu", secret: SECRET, collect })
  : async () => Response.json({ error: "BUSINESS_SIGNAL_SECRET not set" }, { status: 503 });
