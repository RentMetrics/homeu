/**
 * Convex Functions for HomeU Reward Points System
 *
 * This module handles all point-related operations including:
 * - Earning points from various activities
 * - Tracking user balances
 * - Managing payment streaks
 * - Referral tracking
 * - Point redemption
 * - Admin operations
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ========================================
// CONSTANTS
// ========================================

export const POINT_VALUES = {
  // Onboarding
  ACCOUNT_CREATION: 50,
  PROFILE_COMPLETION: 100,
  IDENTITY_VERIFICATION: 150,
  BANK_ACCOUNT_LINK: 100,
  LEASE_UPLOAD: 50,
  EMPLOYMENT_VERIFICATION: 100, // Argyle employment verification

  // Rent Payments
  ON_TIME_PAYMENT: 100,
  AUTO_PAY_BONUS: 25,
  EARLY_PAYMENT_BONUS: 25,

  // Streaks
  STREAK_3_MONTHS: 50,
  STREAK_6_MONTHS: 150,
  STREAK_12_MONTHS: 300,
  STREAK_24_MONTHS: 600,

  // Referrals
  REFERRAL_SIGNUP: 100,
  REFERRAL_VERIFICATION: 150,
  REFERRAL_FIRST_PAYMENT: 250,

  // Engagement
  PROPERTY_REVIEW: 50,
  MAINTENANCE_REPORT: 25,
  COMMUNITY_SURVEY: 30,
  SATISFACTION_SURVEY: 40,
  APP_REVIEW: 100,

  // Milestones
  ONE_YEAR_TENANT: 500,
  TWO_YEAR_TENANT: 1000,
  THREE_YEAR_TENANT: 2000,
  LEASE_RENEWAL: 300,
  PERFECT_PAYMENT_YEAR: 500,
};

export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 3000,
  PLATINUM: 7000,
};

// ========================================
// USER POINTS QUERIES
// ========================================

/**
 * Get user's current point balance and stats
 */
export const getUserPoints = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const userPoints = await ctx.db
      .query("userPoints")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userPoints) {
      return {
        userId: args.userId,
        currentBalance: 0,
        totalEarned: 0,
        totalRedeemed: 0,
        tier: "bronze",
        streakCount: 0,
        referralCount: 0,
      };
    }

    return userPoints;
  },
});

/**
 * Get user's point transaction history
 */
export const getPointTransactions = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const transactions = await ctx.db
      .query("pointTransactions")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit + offset);

    return transactions.slice(offset, offset + limit);
  },
});

/**
 * Get points expiring soon (within 90 days)
 */
export const getExpiringPoints = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const ninetyDaysFromNow = Date.now() + (90 * 24 * 60 * 60 * 1000);

    const expiringTransactions = await ctx.db
      .query("pointTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "earn"),
          q.neq(q.field("status"), "expired"),
          q.lt(q.field("expiresAt"), ninetyDaysFromNow)
        )
      )
      .collect();

    const totalExpiring = expiringTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    return {
      totalExpiring,
      transactions: expiringTransactions,
    };
  },
});

// ========================================
// EARNING POINTS MUTATIONS
// ========================================

/**
 * Award points for account creation
 */
export const awardSignupPoints = mutation({
  args: { userId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    // Check if already awarded
    const existing = await ctx.db
      .query("pointTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("category"), "signup"))
      .first();

    if (existing) {
      return { success: false, message: "Signup points already awarded" };
    }

    return await awardPointsInternal(ctx, {
      userId: args.userId,
      points: POINT_VALUES.ACCOUNT_CREATION,
      category: "signup",
      description: "Welcome to HomeU! Account creation bonus",
    });
  },
});

/**
 * Award points for profile completion
 */
export const awardProfileCompletionPoints = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await awardPointsInternal(ctx, {
      userId: args.userId,
      points: POINT_VALUES.PROFILE_COMPLETION,
      category: "signup",
      description: "Profile completed!",
    });
  },
});

/**
 * Award points for identity verification
 */
export const awardVerificationPoints = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await awardPointsInternal(ctx, {
      userId: args.userId,
      points: POINT_VALUES.IDENTITY_VERIFICATION,
      category: "signup",
      description: "Identity verified successfully",
    });
  },
});

/**
 * Award points for linking bank account
 */
export const awardBankLinkPoints = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await awardPointsInternal(ctx, {
      userId: args.userId,
      points: POINT_VALUES.BANK_ACCOUNT_LINK,
      category: "signup",
      description: "Bank account linked",
    });
  },
});

/**
 * Award points for rent payment
 */
export const awardRentPaymentPoints = mutation({
  args: {
    userId: v.string(),
    paymentId: v.string(),
    isOnTime: v.boolean(),
    isEarly: v.optional(v.boolean()),
    hasAutoPay: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let totalPoints = 0;
    const descriptions: string[] = [];

    // Base payment points
    if (args.isOnTime) {
      totalPoints += POINT_VALUES.ON_TIME_PAYMENT;
      descriptions.push("On-time rent payment");
    }

    // Early payment bonus
    if (args.isEarly) {
      totalPoints += POINT_VALUES.EARLY_PAYMENT_BONUS;
      descriptions.push("Early payment bonus");
    }

    // Auto-pay bonus
    if (args.hasAutoPay) {
      totalPoints += POINT_VALUES.AUTO_PAY_BONUS;
      descriptions.push("Auto-pay enabled");
    }

    // Award points
    const result = await awardPointsInternal(ctx, {
      userId: args.userId,
      points: totalPoints,
      category: "rent",
      description: descriptions.join(" + "),
      metadata: { rentPaymentId: args.paymentId },
    });

    // Update payment streak
    if (args.isOnTime) {
      await updatePaymentStreak(ctx, args.userId);
    }

    return result;
  },
});

/**
 * Award points for referral milestone
 */
export const awardReferralPoints = mutation({
  args: {
    referrerId: v.string(),
    referredUserId: v.string(),
    milestone: v.union(
      v.literal("signup"),
      v.literal("verification"),
      v.literal("firstPayment")
    ),
  },
  handler: async (ctx, args) => {
    const points = {
      signup: POINT_VALUES.REFERRAL_SIGNUP,
      verification: POINT_VALUES.REFERRAL_VERIFICATION,
      firstPayment: POINT_VALUES.REFERRAL_FIRST_PAYMENT,
    }[args.milestone];

    return await awardPointsInternal(ctx, {
      userId: args.referrerId,
      points,
      category: "referral",
      description: `Referral ${args.milestone} milestone reached`,
      metadata: { referralUserId: args.referredUserId },
    });
  },
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Core function to award points to a user
 */
async function awardPointsInternal(
  ctx: any,
  params: {
    userId: string;
    points: number;
    category: string;
    description: string;
    metadata?: any;
  }
) {
  const { userId, points, category, description, metadata } = params;

  // Get or create user points record
  let userPoints = await ctx.db
    .query("userPoints")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!userPoints) {
    // Create new user points record
    userPoints = await ctx.db.insert("userPoints", {
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

    userPoints = await ctx.db.get(userPoints);
  }

  // Calculate new balance
  const newBalance = userPoints.currentBalance + points;
  const newTotalEarned = userPoints.totalEarned + points;

  // Determine tier
  const tier = getTier(newTotalEarned);

  // Calculate expiration (24 months for rent payments, no expiration for others)
  const expiresAt = category === "rent"
    ? Date.now() + (24 * 30 * 24 * 60 * 60 * 1000)
    : undefined;

  // Create transaction record
  await ctx.db.insert("pointTransactions", {
    userId,
    type: "earn",
    category,
    amount: points,
    balance: newBalance,
    description,
    metadata,
    awardcoSynced: false,
    status: "completed",
    expiresAt,
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
    points,
    newBalance,
    tier,
  };
}

/**
 * Update payment streak and award streak bonuses
 */
async function updatePaymentStreak(ctx: any, userId: string) {
  let streak = await ctx.db
    .query("paymentStreaks")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  const now = Date.now();
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

  if (!streak) {
    // Create new streak
    await ctx.db.insert("paymentStreaks", {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastPaymentDate: now,
      streakStartDate: now,
      missedPayments: 0,
      streakBonuses: [],
      updatedAt: now,
    });
    return;
  }

  // Check if payment is within valid timeframe (not too late)
  const isConsecutive = streak.lastPaymentDate > oneMonthAgo;

  if (isConsecutive) {
    const newStreak = streak.currentStreak + 1;
    const newLongestStreak = Math.max(newStreak, streak.longestStreak);

    // Check for streak bonuses
    const bonuses = [
      { months: 3, points: POINT_VALUES.STREAK_3_MONTHS },
      { months: 6, points: POINT_VALUES.STREAK_6_MONTHS },
      { months: 12, points: POINT_VALUES.STREAK_12_MONTHS },
      { months: 24, points: POINT_VALUES.STREAK_24_MONTHS },
    ];

    for (const bonus of bonuses) {
      if (newStreak === bonus.months) {
        // Award streak bonus
        await awardPointsInternal(ctx, {
          userId,
          points: bonus.points,
          category: "milestone",
          description: `${bonus.months}-month payment streak bonus!`,
          metadata: { streakMonths: bonus.months },
        });

        // Record bonus
        streak.streakBonuses.push({
          months: bonus.months,
          points: bonus.points,
          awardedAt: now,
        });
      }
    }

    // Update streak
    await ctx.db.patch(streak._id, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastPaymentDate: now,
      streakBonuses: streak.streakBonuses,
      updatedAt: now,
    });
  } else {
    // Streak broken, reset
    await ctx.db.patch(streak._id, {
      currentStreak: 1,
      lastPaymentDate: now,
      streakStartDate: now,
      missedPayments: streak.missedPayments + 1,
      updatedAt: now,
    });
  }
}

/**
 * Determine user tier based on total points earned
 */
function getTier(totalPoints: number): string {
  if (totalPoints >= TIER_THRESHOLDS.PLATINUM) return "platinum";
  if (totalPoints >= TIER_THRESHOLDS.GOLD) return "gold";
  if (totalPoints >= TIER_THRESHOLDS.SILVER) return "silver";
  return "bronze";
}

// ========================================
// REDEMPTION
// ========================================

/**
 * Redeem points (deduct from balance)
 */
export const redeemPoints = mutation({
  args: {
    userId: v.string(),
    points: v.number(),
    description: v.string(),
    awardcoRedemptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userPoints = await ctx.db
      .query("userPoints")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!userPoints) {
      return { success: false, message: "User points not found" };
    }

    if (userPoints.currentBalance < args.points) {
      return { success: false, message: "Insufficient points" };
    }

    const newBalance = userPoints.currentBalance - args.points;
    const newTotalRedeemed = userPoints.totalRedeemed + args.points;

    // Create transaction
    await ctx.db.insert("pointTransactions", {
      userId: args.userId,
      type: "redeem",
      category: "redemption",
      amount: -args.points,
      balance: newBalance,
      description: args.description,
      metadata: { redemptionId: args.awardcoRedemptionId },
      awardcoSynced: true,
      status: "completed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user points
    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      totalRedeemed: newTotalRedeemed,
      lastRedeemedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newBalance,
      pointsRedeemed: args.points,
    };
  },
});

// ========================================
// ADMIN QUERIES
// ========================================

/**
 * Get point statistics for admin dashboard
 */
export const getPointStatistics = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("userPoints").collect();

    const stats = {
      totalUsers: allUsers.length,
      totalPointsEarned: allUsers.reduce((sum, u) => sum + u.totalEarned, 0),
      totalPointsRedeemed: allUsers.reduce((sum, u) => sum + u.totalRedeemed, 0),
      totalPointsInCirculation: allUsers.reduce((sum, u) => sum + u.currentBalance, 0),
      averagePointsPerUser: allUsers.length > 0
        ? allUsers.reduce((sum, u) => sum + u.currentBalance, 0) / allUsers.length
        : 0,
      tierDistribution: {
        bronze: allUsers.filter(u => u.tier === "bronze").length,
        silver: allUsers.filter(u => u.tier === "silver").length,
        gold: allUsers.filter(u => u.tier === "gold").length,
        platinum: allUsers.filter(u => u.tier === "platinum").length,
      },
    };

    return stats;
  },
});

/**
 * Get top earners for leaderboard
 */
export const getTopEarners = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const topUsers = await ctx.db
      .query("userPoints")
      .withIndex("by_currentBalance")
      .order("desc")
      .take(limit);

    return topUsers;
  },
});

/**
 * Generic point award (used by payment webhooks). `source` maps to the
 * transaction category; amount is the number of points.
 */
export const awardPoints = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    type: v.optional(v.string()),
    source: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await awardPointsInternal(ctx, {
      userId: args.userId,
      points: args.amount,
      category: args.source,
      description: args.description,
      metadata: args.metadata,
    });
  },
});
