/**
 * Convex Functions for Argyle Employment Verification
 *
 * This module handles all Argyle-related operations including:
 * - Storing Argyle user IDs
 * - Updating verified employment data
 * - Managing employment history records
 * - Awarding points for employment verification
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { POINT_VALUES } from "./points";

// ========================================
// QUERIES
// ========================================

/**
 * Get user's Argyle connection status
 */
export const getArgyleStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return {
        hasArgyleConnection: false,
        argyleUserId: null,
        employmentVerified: false,
        verifiedEmployer: null,
        verifiedPosition: null,
        verifiedIncome: null,
        verifiedPayFrequency: null,
        employmentVerificationDate: null,
      };
    }

    return {
      hasArgyleConnection: !!renter.argyleUserId,
      argyleUserId: renter.argyleUserId || null,
      employmentVerified: renter.employmentVerified || false,
      verifiedEmployer: renter.verifiedEmployer || null,
      verifiedPosition: renter.verifiedPosition || null,
      verifiedIncome: renter.verifiedIncome || null,
      verifiedPayFrequency: renter.verifiedPayFrequency || null,
      employmentVerificationDate: renter.employmentVerificationDate || null,
    };
  },
});

/**
 * Get user's employment history from Argyle
 */
export const getEmploymentHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("employmentHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by start date (most recent first)
    return history.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  },
});

/**
 * Get a renter by their Argyle user ID
 */
export const getRenterByArgyleUserId = query({
  args: { argyleUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("renters")
      .withIndex("by_argyleUserId", (q) => q.eq("argyleUserId", args.argyleUserId))
      .first();
  },
});

// ========================================
// MUTATIONS
// ========================================

/**
 * Store Argyle user ID on renter profile
 * Called after creating an Argyle user
 */
export const updateArgyleUserId = mutation({
  args: {
    userId: v.string(),
    argyleUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return { success: false, error: "Renter profile not found" };
    }

    await ctx.db.patch(renter._id, {
      argyleUserId: args.argyleUserId,
    });

    return { success: true };
  },
});

/**
 * Update renter profile with verified employment data
 * Called after successfully connecting a payroll account
 */
export const updateVerifiedEmployment = mutation({
  args: {
    userId: v.string(),
    argyleAccountId: v.string(),
    employerName: v.string(),
    position: v.string(),
    income: v.optional(v.number()),
    payFrequency: v.optional(v.string()),
    employmentStartDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return { success: false, error: "Renter profile not found" };
    }

    const now = Date.now();

    // Check if this is the first time verifying employment
    const isFirstVerification = !renter.employmentVerified;

    // Update renter profile with verified employment data
    await ctx.db.patch(renter._id, {
      argyleAccountId: args.argyleAccountId,
      employmentVerified: true,
      employmentVerificationDate: now,
      verifiedEmployer: args.employerName,
      verifiedPosition: args.position,
      verifiedIncome: args.income,
      verifiedPayFrequency: args.payFrequency,
      verifiedEmploymentStartDate: args.employmentStartDate,
      incomeVerificationMethod: "argyle",
      lastIncomeSync: now,
      // Also update the self-reported fields for consistency
      employer: args.employerName,
      position: args.position,
      income: args.income ?? renter.income,
    });

    // Award points for first-time employment verification
    let pointsAwarded = 0;
    if (isFirstVerification) {
      const result = await awardEmploymentVerificationPointsInternal(ctx, args.userId);
      if (result.success) {
        pointsAwarded = result.points || 0;
      }
    }

    return {
      success: true,
      isFirstVerification,
      pointsAwarded,
    };
  },
});

/**
 * Upsert employment history record
 */
export const upsertEmploymentHistory = mutation({
  args: {
    userId: v.string(),
    argyleUserId: v.string(),
    argyleEmploymentId: v.string(),
    employerName: v.string(),
    jobTitle: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    isCurrent: v.boolean(),
    basePay: v.optional(v.number()),
    payFrequency: v.optional(v.string()),
    employerCity: v.optional(v.string()),
    employerState: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if record already exists
    const existing = await ctx.db
      .query("employmentHistory")
      .withIndex("by_argyleEmploymentId", (q) =>
        q.eq("argyleEmploymentId", args.argyleEmploymentId)
      )
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        employerName: args.employerName,
        jobTitle: args.jobTitle,
        startDate: args.startDate,
        endDate: args.endDate,
        isCurrent: args.isCurrent,
        basePay: args.basePay,
        payFrequency: args.payFrequency,
        employerCity: args.employerCity,
        employerState: args.employerState,
        verifiedAt: now,
        updatedAt: now,
      });

      return { success: true, isNew: false, id: existing._id };
    }

    // Create new record
    const id = await ctx.db.insert("employmentHistory", {
      userId: args.userId,
      argyleUserId: args.argyleUserId,
      argyleEmploymentId: args.argyleEmploymentId,
      employerName: args.employerName,
      jobTitle: args.jobTitle,
      startDate: args.startDate,
      endDate: args.endDate,
      isCurrent: args.isCurrent,
      basePay: args.basePay,
      payFrequency: args.payFrequency,
      employerCity: args.employerCity,
      employerState: args.employerState,
      dataSource: "argyle",
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, isNew: true, id };
  },
});

/**
 * Handle account removal (disconnect)
 * Clears verification status but keeps history
 */
export const handleAccountRemoved = mutation({
  args: {
    userId: v.string(),
    argyleAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return { success: false, error: "Renter profile not found" };
    }

    // Only clear if this is the account that was verified
    if (renter.argyleAccountId === args.argyleAccountId) {
      await ctx.db.patch(renter._id, {
        argyleAccountId: undefined,
        employmentVerified: false,
        // Keep the verified data for historical reference but mark as unverified
        // verifiedEmployer, verifiedPosition, etc. are kept
      });
    }

    return { success: true };
  },
});

/**
 * Update Argyle account ID after connection
 */
export const updateArgyleAccountId = mutation({
  args: {
    userId: v.string(),
    argyleAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return { success: false, error: "Renter profile not found" };
    }

    await ctx.db.patch(renter._id, {
      argyleAccountId: args.argyleAccountId,
    });

    return { success: true };
  },
});

// ========================================
// POINTS INTEGRATION
// ========================================

/**
 * Internal function to award employment verification points
 */
async function awardEmploymentVerificationPointsInternal(
  ctx: any,
  userId: string
): Promise<{ success: boolean; points?: number; message?: string }> {
  // Check if already awarded
  const existing = await ctx.db
    .query("pointTransactions")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .filter((q: any) =>
      q.and(
        q.eq(q.field("category"), "signup"),
        q.eq(q.field("description"), "Employment verified via Argyle")
      )
    )
    .first();

  if (existing) {
    return { success: false, message: "Employment verification points already awarded" };
  }

  // Get or create user points record
  let userPoints = await ctx.db
    .query("userPoints")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  const pointsAmount = POINT_VALUES.EMPLOYMENT_VERIFICATION || 100;

  if (!userPoints) {
    // Create new user points record
    const newUserPointsId = await ctx.db.insert("userPoints", {
      userId,
      totalEarned: 0,
      totalRedeemed: 0,
      currentBalance: 0,
      expiringPoints: 0,
      lastEarnedAt: Date.now(),
      streakCount: 0,
      longestStreak: 0,
      referralCount: 0,
      tier: "bronze",
      metadata: {
        onboardingComplete: false,
        verificationComplete: false,
        bankLinked: false,
        leaseUploaded: false,
        autoPayEnabled: false,
      },
      updatedAt: Date.now(),
    });

    userPoints = await ctx.db.get(newUserPointsId);
  }

  const newBalance = userPoints.currentBalance + pointsAmount;
  const newTotalEarned = userPoints.totalEarned + pointsAmount;

  // Determine tier
  const TIER_THRESHOLDS = {
    BRONZE: 0,
    SILVER: 1000,
    GOLD: 3000,
    PLATINUM: 7000,
  };

  let tier = "bronze";
  if (newTotalEarned >= TIER_THRESHOLDS.PLATINUM) tier = "platinum";
  else if (newTotalEarned >= TIER_THRESHOLDS.GOLD) tier = "gold";
  else if (newTotalEarned >= TIER_THRESHOLDS.SILVER) tier = "silver";

  // Create transaction record
  await ctx.db.insert("pointTransactions", {
    userId,
    type: "earn",
    category: "signup",
    amount: pointsAmount,
    balance: newBalance,
    description: "Employment verified via Argyle",
    metadata: {
      activityType: "employment_verification",
    },
    awardcoSynced: false,
    status: "completed",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Update user points
  await ctx.db.patch(userPoints._id, {
    totalEarned: newTotalEarned,
    currentBalance: newBalance,
    lastEarnedAt: Date.now(),
    tier,
    updatedAt: Date.now(),
  });

  return {
    success: true,
    points: pointsAmount,
  };
}

/**
 * Award employment verification points (callable mutation)
 */
export const awardEmploymentVerificationPoints = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await awardEmploymentVerificationPointsInternal(ctx, args.userId);
  },
});

/**
 * Sync latest income data from Argyle
 */
export const syncIncomeData = mutation({
  args: {
    userId: v.string(),
    income: v.number(),
    payFrequency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return { success: false, error: "Renter profile not found" };
    }

    await ctx.db.patch(renter._id, {
      verifiedIncome: args.income,
      income: args.income, // Update self-reported income too
      verifiedPayFrequency: args.payFrequency,
      lastIncomeSync: Date.now(),
    });

    return { success: true };
  },
});
