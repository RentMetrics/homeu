/**
 * PMS (Property Management Software) integration.
 *
 * Renters keep their application data (personal info, employment, rental
 * history, financial verification) in HomeU. These functions let that data
 * be submitted directly into a property's management system instead of the
 * renter re-typing it into the property's online application.
 *
 * Auth follows the codebase convention: Clerk auth is enforced at the
 * Next.js API layer; Convex functions receive the userId as an argument.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const SUPPORTED_PROVIDERS = [
  "entrata",
  "yardi",
  "realpage",
  "buildium",
  "appfolio",
  "rentmanager",
  "email",
] as const;

// ---------------------------------------------------------------------------
// PMS connections (per property)
// ---------------------------------------------------------------------------

export const getConnectionForProperty = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("pmsConnections")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();

    if (!connection) return null;

    // Never expose credential references to the client
    return {
      _id: connection._id,
      propertyId: connection.propertyId,
      provider: connection.provider,
      status: connection.status,
      fallbackEmail: connection.fallbackEmail,
    };
  },
});

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const connections = await ctx.db.query("pmsConnections").collect();

    // Join in property names for the admin UI
    return await Promise.all(
      connections.map(async (c) => {
        const property = await ctx.db
          .query("multifamilyproperties")
          .withIndex("by_propertyId", (q) => q.eq("propertyId", c.propertyId))
          .first();
        return {
          ...c,
          propertyName: property?.propertyName ?? "Unknown property",
          propertyCity: property?.city,
          propertyState: property?.state,
        };
      })
    );
  },
});

export const upsertConnection = mutation({
  args: {
    propertyId: v.string(),
    provider: v.string(),
    status: v.string(),
    externalPropertyId: v.optional(v.string()),
    externalSourceId: v.optional(v.string()),
    apiBaseUrl: v.optional(v.string()),
    credentialRef: v.optional(v.string()),
    fallbackEmail: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!SUPPORTED_PROVIDERS.includes(args.provider as any)) {
      throw new Error(`Unsupported PMS provider: ${args.provider}`);
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("pmsConnections")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("pmsConnections", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteConnection = mutation({
  args: { connectionId: v.id("pmsConnections") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.connectionId);
    return { success: true };
  },
});

/**
 * Full connection record including credentialRef — only for the server-side
 * API route (called with ConvexHttpClient after Clerk auth). Requires the
 * internal key so browsers can't read integration config.
 */
export const getConnectionForSubmission = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pmsConnections")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();
  },
});

// ---------------------------------------------------------------------------
// Application bundle — everything HomeU knows about the renter, in one query
// ---------------------------------------------------------------------------

export const getApplicationBundle = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const savedApplication = await ctx.db
      .query("savedApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const rentalHistory = await ctx.db
      .query("rentalHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const employmentHistory = await ctx.db
      .query("employmentHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return { renter, savedApplication, rentalHistory, employmentHistory };
  },
});

// ---------------------------------------------------------------------------
// Application submissions
// ---------------------------------------------------------------------------

export const recordSubmission = mutation({
  args: {
    userId: v.string(),
    propertyId: v.optional(v.string()),
    propertyName: v.string(),
    propertyAddress: v.optional(v.string()),
    pmCompanyName: v.optional(v.string()),
    channel: v.string(),
    provider: v.optional(v.string()),
    pmsConnectionId: v.optional(v.id("pmsConnections")),
    status: v.string(),
    externalApplicationId: v.optional(v.string()),
    payloadSnapshot: v.optional(v.any()),
    sectionsIncluded: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const submissionId = await ctx.db.insert("applicationSubmissions", {
      ...args,
      events: [
        {
          at: now,
          status: args.status,
          note:
            args.channel === "pms"
              ? `Submitted directly to ${args.provider ?? "PMS"}`
              : "Sent to property manager via email",
        },
      ],
      submittedAt: now,
      updatedAt: now,
    });

    if (args.pmsConnectionId) {
      await ctx.db.patch(args.pmsConnectionId, {
        lastSubmissionAt: now,
        lastSubmissionStatus: args.status,
        updatedAt: now,
      });
    }

    return submissionId;
  },
});

export const updateSubmissionStatus = mutation({
  args: {
    submissionId: v.id("applicationSubmissions"),
    status: v.string(),
    note: v.optional(v.string()),
    externalApplicationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      status: args.status,
      externalApplicationId:
        args.externalApplicationId ?? submission.externalApplicationId,
      events: [
        ...(submission.events ?? []),
        { at: now, status: args.status, note: args.note },
      ],
      updatedAt: now,
    });

    return { success: true };
  },
});

export const getMySubmissions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("applicationSubmissions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Newest first; strip the payload snapshot (can be large / sensitive)
    return submissions
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .map(({ payloadSnapshot: _payload, ...rest }) => rest);
  },
});
