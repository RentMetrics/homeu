import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ========================================
// SUBSCRIPTION MANAGEMENT
// ========================================

// Check if property manager has access to rent prediction feature
export const hasRentPredictionAccess = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("propertyManagerSubscriptions")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .first();

    if (!subscription) {
      return { hasAccess: false, plan: 'free', reason: 'no_subscription' };
    }

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return { hasAccess: false, plan: subscription.plan, reason: 'subscription_inactive' };
    }

    const hasFeature = subscription.features.includes('rent_prediction');
    return {
      hasAccess: hasFeature,
      plan: subscription.plan,
      reason: hasFeature ? 'feature_enabled' : 'feature_not_included',
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    };
  },
});

// Get subscription details
export const getSubscription = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("propertyManagerSubscriptions")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .first();
  },
});

// Create or update subscription
export const upsertSubscription = mutation({
  args: {
    propertyManagerId: v.string(),
    organizationId: v.string(),
    plan: v.string(),
    features: v.array(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("propertyManagerSubscriptions")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("propertyManagerSubscriptions", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ========================================
// RENT PREDICTIONS
// ========================================

// Get current month's prediction
export const getCurrentPrediction = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return await ctx.db
      .query("rentPredictions")
      .withIndex("by_propertyManagerId_month", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId).eq("month", currentMonth)
      )
      .first();
  },
});

// Get prediction for specific month
export const getPrediction = query({
  args: {
    propertyManagerId: v.string(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rentPredictions")
      .withIndex("by_propertyManagerId_month", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId).eq("month", args.month)
      )
      .first();
  },
});

// Get prediction history
export const getPredictionHistory = query({
  args: {
    propertyManagerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const predictions = await ctx.db
      .query("rentPredictions")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .order("desc")
      .take(args.limit || 12);

    return predictions;
  },
});

// Store a new prediction
export const storePrediction = mutation({
  args: {
    propertyManagerId: v.string(),
    organizationId: v.string(),
    month: v.string(),
    totalResidents: v.number(),
    predictedPayments: v.number(),
    predictedNonPayments: v.number(),
    uncertainPayments: v.number(),
    predictedCollectionRate: v.number(),
    predictedCollectionAmount: v.number(),
    totalExpectedRent: v.number(),
    confidence: v.string(),
    residentPredictions: v.array(v.object({
      renterId: v.string(),
      renterName: v.string(),
      propertyId: v.string(),
      propertyAddress: v.string(),
      rentAmount: v.number(),
      prediction: v.string(),
      confidenceScore: v.number(),
      reason: v.string(),
      lastChecked: v.number(),
    })),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if prediction already exists for this month
    const existing = await ctx.db
      .query("rentPredictions")
      .withIndex("by_propertyManagerId_month", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId).eq("month", args.month)
      )
      .first();

    if (existing) {
      // Update existing prediction
      await ctx.db.patch(existing._id, {
        ...args,
        generatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new prediction
    return await ctx.db.insert("rentPredictions", {
      ...args,
      generatedAt: Date.now(),
    });
  },
});

// ========================================
// BALANCE CHECKS
// ========================================

// Record a balance check
export const recordBalanceCheck = mutation({
  args: {
    renterId: v.string(),
    propertyManagerId: v.string(),
    checkType: v.string(),
    straddleCheckId: v.optional(v.string()),
    hasSufficientFunds: v.boolean(),
    rentAmount: v.number(),
    availableBalance: v.optional(v.number()),
    accountStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Balance checks expire after 24 hours
    const expiresAt = now + (24 * 60 * 60 * 1000);

    return await ctx.db.insert("balanceChecks", {
      ...args,
      checkedAt: now,
      expiresAt,
    });
  },
});

// Get recent balance check for a renter
export const getRecentBalanceCheck = query({
  args: {
    renterId: v.string(),
    maxAgeHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAge = (args.maxAgeHours || 24) * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;

    const checks = await ctx.db
      .query("balanceChecks")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .order("desc")
      .take(1);

    const check = checks[0];
    if (check && check.checkedAt > cutoff) {
      return check;
    }
    return null;
  },
});

// Get all balance checks for a property manager (for audit)
export const getBalanceCheckHistory = query({
  args: {
    propertyManagerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("balanceChecks")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .order("desc")
      .take(args.limit || 100);
  },
});

// ========================================
// HELPER QUERIES
// ========================================

// Get all active renters for a property manager (for running predictions)
export const getActiveRentersForPrediction = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    // Get all active rent payment routings for this PM
    const routings = await ctx.db
      .query("rentPaymentRouting")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get renter details for each routing
    const rentersWithRent = await Promise.all(
      routings.map(async (routing) => {
        const renter = await ctx.db
          .query("renters")
          .withIndex("by_userId", (q) => q.eq("userId", routing.renterId))
          .first();

        return {
          renterId: routing.renterId,
          renterName: renter ? `${renter.firstName} ${renter.lastName}` : 'Unknown',
          propertyId: routing.propertyId,
          propertyAddress: `Property ${routing.propertyId}`, // Would need property lookup
          rentAmount: routing.monthlyRentAmount,
          straddleCustomerId: renter?.straddleCustomerId,
          hasLinkedBank: !!routing.straddlePaymentMethodId,
        };
      })
    );

    return rentersWithRent;
  },
});

// Get prediction summary stats for dashboard
export const getPredictionSummary = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const prediction = await ctx.db
      .query("rentPredictions")
      .withIndex("by_propertyManagerId_month", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId).eq("month", currentMonth)
      )
      .first();

    if (!prediction) {
      return null;
    }

    // Get previous month for comparison
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const prevPrediction = await ctx.db
      .query("rentPredictions")
      .withIndex("by_propertyManagerId_month", (q) =>
        q.eq("propertyManagerId", args.propertyManagerId).eq("month", prevMonth)
      )
      .first();

    return {
      currentMonth: {
        month: currentMonth,
        collectionRate: prediction.predictedCollectionRate,
        predictedAmount: prediction.predictedCollectionAmount,
        totalExpected: prediction.totalExpectedRent,
        likelyCount: prediction.predictedPayments,
        unlikelyCount: prediction.predictedNonPayments,
        uncertainCount: prediction.uncertainPayments,
        totalResidents: prediction.totalResidents,
        confidence: prediction.confidence,
        generatedAt: prediction.generatedAt,
      },
      previousMonth: prevPrediction ? {
        month: prevMonth,
        collectionRate: prevPrediction.predictedCollectionRate,
        predictedAmount: prevPrediction.predictedCollectionAmount,
      } : null,
      trend: prevPrediction
        ? prediction.predictedCollectionRate - prevPrediction.predictedCollectionRate
        : null,
    };
  },
});
