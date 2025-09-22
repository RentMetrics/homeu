import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user rewards points
export const getUserPoints = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      return { points: 0, totalEarned: 0 };
    }

    // For now, calculate points based on profile completeness and activities
    // This could be expanded to track actual reward-earning activities
    const basePoints = 100; // Welcome bonus
    const profileBonus = user.verified ? 200 : 0;
    const completionBonus = (user.firstName && user.lastName && user.email && user.phoneNumber) ? 100 : 0;

    const totalPoints = basePoints + profileBonus + completionBonus;

    return {
      points: totalPoints,
      totalEarned: totalPoints,
      breakdown: {
        welcome: basePoints,
        verification: profileBonus,
        profileCompletion: completionBonus,
      }
    };
  },
});

// Claim a reward
export const claimReward = mutation({
  args: {
    userId: v.string(),
    rewardId: v.string(),
    pointsCost: v.number(),
    rewardTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // For now, we'll just return success
    // In a real app, you'd track claimed rewards and deduct points
    return {
      success: true,
      message: `Successfully claimed: ${args.rewardTitle}`,
      remainingPoints: 0, // Would calculate actual remaining points
    };
  },
});

// Get available rewards
export const getAvailableRewards = query({
  handler: async (ctx) => {
    return [
      {
        id: "rent_discount_5",
        title: "5% Rent Discount",
        description: "Get 5% off your next rent payment",
        points: 500,
        category: "rent",
        icon: "percent",
        available: true,
      },
      {
        id: "rent_discount_10",
        title: "10% Rent Discount",
        description: "Get 10% off your next rent payment",
        points: 1000,
        category: "rent",
        icon: "percent",
        available: true,
      },
      {
        id: "gift_card_25",
        title: "$25 Gift Card",
        description: "Amazon or Target gift card",
        points: 750,
        category: "gift_card",
        icon: "gift",
        available: true,
      },
      {
        id: "premium_month",
        title: "Premium Features (1 Month)",
        description: "Unlock premium HomeU features for 30 days",
        points: 300,
        category: "premium",
        icon: "star",
        available: true,
      },
      {
        id: "credit_boost",
        title: "Credit Monitoring Service",
        description: "3 months of credit monitoring",
        points: 600,
        category: "credit",
        icon: "shield",
        available: true,
      },
    ];
  },
});

// Get user's claimed rewards history
export const getClaimedRewards = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // For now, return empty array
    // In a real app, you'd have a separate table to track claimed rewards
    return [];
  },
});