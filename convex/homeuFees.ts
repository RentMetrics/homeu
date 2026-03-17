/**
 * Convex Functions for HomeU Fee Tracking & Revenue
 *
 * Tracks the $9.99 HomeU monthly platform fee:
 * - $4.99 → HomeU operations revenue
 * - $2.00 → Reward points funding (200 points for resident via Awardco)
 * - $3.00 → Credit bureau reporting (Experian, Equifax, TransUnion)
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Constants
export const HOMEU_PLATFORM_FEE = 9.99;
export const HOMEU_OPERATIONS_FEE = 4.99;
export const HOMEU_REWARDS_FUNDING = 2.00;
export const HOMEU_CREDIT_REPORTING_FEE = 3.00;
export const POINTS_PER_DOLLAR = 100;
export const POINTS_PER_PAYMENT = 200; // $2 × 100 points/dollar

// Legacy aliases for backward compatibility
export const HOMEU_CONVENIENCE_FEE = HOMEU_PLATFORM_FEE;
export const HOMEU_POINTS_CONVERSION = HOMEU_REWARDS_FUNDING;

// ========================================
// FEE COLLECTION
// ========================================

/**
 * Record fee collection from a completed payment
 */
export const recordFeeCollection = mutation({
  args: {
    rentPaymentId: v.id("rentPayments"),
    statementId: v.id("monthlyStatements"),
    renterId: v.string(),
    propertyManagerId: v.string(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already recorded
    const existing = await ctx.db
      .query("homeuRevenue")
      .withIndex("by_rentPaymentId", (q) =>
        q.eq("rentPaymentId", args.rentPaymentId)
      )
      .first();

    if (existing) {
      return { success: false, message: "Fee already recorded", revenueId: existing._id };
    }

    // Record the fee
    const revenueId = await ctx.db.insert("homeuRevenue", {
      rentPaymentId: args.rentPaymentId,
      statementId: args.statementId,
      renterId: args.renterId,
      propertyManagerId: args.propertyManagerId,
      totalFee: HOMEU_PLATFORM_FEE,
      operationsRevenue: HOMEU_OPERATIONS_FEE,
      rewardsFunding: HOMEU_REWARDS_FUNDING,
      creditReportingFee: HOMEU_CREDIT_REPORTING_FEE,
      pointsLiability: HOMEU_REWARDS_FUNDING,
      pointsIssued: POINTS_PER_PAYMENT,
      awardcoFunded: false,
      awardcoFundedAmount: 0,
      status: "collected",
      month: args.month,
      collectedAt: now,
      createdAt: now,
    });

    return {
      success: true,
      revenueId,
      feeBreakdown: {
        totalFee: HOMEU_PLATFORM_FEE,
        operationsRevenue: HOMEU_OPERATIONS_FEE,
        rewardsFunding: HOMEU_REWARDS_FUNDING,
        creditReportingFee: HOMEU_CREDIT_REPORTING_FEE,
        pointsIssued: POINTS_PER_PAYMENT,
      },
    };
  },
});

/**
 * Award fee points to renter ($1 = 100 points)
 */
export const awardFeePoints = mutation({
  args: {
    renterId: v.string(),
    revenueId: v.id("homeuRevenue"),
    rentPaymentId: v.id("rentPayments"),
  },
  handler: async (ctx, args) => {
    const revenue = await ctx.db.get(args.revenueId);
    if (!revenue) {
      return { success: false, message: "Revenue record not found" };
    }

    const now = Date.now();

    // Get or create user points
    let userPoints = await ctx.db
      .query("userPoints")
      .withIndex("by_userId", (q) => q.eq("userId", args.renterId))
      .first();

    if (!userPoints) {
      const id = await ctx.db.insert("userPoints", {
        userId: args.renterId,
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
          bankLinked: true,
          leaseUploaded: false,
          autoPayEnabled: false,
        },
        updatedAt: now,
      });
      userPoints = await ctx.db.get(id);
    }

    if (!userPoints) {
      return { success: false, message: "Failed to get user points" };
    }

    const pointsToAward = revenue.pointsIssued;
    const newBalance = userPoints.currentBalance + pointsToAward;
    const newTotalEarned = userPoints.totalEarned + pointsToAward;

    // Create point transaction
    const transactionId = await ctx.db.insert("pointTransactions", {
      userId: args.renterId,
      type: "earn",
      category: "rent",
      amount: pointsToAward,
      balance: newBalance,
      description: `Fee conversion: $${HOMEU_POINTS_CONVERSION} = ${pointsToAward} points`,
      metadata: {
        rentPaymentId: args.rentPaymentId.toString(),
        revenueId: args.revenueId.toString(),
      },
      awardcoSynced: false,
      status: "completed",
      expiresAt: now + (24 * 30 * 24 * 60 * 60 * 1000), // 24 months
      createdAt: now,
      updatedAt: now,
    });

    // Update user points
    await ctx.db.patch(userPoints._id, {
      currentBalance: newBalance,
      totalEarned: newTotalEarned,
      lastEarnedAt: now,
      updatedAt: now,
    });

    // Update revenue record
    await ctx.db.patch(args.revenueId, {
      pointsTransactionId: transactionId.toString(),
      status: "allocated",
    });

    return {
      success: true,
      pointsAwarded: pointsToAward,
      newBalance,
      transactionId,
    };
  },
});

/**
 * Update revenue status
 */
export const updateRevenueStatus = mutation({
  args: {
    revenueId: v.id("homeuRevenue"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.revenueId, {
      status: args.status,
    });

    return { success: true };
  },
});

// ========================================
// REVENUE QUERIES
// ========================================

/**
 * Get fee revenue statistics
 */
export const getFeeRevenueStats = query({
  args: {
    month: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let revenues;

    if (args.month) {
      revenues = await ctx.db
        .query("homeuRevenue")
        .withIndex("by_month", (q: any) => q.eq("month", args.month!))
        .collect();
    } else {
      revenues = await ctx.db.query("homeuRevenue").collect();

      // Filter by date range if provided
      if (args.startDate || args.endDate) {
        revenues = revenues.filter((r) => {
          if (args.startDate && r.collectedAt < args.startDate) return false;
          if (args.endDate && r.collectedAt > args.endDate) return false;
          return true;
        });
      }
    }

    // Calculate stats
    const totalFees = revenues.reduce((sum, r) => sum + r.totalFee, 0);
    const totalOperationsRevenue = revenues.reduce(
      (sum, r) => sum + r.operationsRevenue,
      0
    );
    const totalPointsLiability = revenues.reduce(
      (sum, r) => sum + r.pointsLiability,
      0
    );
    const totalPointsIssued = revenues.reduce((sum, r) => sum + r.pointsIssued, 0);

    // Group by status
    const byStatus = {
      pending: revenues.filter((r) => r.status === "pending").length,
      collected: revenues.filter((r) => r.status === "collected").length,
      allocated: revenues.filter((r) => r.status === "allocated").length,
      reported: revenues.filter((r) => r.status === "reported").length,
    };

    // Group by month
    const byMonth: Record<string, {
      count: number;
      totalFees: number;
      operationsRevenue: number;
      pointsLiability: number;
    }> = {};

    for (const revenue of revenues) {
      if (!byMonth[revenue.month]) {
        byMonth[revenue.month] = {
          count: 0,
          totalFees: 0,
          operationsRevenue: 0,
          pointsLiability: 0,
        };
      }
      byMonth[revenue.month].count++;
      byMonth[revenue.month].totalFees += revenue.totalFee;
      byMonth[revenue.month].operationsRevenue += revenue.operationsRevenue;
      byMonth[revenue.month].pointsLiability += revenue.pointsLiability;
    }

    return {
      summary: {
        totalTransactions: revenues.length,
        totalFees,
        totalOperationsRevenue,
        totalPointsLiability,
        totalPointsIssued,
        averageFeePerTransaction: revenues.length > 0 ? totalFees / revenues.length : 0,
      },
      byStatus,
      byMonth: Object.entries(byMonth)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => b.month.localeCompare(a.month)),
    };
  },
});

/**
 * Get revenue for a specific property manager
 */
export const getPropertyManagerRevenue = query({
  args: {
    propertyManagerId: v.string(),
    month: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let revenues = await ctx.db
      .query("homeuRevenue")
      .withIndex("by_propertyManagerId", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId)
      )
      .collect();

    if (args.month) {
      revenues = revenues.filter((r) => r.month === args.month);
    }

    const totalPayments = revenues.length;
    const totalFees = revenues.reduce((sum, r) => sum + r.totalFee, 0);

    return {
      propertyManagerId: args.propertyManagerId,
      totalPayments,
      totalFeesCollected: totalFees,
      month: args.month || "all",
    };
  },
});

/**
 * Get monthly fee breakdown
 */
export const getMonthlyFeeBreakdown = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const revenues = await ctx.db.query("homeuRevenue").collect();

    // Group by month
    const monthlyData: Record<string, {
      month: string;
      transactions: number;
      totalFees: number;
      operationsRevenue: number;
      pointsLiability: number;
      pointsIssued: number;
    }> = {};

    for (const revenue of revenues) {
      if (!monthlyData[revenue.month]) {
        monthlyData[revenue.month] = {
          month: revenue.month,
          transactions: 0,
          totalFees: 0,
          operationsRevenue: 0,
          pointsLiability: 0,
          pointsIssued: 0,
        };
      }

      monthlyData[revenue.month].transactions++;
      monthlyData[revenue.month].totalFees += revenue.totalFee;
      monthlyData[revenue.month].operationsRevenue += revenue.operationsRevenue;
      monthlyData[revenue.month].pointsLiability += revenue.pointsLiability;
      monthlyData[revenue.month].pointsIssued += revenue.pointsIssued;
    }

    // Convert to array and sort
    const result = Object.values(monthlyData)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, args.limit || 12);

    return result;
  },
});

/**
 * Get fee transparency info for UI
 */
export const getFeeTransparencyInfo = query({
  args: {},
  handler: async () => {
    return {
      platformFee: {
        amount: HOMEU_PLATFORM_FEE,
        description: "HomeU Platform Fee",
      },
      breakdown: {
        operationsFee: {
          amount: HOMEU_OPERATIONS_FEE,
          percentage: Math.round((HOMEU_OPERATIONS_FEE / HOMEU_PLATFORM_FEE) * 100),
          description: "Platform operations & payment processing",
        },
        rewardsFunding: {
          amount: HOMEU_REWARDS_FUNDING,
          percentage: Math.round((HOMEU_REWARDS_FUNDING / HOMEU_PLATFORM_FEE) * 100),
          description: "Funds your reward account",
          pointsValue: POINTS_PER_PAYMENT,
        },
        creditReporting: {
          amount: HOMEU_CREDIT_REPORTING_FEE,
          percentage: Math.round((HOMEU_CREDIT_REPORTING_FEE / HOMEU_PLATFORM_FEE) * 100),
          description: "Rent reported to all 3 credit bureaus",
        },
      },
      benefits: [
        {
          icon: "TrendingUp",
          title: "Credit Bureau Reporting",
          description: "Every rent payment reported to Experian, Equifax & TransUnion",
        },
        {
          icon: "Gift",
          title: "200 Reward Points",
          description: "$2 of your fee funds 200 redeemable reward points",
        },
        {
          icon: "Shield",
          title: "Secure Payments",
          description: "Bank-level encryption and fraud protection",
        },
        {
          icon: "Clock",
          title: "On-Time Tracking",
          description: "Build your payment history and earn streak bonuses",
        },
      ],
      valueProposition:
        "For $9.99/mo, every rent payment is reported to all 3 credit bureaus, you earn 200 reward points ($2 value) redeemable for gift cards and more, and get secure payment processing with fraud protection.",
    };
  },
});

// ========================================
// ADMIN OPERATIONS
// ========================================

/**
 * Get revenue audit trail
 */
export const getRevenueAuditTrail = query({
  args: {
    rentPaymentId: v.optional(v.id("rentPayments")),
    renterId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.rentPaymentId) {
      const revenue = await ctx.db
        .query("homeuRevenue")
        .withIndex("by_rentPaymentId", (q: any) =>
          q.eq("rentPaymentId", args.rentPaymentId!)
        )
        .first();
      return revenue ? [revenue] : [];
    }

    let revenues = await ctx.db
      .query("homeuRevenue")
      .order("desc")
      .take(args.limit || 100);

    if (args.renterId) {
      revenues = revenues.filter((r) => r.renterId === args.renterId);
    }

    return revenues;
  },
});

/**
 * Calculate projected monthly revenue
 */
export const getProjectedRevenue = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    // Get all active statements for the month
    const statements = await ctx.db
      .query("monthlyStatements")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .collect();

    const pendingStatements = statements.filter(
      (s) => s.status !== "paid" && s.status !== "draft"
    );
    const paidStatements = statements.filter((s) => s.status === "paid");

    const projectedFees =
      pendingStatements.length * HOMEU_CONVENIENCE_FEE;
    const collectedFees = paidStatements.length * HOMEU_CONVENIENCE_FEE;
    const totalPotential = statements.length * HOMEU_CONVENIENCE_FEE;

    return {
      month: args.month,
      totalStatements: statements.length,
      paidStatements: paidStatements.length,
      pendingStatements: pendingStatements.length,
      collectedFees,
      projectedFees,
      totalPotential,
      collectionRate:
        statements.length > 0
          ? Math.round((paidStatements.length / statements.length) * 100)
          : 0,
      breakdown: {
        operations: {
          collected: paidStatements.length * HOMEU_OPERATIONS_FEE,
          projected: pendingStatements.length * HOMEU_OPERATIONS_FEE,
          total: statements.length * HOMEU_OPERATIONS_FEE,
        },
        pointsLiability: {
          issued: paidStatements.length * HOMEU_POINTS_CONVERSION,
          pending: pendingStatements.length * HOMEU_POINTS_CONVERSION,
          total: statements.length * HOMEU_POINTS_CONVERSION,
        },
      },
    };
  },
});

/**
 * Get points liability summary
 */
export const getPointsLiabilitySummary = query({
  args: {},
  handler: async (ctx) => {
    // Get all user points
    const allUserPoints = await ctx.db.query("userPoints").collect();

    const totalPointsInCirculation = allUserPoints.reduce(
      (sum, u) => sum + u.currentBalance,
      0
    );
    const totalPointsIssued = allUserPoints.reduce(
      (sum, u) => sum + u.totalEarned,
      0
    );
    const totalPointsRedeemed = allUserPoints.reduce(
      (sum, u) => sum + u.totalRedeemed,
      0
    );

    // Calculate dollar value (100 points = $1)
    const dollarValueInCirculation = totalPointsInCirculation / POINTS_PER_DOLLAR;

    return {
      totalPointsInCirculation,
      totalPointsIssued,
      totalPointsRedeemed,
      dollarValueInCirculation,
      totalDollarLiability: totalPointsIssued / POINTS_PER_DOLLAR,
      redemptionRate:
        totalPointsIssued > 0
          ? Math.round((totalPointsRedeemed / totalPointsIssued) * 100)
          : 0,
    };
  },
});
