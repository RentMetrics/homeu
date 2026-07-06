/**
 * Convex Functions for HomeU Rent Payments
 *
 * Handles rent payment processing with split routing:
 * - Rent amount → Property Manager's bank
 * - $9.99 fee → HomeU's bank:
 *   - $4.99 operations
 *   - $2.00 reward funding (200 points to resident via Awardco)
 *   - $3.00 credit bureau reporting
 */

import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Constants
export const HOMEU_PLATFORM_FEE = 9.99;
export const HOMEU_OPERATIONS_FEE = 4.99;
export const HOMEU_REWARDS_FUNDING = 2.00;
export const HOMEU_CREDIT_REPORTING_FEE = 3.00;
export const POINTS_PER_DOLLAR = 100;
export const POINTS_PER_PAYMENT = 200; // $2 × 100 points/dollar

// Legacy aliases
export const HOMEU_CONVENIENCE_FEE = HOMEU_PLATFORM_FEE;
export const HOMEU_POINTS_CONVERSION = HOMEU_REWARDS_FUNDING;

// HomeU's Straddle Business ID (would come from env in production)
const HOMEU_BUSINESS_ID = process.env.HOMEU_STRADDLE_BUSINESS_ID || 'homeu_business_id';

// ========================================
// PAYMENT INITIATION
// ========================================

/**
 * Initiate a rent payment with split routing
 */
export const initiateRentPayment = mutation({
  args: {
    renterId: v.string(),
    statementId: v.id("monthlyStatements"),
    paykey: v.string(), // Renter's payment method (bank account)
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the statement
    const statement = await ctx.db.get(args.statementId);
    if (!statement) {
      return { success: false, message: "Statement not found" };
    }

    if (statement.status === "paid") {
      return { success: false, message: "Statement already paid" };
    }

    // Get renter info
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.renterId))
      .first();

    if (!renter || !renter.straddleCustomerId) {
      return { success: false, message: "Renter not found or not verified" };
    }

    // Get routing info for auto-pay check
    const routing = await ctx.db
      .query("rentPaymentRouting")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .first();

    // Calculate timing metrics
    const now = Date.now();
    const dueDate = statement.dueDate;
    const daysEarly = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
    const isOnTime = now <= dueDate;
    const isAutoPay = routing?.autoPayEnabled || false;

    // Create the rent payment record
    const rentPaymentId = await ctx.db.insert("rentPayments", {
      renterId: args.renterId,
      statementId: args.statementId,
      propertyId: statement.propertyId,
      propertyManagerId: statement.propertyManagerId,

      totalAmount: statement.totalDue,
      rentAmount: statement.subtotal,
      homeuFee: HOMEU_CONVENIENCE_FEE,

      feeBreakdown: {
        operationsFee: HOMEU_OPERATIONS_FEE,
        rewardsFunding: HOMEU_REWARDS_FUNDING,
        creditReportingFee: HOMEU_CREDIT_REPORTING_FEE,
        pointsConversion: HOMEU_POINTS_CONVERSION,
        pointsAwarded: POINTS_PER_DOLLAR * HOMEU_POINTS_CONVERSION,
      },

      paymentMethod: args.paymentMethod || "ach",
      paykey: args.paykey,

      status: "pending",

      isOnTime,
      daysEarly,
      isAutoPay,

      pointsAwarded: false,
      totalPointsEarned: 0,

      initiatedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      rentPaymentId,
      totalAmount: statement.totalDue,
      rentAmount: statement.subtotal,
      homeuFee: HOMEU_CONVENIENCE_FEE,
      isOnTime,
      daysEarly,
    };
  },
});

/**
 * Update payment with Straddle IDs after split payment is created
 */
export const updatePaymentWithStraddleIds = mutation({
  args: {
    rentPaymentId: v.id("rentPayments"),
    straddlePaymentId: v.string(),
    straddleRentRouteId: v.optional(v.string()),
    straddleFeeRouteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rentPaymentId, {
      straddlePaymentId: args.straddlePaymentId,
      straddleRentRouteId: args.straddleRentRouteId,
      straddleFeeRouteId: args.straddleFeeRouteId,
      status: "processing",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ========================================
// PAYMENT COMPLETION
// ========================================

/**
 * Process payment completion (called from webhook)
 */
export const processPaymentCompletion = mutation({
  args: {
    rentPaymentId: v.id("rentPayments"),
    straddlePaymentId: v.string(),
    status: v.string(), // 'completed' or 'failed'
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.rentPaymentId);
    if (!payment) {
      return { success: false, message: "Payment not found" };
    }

    const now = Date.now();

    if (args.status === "failed") {
      await ctx.db.patch(args.rentPaymentId, {
        status: "failed",
        failureReason: args.failureReason,
        updatedAt: now,
      });
      return { success: true, pointsAwarded: 0 };
    }

    // Payment succeeded - calculate and award points
    let totalPoints = 0;

    // 1. Points from fee conversion: $1 = 100 points
    const feePoints = payment.feeBreakdown.pointsAwarded;
    totalPoints += feePoints;

    // 2. On-time payment bonus: 100 points
    if (payment.isOnTime) {
      totalPoints += 100;
    }

    // 3. Early payment bonus: 25 points if 5+ days early
    if ((payment.daysEarly ?? 0) >= 5) {
      totalPoints += 25;
    }

    // 4. Auto-pay bonus: 25 points
    if (payment.isAutoPay) {
      totalPoints += 25;
    }

    // Update payment record
    await ctx.db.patch(args.rentPaymentId, {
      status: "completed",
      completedAt: now,
      pointsAwarded: true,
      totalPointsEarned: totalPoints,
      updatedAt: now,
    });

    // Update statement
    const statement = payment.statementId
      ? await ctx.db.get(payment.statementId)
      : null;
    if (statement && payment.statementId) {
      const newAmountPaid = (statement.amountPaid ?? 0) + payment.totalAmount;
      const newPaymentIds = [...(statement.paymentIds ?? []), args.rentPaymentId.toString()];
      const newStatus = newAmountPaid >= statement.totalDue ? "paid" : "partial";

      await ctx.db.patch(payment.statementId, {
        amountPaid: newAmountPaid,
        paymentIds: newPaymentIds,
        status: newStatus,
        paidAt: newStatus === "paid" ? now : undefined,
        updatedAt: now,
      });
    }

    // Record HomeU revenue
    await ctx.db.insert("homeuRevenue", {
      rentPaymentId: args.rentPaymentId,
      statementId: payment.statementId,
      renterId: payment.renterId,
      propertyManagerId: payment.propertyManagerId,
      totalFee: HOMEU_CONVENIENCE_FEE,
      operationsRevenue: HOMEU_OPERATIONS_FEE,
      pointsLiability: HOMEU_POINTS_CONVERSION,
      pointsIssued: feePoints,
      status: "collected",
      month: statement?.month || new Date().toISOString().slice(0, 7),
      collectedAt: now,
      createdAt: now,
    });

    return {
      success: true,
      totalPointsEarned: totalPoints,
      breakdown: {
        feeConversion: feePoints,
        onTimeBonus: payment.isOnTime ? 100 : 0,
        earlyBonus: (payment.daysEarly ?? 0) >= 5 ? 25 : 0,
        autoPayBonus: payment.isAutoPay ? 25 : 0,
      },
    };
  },
});

/**
 * Award points after payment completion
 * Should be called after processPaymentCompletion
 */
export const awardPaymentPoints = mutation({
  args: {
    rentPaymentId: v.id("rentPayments"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.rentPaymentId);
    if (!payment || payment.status !== "completed" || payment.pointsAwarded) {
      return { success: false, message: "Payment not eligible for points" };
    }

    // Get or create user points record
    let userPoints = await ctx.db
      .query("userPoints")
      .withIndex("by_userId", (q) => q.eq("userId", payment.renterId))
      .first();

    const now = Date.now();

    if (!userPoints) {
      const id = await ctx.db.insert("userPoints", {
        userId: payment.renterId,
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
          autoPayEnabled: payment.isAutoPay,
        },
        updatedAt: now,
      });
      userPoints = await ctx.db.get(id);
    }

    if (!userPoints) {
      return { success: false, message: "Failed to create user points" };
    }

    // Award points
    const pointsEarned = payment.totalPointsEarned ?? 0;
    const newBalance = userPoints.currentBalance + pointsEarned;
    const newTotalEarned = userPoints.totalEarned + pointsEarned;

    // Determine tier
    let tier = "bronze";
    if (newTotalEarned >= 7000) tier = "platinum";
    else if (newTotalEarned >= 3000) tier = "gold";
    else if (newTotalEarned >= 1000) tier = "silver";

    // Create point transaction
    const transactionId = await ctx.db.insert("pointTransactions", {
      userId: payment.renterId,
      type: "earn",
      category: "rent",
      amount: pointsEarned,
      balance: newBalance,
      description: `Rent payment - ${payment.feeBreakdown.pointsAwarded} (fee) + ${payment.isOnTime ? "100 (on-time)" : "0"} + ${(payment.daysEarly ?? 0) >= 5 ? "25 (early)" : "0"} + ${payment.isAutoPay ? "25 (auto-pay)" : "0"}`,
      metadata: {
        rentPaymentId: args.rentPaymentId.toString(),
        earlyPaymentDays: payment.daysEarly && payment.daysEarly > 0 ? payment.daysEarly : undefined,
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
      tier,
      metadata: {
        ...userPoints.metadata,
        lastPaymentDate: now,
        autoPayEnabled: payment.isAutoPay,
      },
      updatedAt: now,
    });

    // Update payment with transaction ID
    await ctx.db.patch(args.rentPaymentId, {
      pointsTransactionId: transactionId.toString(),
      updatedAt: now,
    });

    // Update payment streak
    if (payment.isOnTime) {
      let streak = await ctx.db
        .query("paymentStreaks")
        .withIndex("by_userId", (q) => q.eq("userId", payment.renterId))
        .first();

      const oneMonthAgo = now - (35 * 24 * 60 * 60 * 1000); // 35 days grace period

      if (!streak) {
        await ctx.db.insert("paymentStreaks", {
          userId: payment.renterId,
          currentStreak: 1,
          longestStreak: 1,
          lastPaymentDate: now,
          streakStartDate: now,
          missedPayments: 0,
          streakBonuses: [],
          updatedAt: now,
        });
      } else {
        const isConsecutive = streak.lastPaymentDate > oneMonthAgo;
        const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
        const newLongest = Math.max(newStreak, streak.longestStreak);

        await ctx.db.patch(streak._id, {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastPaymentDate: now,
          streakStartDate: isConsecutive ? streak.streakStartDate : now,
          updatedAt: now,
        });
      }
    }

    return {
      success: true,
      pointsAwarded: payment.totalPointsEarned,
      newBalance,
      tier,
    };
  },
});

// ========================================
// PAYMENT QUERIES
// ========================================

/**
 * Get payment with full fee breakdown
 */
export const getPaymentWithFeeBreakdown = query({
  args: { rentPaymentId: v.id("rentPayments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.rentPaymentId);
    if (!payment) return null;

    const statement = payment.statementId
      ? await ctx.db.get(payment.statementId)
      : null;

    return {
      ...payment,
      statement,
      feeExplainer: {
        totalFee: HOMEU_CONVENIENCE_FEE,
        breakdown: {
          operationsFee: {
            amount: HOMEU_OPERATIONS_FEE,
            description: "Platform & processing fee",
          },
          pointsConversion: {
            amount: HOMEU_POINTS_CONVERSION,
            description: "Converted to reward points",
            pointsAwarded: POINTS_PER_DOLLAR * HOMEU_POINTS_CONVERSION,
          },
        },
        benefitsToYou: [
          "100 reward points ($1 value)",
          "Secure payment processing",
          "Payment tracking & history",
          "Rent reporting to credit bureaus",
        ],
      },
      pointsBreakdown: {
        feeConversion: payment.feeBreakdown.pointsAwarded,
        onTimeBonus: payment.isOnTime ? 100 : 0,
        earlyBonus: (payment.daysEarly ?? 0) >= 5 ? 25 : 0,
        autoPayBonus: payment.isAutoPay ? 25 : 0,
        total: payment.totalPointsEarned,
      },
    };
  },
});

/**
 * Get renter's payment history
 */
export const getRenterPayments = query({
  args: {
    renterId: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let payments = await ctx.db
      .query("rentPayments")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .order("desc")
      .take(args.limit || 50);

    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
    }

    return payments;
  },
});

/**
 * Get payments for a property manager
 */
export const getPropertyManagerPayments = query({
  args: {
    propertyManagerId: v.string(),
    month: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let payments = await ctx.db
      .query("rentPayments")
      .withIndex("by_propertyManagerId", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId)
      )
      .order("desc")
      .take(args.limit || 100);

    // Filter by status
    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
    }

    // Calculate stats
    const stats = {
      total: payments.length,
      completed: payments.filter((p) => p.status === "completed").length,
      pending: payments.filter((p) => p.status === "pending" || p.status === "processing").length,
      failed: payments.filter((p) => p.status === "failed").length,
      totalCollected: payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.rentAmount, 0),
      totalFees: payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.homeuFee, 0),
    };

    return { payments, stats };
  },
});

/**
 * Get pending payments requiring action
 */
export const getPendingPayments = query({
  args: { renterId: v.string() },
  handler: async (ctx, args) => {
    const pendingPayments = await ctx.db
      .query("rentPayments")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing")
        )
      )
      .collect();

    return pendingPayments;
  },
});

// ========================================
// PAYMENT STATS
// ========================================

/**
 * Get payment statistics for a renter
 */
export const getRenterPaymentStats = query({
  args: { renterId: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("rentPayments")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const streak = await ctx.db
      .query("paymentStreaks")
      .withIndex("by_userId", (q) => q.eq("userId", args.renterId))
      .first();

    const totalPaid = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPointsEarned = payments.reduce((sum, p) => sum + (p.totalPointsEarned ?? 0), 0);
    const onTimePayments = payments.filter((p) => p.isOnTime).length;

    return {
      totalPayments: payments.length,
      totalPaid,
      totalPointsEarned,
      onTimePayments,
      onTimePercentage: payments.length > 0
        ? Math.round((onTimePayments / payments.length) * 100)
        : 100,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      averagePayment: payments.length > 0
        ? Math.round(totalPaid / payments.length)
        : 0,
    };
  },
});
