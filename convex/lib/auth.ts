/**
 * Access-control helpers.
 *
 * HomeU historically passed the Clerk `userId` as a function ARG and trusted
 * it ("auth-by-arg"). Convex URLs are public, so anyone could pass any
 * userId. These helpers derive the caller from the Clerk identity that
 * ConvexProviderWithClerk attaches (see convex/auth.config.ts), and let the
 * app's own Next.js API routes / webhooks act on behalf of a user by
 * presenting CONVEX_SERVER_KEY.
 *
 * The legacy `userId` args are kept (optional) so existing call sites keep
 * working: when present they must match the signed-in user (admins and
 * server-key callers may act on anyone).
 */
import type { UserIdentity } from "convex/server";
import type { GenericQueryCtx, GenericMutationCtx, GenericActionCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

type AnyCtx =
  | GenericQueryCtx<DataModel>
  | GenericMutationCtx<DataModel>
  | GenericActionCtx<DataModel>;

// Mirror of src/lib/admin.ts. ADMIN_EMAILS (comma-separated) on the Convex
// deployment overrides this list when set.
const DEFAULT_ADMIN_EMAILS = [
  "curtisholder91@gmail.com",
  "curtisholder@gmail.com",
  "curtis@homeu.co",
  "cholder@excelsaholding.com",
];

function adminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

function adminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Constant-time string comparison (no node:crypto in the default runtime). */
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** True when `serverKey` matches CONVEX_SERVER_KEY (server-to-Convex calls). */
export function isValidServerKey(serverKey: string | undefined | null): boolean {
  const expected = process.env.CONVEX_SERVER_KEY;
  if (!expected || !serverKey) return false;
  return safeEqual(serverKey, expected);
}

export function requireServerKey(serverKey: string | undefined | null): void {
  if (!isValidServerKey(serverKey)) {
    throw new Error("Unauthorized");
  }
}

export function isAdminIdentity(identity: UserIdentity | null): boolean {
  if (!identity) return false;
  if (adminUserIds().includes(identity.subject)) return true;
  const email = identity.email?.toLowerCase();
  if (!email) return false;
  // Clerk marks unverified addresses; only trust verified (or unspecified) ones.
  if (identity.emailVerified === false) return false;
  return adminEmails().includes(email);
}

export async function isAdmin(ctx: AnyCtx): Promise<boolean> {
  return isAdminIdentity(await ctx.auth.getUserIdentity());
}

/** Throws unless the caller is an admin (or presents the server key). */
export async function requireAdmin(
  ctx: AnyCtx,
  serverKey?: string | null
): Promise<void> {
  if (isValidServerKey(serverKey)) return;
  if (!(await isAdmin(ctx))) {
    throw new Error("Unauthorized: admin access required");
  }
}

/** Throws unless signed in; returns the caller's Clerk user id. */
export async function requireUserId(ctx: AnyCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}

/**
 * Resolve which user a call acts on.
 * - server key → trust `requestedUserId` (required).
 * - signed-in → the caller; a different `requestedUserId` is only allowed
 *   for admins.
 * - otherwise → throws.
 */
export async function resolveUserId(
  ctx: AnyCtx,
  requestedUserId?: string | null,
  serverKey?: string | null
): Promise<string> {
  if (isValidServerKey(serverKey)) {
    if (!requestedUserId) throw new Error("userId is required");
    return requestedUserId;
  }
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  if (requestedUserId && requestedUserId !== identity.subject) {
    if (!isAdminIdentity(identity)) {
      throw new Error("Unauthorized");
    }
    return requestedUserId;
  }
  return identity.subject;
}

/**
 * Like resolveUserId but returns null instead of throwing — for reactive
 * queries, so a signed-out or mismatched caller gets "no data" rather than
 * a crashed page.
 */
export async function tryResolveUserId(
  ctx: AnyCtx,
  requestedUserId?: string | null,
  serverKey?: string | null
): Promise<string | null> {
  try {
    return await resolveUserId(ctx, requestedUserId, serverKey);
  } catch {
    return null;
  }
}
