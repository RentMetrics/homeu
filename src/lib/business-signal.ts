/**
 * BusinessSignal SDK — vendored
 *
 * One file. Drop a copy into each of your businesses (e.g., `lib/business-signal.ts`)
 * and import from there. Both the polling endpoint (business → hub asks for snapshot)
 * and the event push (business → hub) use the same HMAC-SHA256 scheme.
 *
 * Canonical message:    `${business}.${timestampMs}.${bodyHash}`
 *   - bodyHash is "" for empty-body GET requests (i.e., the snapshot endpoint).
 *   - timestampMs must be within ±5 minutes of server time.
 *
 * Header contract:
 *   x-signal-business    : the business slug (e.g., "rentmetrics")
 *   x-signal-timestamp   : ms epoch
 *   x-signal-body-hash   : sha256 hex of the raw body (or empty string)
 *   x-signal-signature   : sha256 HMAC of the canonical message, hex-encoded
 */

import { createHmac, createHash, timingSafeEqual } from "node:crypto";

/* ============================== Types ============================== */

export type SnapshotInput = {
  health?:  { ok?: boolean; p95LatencyMs?: number; errorRate?: number };
  users?:   { total?: number; new24h?: number; active7d?: number; active30d?: number };
  revenue?: { mrr?: number; arr?: number; paying?: number; ltv?: number; churn30d?: number };
  growth?:  { signups24h?: number; signups7d?: number; conversions24h?: number };
  traffic?: { sessions24h?: number; pageviews24h?: number; topReferrers?: { source: string; visits: number }[] };
  custom?:  Record<string, number | string | null>;
};

export type Snapshot = SnapshotInput & {
  business: string;
  schemaVersion: 1;
  capturedAt: number;
};

export type EmittedEvent = {
  business: string;
  occurredAt: number;
  kind: string;
  payload: Record<string, unknown>;
};

/* ============================== HMAC ============================== */

const SIGNATURE_DRIFT_MS = 5 * 60_000;

export function sha256Hex(buf: string | Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

export function sign(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function verify(secret: string, message: string, signature: string): boolean {
  if (!signature) return false;
  const expected = sign(secret, message);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

export function buildMessage(business: string, timestampMs: number, bodyHash: string): string {
  return `${business}.${timestampMs}.${bodyHash}`;
}

/* =========================== Snapshot endpoint =========================== */

type CollectFn = () => Promise<SnapshotInput> | SnapshotInput;

/**
 * Wraps a Next.js route handler. Each business writes only `collect()`.
 *
 * Example:
 *   export const GET = createMetricsHandler({
 *     business: "rentmetrics",
 *     secret: process.env.BUSINESS_SIGNAL_SECRET!,
 *     collect: async () => ({ users: { total: ... }, revenue: { mrr: ... } }),
 *   });
 */
export function createMetricsHandler(opts: {
  business: string;
  secret: string;
  collect: CollectFn;
}) {
  return async function GET(req: Request): Promise<Response> {
    const headers = req.headers;
    const sig = headers.get("x-signal-signature") ?? "";
    const ts = headers.get("x-signal-timestamp") ?? "";
    const bodyHash = headers.get("x-signal-body-hash") ?? "";
    const business = headers.get("x-signal-business") ?? opts.business;

    if (business !== opts.business) {
      return jsonError(401, "business mismatch");
    }
    if (!sig || !ts) {
      return jsonError(401, "missing signature");
    }
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > SIGNATURE_DRIFT_MS) {
      return jsonError(401, "stale or invalid timestamp");
    }

    const message = buildMessage(business, tsNum, bodyHash);
    if (!verify(opts.secret, message, sig)) {
      return jsonError(401, "invalid signature");
    }

    let collected: SnapshotInput;
    try {
      collected = await opts.collect();
    } catch (err: any) {
      return Response.json({
        error: "collect_failed",
        message: String(err?.message ?? err),
      }, { status: 500 });
    }

    const snapshot: Snapshot = {
      business: opts.business,
      schemaVersion: 1,
      capturedAt: Date.now(),
      ...collected,
    };
    return Response.json(snapshot);
  };
}

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

/* =========================== Event push =========================== */

/**
 * Push a real-time event to the hub. Non-blocking; never throws.
 * Requires HUB_URL + business slug + secret.
 *
 * Example:
 *   await emitEvent({
 *     hubUrl: process.env.MARKETING_HUB_URL!,
 *     business: "rentmetrics",
 *     secret: process.env.BUSINESS_SIGNAL_SECRET!,
 *     kind: "paying_customer.created",
 *     payload: { plan: "pro", mrr: 99 },
 *   });
 */
export async function emitEvent(opts: {
  hubUrl: string;
  business: string;
  secret: string;
  kind: string;
  payload?: Record<string, unknown>;
  /** Override timeout (ms). Default 3000. */
  timeoutMs?: number;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!opts.hubUrl || !opts.secret) {
      return { ok: false, error: "missing hubUrl or secret" };
    }
    const occurredAt = Date.now();
    const event: EmittedEvent = {
      business: opts.business,
      occurredAt,
      kind: opts.kind,
      payload: opts.payload ?? {},
    };
    const body = JSON.stringify(event);
    const bodyHash = sha256Hex(body);
    const message = buildMessage(opts.business, occurredAt, bodyHash);
    const signature = sign(opts.secret, message);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 3000);

    const res = await fetch(`${opts.hubUrl.replace(/\/$/, "")}/api/webhooks/business-event`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-signal-business":  opts.business,
        "x-signal-timestamp": String(occurredAt),
        "x-signal-body-hash": bodyHash,
        "x-signal-signature": signature,
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, error: `hub responded ${res.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    // Never break the host app. Caller can choose to log; we don't.
    return { ok: false, error: String(err?.message ?? err) };
  }
}

/* =========================== Hub-side helpers =========================== */

/**
 * Sign an outbound poll request. Used by AIMarketingHub when fetching a
 * business's snapshot endpoint.
 */
export function signPollRequest(opts: {
  business: string;
  secret: string;
  timestampMs?: number;
}): {
  headers: Record<string, string>;
  timestampMs: number;
  signature: string;
} {
  const ts = opts.timestampMs ?? Date.now();
  const bodyHash = ""; // GET, no body
  const message = buildMessage(opts.business, ts, bodyHash);
  const signature = sign(opts.secret, message);
  return {
    timestampMs: ts,
    signature,
    headers: {
      "x-signal-business":  opts.business,
      "x-signal-timestamp": String(ts),
      "x-signal-body-hash": bodyHash,
      "x-signal-signature": signature,
    },
  };
}

/**
 * Verify an inbound event POST. Used by AIMarketingHub's webhook receiver.
 * Returns parsed event on success or null on any failure (no info leak).
 */
export function verifyEventRequest(opts: {
  secret: string;
  business: string;
  rawBody: string;
  signature: string;
  timestampMs: number;
  bodyHash: string;
}): EmittedEvent | null {
  if (!opts.signature || !opts.timestampMs) return null;
  if (Math.abs(Date.now() - opts.timestampMs) > SIGNATURE_DRIFT_MS) return null;
  // Re-derive bodyHash from rawBody and confirm header matches.
  const derived = sha256Hex(opts.rawBody);
  if (derived !== opts.bodyHash) return null;
  const message = buildMessage(opts.business, opts.timestampMs, opts.bodyHash);
  if (!verify(opts.secret, message, opts.signature)) return null;
  try {
    const parsed = JSON.parse(opts.rawBody) as EmittedEvent;
    if (parsed.business !== opts.business) return null;
    if (typeof parsed.kind !== "string" || !parsed.kind) return null;
    return parsed;
  } catch {
    return null;
  }
}

/* =========================== Defaults helper =========================== */

/**
 * Convenience: produce a sensible empty snapshot to merge with real data.
 * Each business may not have all metric categories; this gives them safe zeros.
 */
export function emptySnapshot(): SnapshotInput {
  return {
    health: { ok: true },
    users: {},
    revenue: {},
    growth: {},
    traffic: {},
    custom: {},
  };
}
