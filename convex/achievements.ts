/**
 * Convex Functions for HomeU Achievement System
 *
 * Handles achievement definitions, progress tracking, and unlocking.
 * Gamification layer for the HomeU rewards program.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ========================================
// ACHIEVEMENT DEFINITIONS
// ========================================

export const ACHIEVEMENT_DEFINITIONS = [
  // Onboarding Achievements
  {
    achievementId: "welcome_bonus",
    name: "Welcome to HomeU",
    description: "Create your HomeU account and start earning rewards",
    category: "onboarding",
    iconName: "Gift",
    badgeColor: "bg-blue-500",
    requirements: { type: "event", target: 1, metric: "signup" },
    pointsAwarded: 100,
    isHidden: false,
    displayOrder: 1,
  },
  {
    achievementId: "profile_complete",
    name: "Profile Pro",
    description: "Complete your renter profile with all details",
    category: "onboarding",
    iconName: "UserCheck",
    badgeColor: "bg-green-500",
    requirements: { type: "boolean", target: 1, metric: "profile_complete" },
    pointsAwarded: 100,
    isHidden: false,
    displayOrder: 2,
  },
  {
    achievementId: "verified",
    name: "Verified Resident",
    description: "Complete identity verification for enhanced security",
    category: "onboarding",
    iconName: "ShieldCheck",
    badgeColor: "bg-purple-500",
    requirements: { type: "boolean", target: 1, metric: "identity_verified" },
    pointsAwarded: 150,
    isHidden: false,
    displayOrder: 3,
  },
  {
    achievementId: "bank_linked",
    name: "Connected",
    description: "Link your bank account for seamless payments",
    category: "onboarding",
    iconName: "Link",
    badgeColor: "bg-cyan-500",
    requirements: { type: "boolean", target: 1, metric: "bank_linked" },
    pointsAwarded: 100,
    isHidden: false,
    displayOrder: 4,
  },

  // Payment Achievements
  {
    achievementId: "first_payment",
    name: "First Payment",
    description: "Make your first rent payment through HomeU",
    category: "payment",
    iconName: "Wallet",
    badgeColor: "bg-emerald-500",
    requirements: { type: "count", target: 1, metric: "payments" },
    pointsAwarded: 150,
    isHidden: false,
    displayOrder: 10,
  },
  {
    achievementId: "on_time_3",
    name: "Getting Started",
    description: "Make 3 consecutive on-time payments",
    category: "streak",
    iconName: "Clock",
    badgeColor: "bg-yellow-500",
    requirements: { type: "streak", target: 3, metric: "on_time_payments" },
    pointsAwarded: 100,
    isHidden: false,
    displayOrder: 11,
  },
  {
    achievementId: "on_time_6",
    name: "Perfect Payer",
    description: "Maintain a 6-month on-time payment streak",
    category: "streak",
    iconName: "Flame",
    badgeColor: "bg-orange-500",
    requirements: { type: "streak", target: 6, metric: "on_time_payments" },
    pointsAwarded: 300,
    isHidden: false,
    displayOrder: 12,
  },
  {
    achievementId: "on_time_12",
    name: "Super Streaker",
    description: "Achieve a 12-month on-time payment streak",
    category: "streak",
    iconName: "Award",
    badgeColor: "bg-red-500",
    requirements: { type: "streak", target: 12, metric: "on_time_payments" },
    pointsAwarded: 600,
    isHidden: false,
    displayOrder: 13,
  },
  {
    achievementId: "autopay_pro",
    name: "Auto-Pay Pro",
    description: "Use auto-pay for 6 consecutive months",
    category: "payment",
    iconName: "Repeat",
    badgeColor: "bg-indigo-500",
    requirements: { type: "count", target: 6, metric: "autopay_months" },
    pointsAwarded: 300,
    isHidden: false,
    displayOrder: 14,
  },
  {
    achievementId: "early_bird",
    name: "Early Bird",
    description: "Pay rent 5+ days early 3 times",
    category: "payment",
    iconName: "Sunrise",
    badgeColor: "bg-amber-500",
    requirements: { type: "count", target: 3, metric: "early_payments" },
    pointsAwarded: 150,
    isHidden: false,
    displayOrder: 15,
  },

  // Referral Achievements
  {
    achievementId: "referral_first",
    name: "Friend Finder",
    description: "Successfully refer your first friend to HomeU",
    category: "referral",
    iconName: "UserPlus",
    badgeColor: "bg-pink-500",
    requirements: { type: "count", target: 1, metric: "referrals" },
    pointsAwarded: 100,
    isHidden: false,
    displayOrder: 20,
  },
  {
    achievementId: "referral_5",
    name: "Referral Champion",
    description: "Refer 5 friends who sign up and make payments",
    category: "referral",
    iconName: "Users",
    badgeColor: "bg-rose-500",
    requirements: { type: "count", target: 5, metric: "referrals" },
    pointsAwarded: 500,
    isHidden: false,
    displayOrder: 21,
  },
  {
    achievementId: "referral_10",
    name: "HomeU Ambassador",
    description: "Become a top referrer with 10 successful referrals",
    category: "referral",
    iconName: "Crown",
    badgeColor: "bg-yellow-600",
    requirements: { type: "count", target: 10, metric: "referrals" },
    pointsAwarded: 1000,
    isHidden: true,
    displayOrder: 22,
  },

  // Milestone Achievements
  {
    achievementId: "one_year",
    name: "HomeU Veteran",
    description: "Be a HomeU member for 1 year",
    category: "milestone",
    iconName: "Calendar",
    badgeColor: "bg-teal-500",
    requirements: { type: "duration", target: 365, metric: "membership_days" },
    pointsAwarded: 500,
    isHidden: false,
    displayOrder: 30,
  },
  {
    achievementId: "two_years",
    name: "HomeU Loyalist",
    description: "Be a HomeU member for 2 years",
    category: "milestone",
    iconName: "Medal",
    badgeColor: "bg-violet-500",
    requirements: { type: "duration", target: 730, metric: "membership_days" },
    pointsAwarded: 1000,
    isHidden: false,
    displayOrder: 31,
  },
  {
    achievementId: "perfect_year",
    name: "Perfect Year",
    description: "12 consecutive on-time payments in a year",
    category: "milestone",
    iconName: "Trophy",
    badgeColor: "bg-yellow-500",
    requirements: { type: "count", target: 12, metric: "yearly_on_time" },
    pointsAwarded: 500,
    isHidden: false,
    displayOrder: 32,
  },
  {
    achievementId: "points_1000",
    name: "Point Collector",
    description: "Earn 1,000 reward points",
    category: "milestone",
    iconName: "Star",
    badgeColor: "bg-amber-400",
    requirements: { type: "count", target: 1000, metric: "total_points" },
    pointsAwarded: 50,
    isHidden: false,
    displayOrder: 33,
  },
  {
    achievementId: "points_5000",
    name: "Point Master",
    description: "Earn 5,000 reward points",
    category: "milestone",
    iconName: "Stars",
    badgeColor: "bg-amber-500",
    requirements: { type: "count", target: 5000, metric: "total_points" },
    pointsAwarded: 100,
    isHidden: false,
    displayOrder: 34,
  },

  // Engagement Achievements
  {
    achievementId: "first_review",
    name: "Voice Heard",
    description: "Leave your first property review",
    category: "engagement",
    iconName: "MessageSquare",
    badgeColor: "bg-sky-500",
    requirements: { type: "count", target: 1, metric: "reviews" },
    pointsAwarded: 50,
    isHidden: false,
    displayOrder: 40,
  },
  {
    achievementId: "lease_uploaded",
    name: "Documented",
    description: "Upload your lease for easy access",
    category: "engagement",
    iconName: "FileText",
    badgeColor: "bg-slate-500",
    requirements: { type: "boolean", target: 1, metric: "lease_uploaded" },
    pointsAwarded: 50,
    isHidden: false,
    displayOrder: 41,
  },
];

// ========================================
// SEED ACHIEVEMENTS
// ========================================

/**
 * Seed achievement definitions into the database
 */
export const seedAchievements = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0;
    let skipped = 0;

    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      // Check if already exists
      const existing = await ctx.db
        .query("achievementDefinitions")
        .withIndex("by_achievementId", (q) =>
          q.eq("achievementId", achievement.achievementId)
        )
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("achievementDefinitions", {
        ...achievement,
        isActive: true,
        createdAt: now,
      });
      created++;
    }

    return { created, skipped, total: ACHIEVEMENT_DEFINITIONS.length };
  },
});

// ========================================
// ACHIEVEMENT QUERIES
// ========================================

/**
 * Get all achievement definitions
 */
export const getAllAchievements = query({
  args: { includeHidden: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const achievements = await ctx.db
      .query("achievementDefinitions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    if (!args.includeHidden) {
      return achievements.filter((a) => !a.isHidden);
    }

    return achievements.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const achievements = await ctx.db
      .query("achievementDefinitions")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return achievements.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

/**
 * Get user's achievement progress
 */
export const getUserAchievementProgress = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get all achievements
    const allAchievements = await ctx.db
      .query("achievementDefinitions")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // Get user's progress
    const userProgress = await ctx.db
      .query("achievementProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Get user's unlocked achievements
    const unlockedAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievementId));
    const progressMap = new Map(userProgress.map((p) => [p.achievementId, p]));

    // Build combined view
    const achievements = allAchievements
      .filter((a) => !a.isHidden || unlockedIds.has(a.achievementId))
      .map((achievement) => {
        const progress = progressMap.get(achievement.achievementId);
        const isUnlocked = unlockedIds.has(achievement.achievementId);

        return {
          ...achievement,
          isUnlocked,
          currentValue: progress?.currentValue || 0,
          percentComplete: progress?.percentComplete || 0,
          status: isUnlocked ? "completed" : progress?.status || "locked",
          unlockedAt: isUnlocked
            ? unlockedAchievements.find((a) => a.achievementId === achievement.achievementId)?.unlockedAt
            : undefined,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);

    // Calculate summary
    const summary = {
      total: achievements.length,
      unlocked: achievements.filter((a) => a.isUnlocked).length,
      inProgress: achievements.filter((a) => a.status === "in_progress").length,
      locked: achievements.filter((a) => a.status === "locked").length,
      totalPointsFromAchievements: achievements
        .filter((a) => a.isUnlocked)
        .reduce((sum, a) => sum + a.pointsAwarded, 0),
    };

    return { achievements, summary };
  },
});

/**
 * Get recently unlocked achievements
 */
export const getRecentUnlocks = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const recentUnlocks = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 5);

    return recentUnlocks;
  },
});

// ========================================
// ACHIEVEMENT PROGRESS & UNLOCKING
// ========================================

/**
 * Update achievement progress
 */
export const updateAchievementProgress = mutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
    currentValue: v.number(),
  },
  handler: async (ctx, args) => {
    // Get achievement definition
    const definition = await ctx.db
      .query("achievementDefinitions")
      .withIndex("by_achievementId", (q) =>
        q.eq("achievementId", args.achievementId)
      )
      .first();

    if (!definition) {
      return { success: false, message: "Achievement not found" };
    }

    // Check if already unlocked
    const existingUnlock = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId_achievementId", (q) =>
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .first();

    if (existingUnlock) {
      return { success: true, alreadyUnlocked: true };
    }

    const targetValue = definition.requirements.target;
    const percentComplete = Math.min(
      100,
      Math.round((args.currentValue / targetValue) * 100)
    );
    const isComplete = args.currentValue >= targetValue;
    const now = Date.now();

    // Get or create progress record
    const existingProgress = await ctx.db
      .query("achievementProgress")
      .withIndex("by_userId_achievementId", (q) =>
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .first();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        currentValue: args.currentValue,
        percentComplete,
        status: isComplete ? "completed" : "in_progress",
        unlockedAt: isComplete ? now : undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("achievementProgress", {
        userId: args.userId,
        achievementId: args.achievementId,
        achievementDefinitionId: definition._id,
        currentValue: args.currentValue,
        targetValue,
        percentComplete,
        status: isComplete ? "completed" : "in_progress",
        unlockedAt: isComplete ? now : undefined,
        notified: false,
        celebrationShown: false,
        updatedAt: now,
      });
    }

    // If complete, unlock the achievement
    if (isComplete) {
      return await unlockAchievement(ctx, {
        userId: args.userId,
        achievementId: args.achievementId,
        definition,
      });
    }

    return { success: true, percentComplete, isComplete: false };
  },
});

/**
 * Unlock an achievement and award points
 */
async function unlockAchievement(
  ctx: any,
  params: {
    userId: string;
    achievementId: string;
    definition: any;
  }
) {
  const { userId, achievementId, definition } = params;
  const now = Date.now();

  // Check if already unlocked
  const existing = await ctx.db
    .query("userAchievements")
    .withIndex("by_userId_achievementId", (q: any) =>
      q.eq("userId", userId).eq("achievementId", achievementId)
    )
    .first();

  if (existing) {
    return { success: true, alreadyUnlocked: true };
  }

  // Create achievement record
  await ctx.db.insert("userAchievements", {
    userId,
    achievementId,
    name: definition.name,
    description: definition.description,
    iconUrl: definition.iconName,
    pointsAwarded: definition.pointsAwarded,
    unlockedAt: now,
    metadata: {
      category: definition.category,
      badgeColor: definition.badgeColor,
    },
  });

  // Award points
  let userPoints = await ctx.db
    .query("userPoints")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  if (!userPoints) {
    const id = await ctx.db.insert("userPoints", {
      userId,
      totalEarned: 0,
      totalRedeemed: 0,
      currentBalance: 0,
      expiringPoints: 0,
      lastEarnedAt: now,
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
      updatedAt: now,
    });
    userPoints = await ctx.db.get(id);
  }

  if (userPoints) {
    const newBalance = userPoints.currentBalance + definition.pointsAwarded;
    const newTotalEarned = userPoints.totalEarned + definition.pointsAwarded;

    // Determine tier
    let tier = "bronze";
    if (newTotalEarned >= 7000) tier = "platinum";
    else if (newTotalEarned >= 3000) tier = "gold";
    else if (newTotalEarned >= 1000) tier = "silver";

    // Create point transaction
    await ctx.db.insert("pointTransactions", {
      userId,
      type: "earn",
      category: "milestone",
      amount: definition.pointsAwarded,
      balance: newBalance,
      description: `Achievement unlocked: ${definition.name}`,
      metadata: { achievementId },
      awardcoSynced: false,
      status: "completed",
      createdAt: now,
      updatedAt: now,
    });

    // Update user points
    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      totalEarned: newTotalEarned,
      lastEarnedAt: now,
      tier,
      updatedAt: now,
    });
  }

  return {
    success: true,
    achievementUnlocked: true,
    name: definition.name,
    pointsAwarded: definition.pointsAwarded,
  };
}

/**
 * Mutation wrapper for unlocking achievement
 */
export const unlockAchievementMutation = mutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db
      .query("achievementDefinitions")
      .withIndex("by_achievementId", (q) =>
        q.eq("achievementId", args.achievementId)
      )
      .first();

    if (!definition) {
      return { success: false, message: "Achievement not found" };
    }

    return await unlockAchievement(ctx, {
      userId: args.userId,
      achievementId: args.achievementId,
      definition,
    });
  },
});

// ========================================
// ACHIEVEMENT CHECK TRIGGERS
// ========================================

/**
 * Check and award achievements after various events
 */
export const checkAndAwardAchievements = mutation({
  args: {
    userId: v.string(),
    eventType: v.string(), // 'payment', 'signup', 'verification', 'referral', etc.
    eventData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, eventType, eventData } = args;
    const awarded: string[] = [];

    // Get user data
    const userPoints = await ctx.db
      .query("userPoints")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const streak = await ctx.db
      .query("paymentStreaks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    // Check achievements based on event type
    switch (eventType) {
      case "signup":
        // Welcome bonus
        const welcomeResult = await ctx.db
          .query("userAchievements")
          .withIndex("by_userId_achievementId", (q) =>
            q.eq("userId", userId).eq("achievementId", "welcome_bonus")
          )
          .first();

        if (!welcomeResult) {
          const def = await ctx.db
            .query("achievementDefinitions")
            .withIndex("by_achievementId", (q) => q.eq("achievementId", "welcome_bonus"))
            .first();
          if (def) {
            await unlockAchievement(ctx, { userId, achievementId: "welcome_bonus", definition: def });
            awarded.push("welcome_bonus");
          }
        }
        break;

      case "payment":
        // First payment
        const payments = await ctx.db
          .query("rentPayments")
          .withIndex("by_renterId", (q) => q.eq("renterId", userId))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        if (payments.length === 1) {
          const def = await ctx.db
            .query("achievementDefinitions")
            .withIndex("by_achievementId", (q) => q.eq("achievementId", "first_payment"))
            .first();
          if (def) {
            await unlockAchievement(ctx, { userId, achievementId: "first_payment", definition: def });
            awarded.push("first_payment");
          }
        }

        // Streak achievements
        if (streak) {
          const streakAchievements = [
            { id: "on_time_3", target: 3 },
            { id: "on_time_6", target: 6 },
            { id: "on_time_12", target: 12 },
          ];

          for (const sa of streakAchievements) {
            if (streak.currentStreak >= sa.target) {
              const existing = await ctx.db
                .query("userAchievements")
                .withIndex("by_userId_achievementId", (q) =>
                  q.eq("userId", userId).eq("achievementId", sa.id)
                )
                .first();

              if (!existing) {
                const def = await ctx.db
                  .query("achievementDefinitions")
                  .withIndex("by_achievementId", (q) => q.eq("achievementId", sa.id))
                  .first();
                if (def) {
                  await unlockAchievement(ctx, { userId, achievementId: sa.id, definition: def });
                  awarded.push(sa.id);
                }
              }
            }
          }
        }

        // Early bird check
        if (eventData?.daysEarly >= 5) {
          const earlyPayments = await ctx.db
            .query("rentPayments")
            .withIndex("by_renterId", (q) => q.eq("renterId", userId))
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "completed"),
                q.gte(q.field("daysEarly"), 5)
              )
            )
            .collect();

          if (earlyPayments.length >= 3) {
            const existing = await ctx.db
              .query("userAchievements")
              .withIndex("by_userId_achievementId", (q) =>
                q.eq("userId", userId).eq("achievementId", "early_bird")
              )
              .first();

            if (!existing) {
              const def = await ctx.db
                .query("achievementDefinitions")
                .withIndex("by_achievementId", (q) => q.eq("achievementId", "early_bird"))
                .first();
              if (def) {
                await unlockAchievement(ctx, { userId, achievementId: "early_bird", definition: def });
                awarded.push("early_bird");
              }
            }
          }
        }
        break;

      case "verification":
        if (renter?.verified) {
          const existing = await ctx.db
            .query("userAchievements")
            .withIndex("by_userId_achievementId", (q) =>
              q.eq("userId", userId).eq("achievementId", "verified")
            )
            .first();

          if (!existing) {
            const def = await ctx.db
              .query("achievementDefinitions")
              .withIndex("by_achievementId", (q) => q.eq("achievementId", "verified"))
              .first();
            if (def) {
              await unlockAchievement(ctx, { userId, achievementId: "verified", definition: def });
              awarded.push("verified");
            }
          }
        }
        break;

      case "bank_linked":
        const existing = await ctx.db
          .query("userAchievements")
          .withIndex("by_userId_achievementId", (q) =>
            q.eq("userId", userId).eq("achievementId", "bank_linked")
          )
          .first();

        if (!existing) {
          const def = await ctx.db
            .query("achievementDefinitions")
            .withIndex("by_achievementId", (q) => q.eq("achievementId", "bank_linked"))
            .first();
          if (def) {
            await unlockAchievement(ctx, { userId, achievementId: "bank_linked", definition: def });
            awarded.push("bank_linked");
          }
        }
        break;

      case "referral":
        const referrals = await ctx.db
          .query("referrals")
          .withIndex("by_referrerId", (q) => q.eq("referrerId", userId))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        const referralAchievements = [
          { id: "referral_first", target: 1 },
          { id: "referral_5", target: 5 },
          { id: "referral_10", target: 10 },
        ];

        for (const ra of referralAchievements) {
          if (referrals.length >= ra.target) {
            const existing = await ctx.db
              .query("userAchievements")
              .withIndex("by_userId_achievementId", (q) =>
                q.eq("userId", userId).eq("achievementId", ra.id)
              )
              .first();

            if (!existing) {
              const def = await ctx.db
                .query("achievementDefinitions")
                .withIndex("by_achievementId", (q) => q.eq("achievementId", ra.id))
                .first();
              if (def) {
                await unlockAchievement(ctx, { userId, achievementId: ra.id, definition: def });
                awarded.push(ra.id);
              }
            }
          }
        }
        break;
    }

    // Check point milestones
    if (userPoints) {
      const pointAchievements = [
        { id: "points_1000", target: 1000 },
        { id: "points_5000", target: 5000 },
      ];

      for (const pa of pointAchievements) {
        if (userPoints.totalEarned >= pa.target) {
          const existing = await ctx.db
            .query("userAchievements")
            .withIndex("by_userId_achievementId", (q) =>
              q.eq("userId", userId).eq("achievementId", pa.id)
            )
            .first();

          if (!existing) {
            const def = await ctx.db
              .query("achievementDefinitions")
              .withIndex("by_achievementId", (q) => q.eq("achievementId", pa.id))
              .first();
            if (def) {
              await unlockAchievement(ctx, { userId, achievementId: pa.id, definition: def });
              awarded.push(pa.id);
            }
          }
        }
      }
    }

    return { success: true, achievementsAwarded: awarded };
  },
});

/**
 * Mark achievement celebration as shown
 */
export const markCelebrationShown = mutation({
  args: {
    userId: v.string(),
    achievementId: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("achievementProgress")
      .withIndex("by_userId_achievementId", (q) =>
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .first();

    if (progress) {
      await ctx.db.patch(progress._id, {
        celebrationShown: true,
        notified: true,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Get achievements that haven't shown celebration yet
 */
export const getPendingCelebrations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("achievementProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "completed"),
          q.eq(q.field("celebrationShown"), false)
        )
      )
      .collect();

    // Get full achievement details
    const achievements = await Promise.all(
      pending.map(async (p) => {
        const def = await ctx.db.get(p.achievementDefinitionId);
        return def ? { progress: p, definition: def } : null;
      })
    );

    return achievements.filter((a): a is NonNullable<typeof a> => a !== null);
  },
});
