/**
 * Convex Functions for Rental History
 *
 * Tracks user's past and current residences for:
 * - Building renter profile
 * - Credit history verification
 * - Rental references
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ========================================
// QUERIES
// ========================================

/**
 * Get user's rental history
 */
export const getUserRentalHistory = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("rentalHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by moveInDate descending (most recent first)
    return history.sort((a, b) => b.moveInDate - a.moveInDate);
  },
});

/**
 * Get current residence
 */
export const getCurrentResidence = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const current = await ctx.db
      .query("rentalHistory")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", "current")
      )
      .first();

    return current;
  },
});

/**
 * Get rental history stats
 */
export const getRentalHistoryStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("rentalHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (history.length === 0) {
      return {
        totalProperties: 0,
        totalMonths: 0,
        totalOnTimePayments: 0,
        totalPayments: 0,
        onTimeRate: 0,
        verifiedCount: 0,
        currentResidence: null,
      };
    }

    // Calculate total months
    let totalMonths = 0;
    for (const residence of history) {
      const moveOut = residence.moveOutDate || Date.now();
      const months = Math.floor(
        (moveOut - residence.moveInDate) / (30 * 24 * 60 * 60 * 1000)
      );
      totalMonths += months;
    }

    // Calculate payment stats
    const totalOnTime = history.reduce(
      (sum, h) => sum + h.paymentHistory.onTimePayments,
      0
    );
    const totalPayments = history.reduce(
      (sum, h) => sum + h.paymentHistory.totalPayments,
      0
    );

    return {
      totalProperties: history.length,
      totalMonths,
      totalOnTimePayments: totalOnTime,
      totalPayments,
      onTimeRate: totalPayments > 0 ? Math.round((totalOnTime / totalPayments) * 100) : 0,
      verifiedCount: history.filter((h) => h.verified).length,
      currentResidence: history.find((h) => h.status === "current") || null,
    };
  },
});

// ========================================
// MUTATIONS
// ========================================

/**
 * Add a new rental history entry
 */
export const addRentalHistory = mutation({
  args: {
    userId: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    propertyType: v.string(),
    monthlyRent: v.number(),
    moveInDate: v.number(),
    moveOutDate: v.optional(v.number()),
    landlordName: v.optional(v.string()),
    landlordContact: v.optional(v.string()),
    landlordEmail: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If adding a current residence, mark any existing current as past
    if (args.status === "current") {
      const existingCurrent = await ctx.db
        .query("rentalHistory")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", args.userId).eq("status", "current")
        )
        .first();

      if (existingCurrent) {
        await ctx.db.patch(existingCurrent._id, {
          status: "past",
          moveOutDate: args.moveInDate,
          updatedAt: now,
        });
      }
    }

    const id = await ctx.db.insert("rentalHistory", {
      userId: args.userId,
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      propertyType: args.propertyType,
      monthlyRent: args.monthlyRent,
      moveInDate: args.moveInDate,
      moveOutDate: args.moveOutDate,
      landlordName: args.landlordName,
      landlordContact: args.landlordContact,
      landlordEmail: args.landlordEmail,
      paymentHistory: {
        onTimePayments: 0,
        latePayments: 0,
        totalPayments: 0,
      },
      status: args.status,
      verified: false,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  },
});

/**
 * Update rental history entry
 */
export const updateRentalHistory = mutation({
  args: {
    id: v.id("rentalHistory"),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    monthlyRent: v.optional(v.number()),
    moveOutDate: v.optional(v.number()),
    landlordName: v.optional(v.string()),
    landlordContact: v.optional(v.string()),
    landlordEmail: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates: Record<string, any> = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, filteredUpdates);
    return { success: true };
  },
});

/**
 * Update payment history for a residence
 */
export const recordPayment = mutation({
  args: {
    id: v.id("rentalHistory"),
    isOnTime: v.boolean(),
  },
  handler: async (ctx, args) => {
    const residence = await ctx.db.get(args.id);
    if (!residence) {
      return { success: false, message: "Residence not found" };
    }

    const newPaymentHistory = {
      ...residence.paymentHistory,
      totalPayments: residence.paymentHistory.totalPayments + 1,
      onTimePayments: args.isOnTime
        ? residence.paymentHistory.onTimePayments + 1
        : residence.paymentHistory.onTimePayments,
      latePayments: args.isOnTime
        ? residence.paymentHistory.latePayments
        : residence.paymentHistory.latePayments + 1,
    };

    await ctx.db.patch(args.id, {
      paymentHistory: newPaymentHistory,
      updatedAt: Date.now(),
    });

    return { success: true, paymentHistory: newPaymentHistory };
  },
});

/**
 * Verify rental history
 */
export const verifyRentalHistory = mutation({
  args: {
    id: v.id("rentalHistory"),
    verificationMethod: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      verified: true,
      verificationMethod: args.verificationMethod,
      verifiedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete rental history entry
 */
export const deleteRentalHistory = mutation({
  args: {
    id: v.id("rentalHistory"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Link current rental to HomeU property
 */
export const linkToProperty = mutation({
  args: {
    userId: v.string(),
    propertyId: v.string(),
    monthlyRent: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get property details
    const property = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();

    if (!property) {
      return { success: false, message: "Property not found" };
    }

    // Mark any existing current residence as past
    const existingCurrent = await ctx.db
      .query("rentalHistory")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", "current")
      )
      .first();

    if (existingCurrent) {
      await ctx.db.patch(existingCurrent._id, {
        status: "past",
        moveOutDate: now,
        updatedAt: now,
      });
    }

    // Create new current residence
    const id = await ctx.db.insert("rentalHistory", {
      userId: args.userId,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      propertyType: "apartment",
      monthlyRent: args.monthlyRent,
      moveInDate: now,
      paymentHistory: {
        onTimePayments: 0,
        latePayments: 0,
        totalPayments: 0,
      },
      status: "current",
      verified: true,
      verificationMethod: "homeu_linked",
      verifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, id };
  },
});
