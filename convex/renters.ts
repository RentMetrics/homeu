import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new renter profile
export const create = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.string(),
    dateOfBirth: v.string(),
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    employer: v.string(),
    position: v.string(),
    income: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, email, ...renterData } = args;

    // Check if a renter profile already exists for this user
    const existingRenter = await ctx.db
      .query('renters')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first();

    if (existingRenter) {
      throw new Error('Renter profile already exists for this user');
    }

    // Create the renter profile
    const renterId = await ctx.db.insert('renters', {
      userId,
      email,
      ...renterData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return renterId;
  },
});

// Get renter profile by userId
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return renter;
  },
});

// Update renter profile
export const update = mutation({
  args: {
    userId: v.string(),
    updates: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      currentAddress: v.optional(v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
      })),
      employment: v.optional(v.object({
        employer: v.string(),
        position: v.string(),
        income: v.number(),
        employmentStartDate: v.string(),
      })),
      preferences: v.optional(v.object({
        preferredPropertyTypes: v.array(v.string()),
        maxRent: v.number(),
        preferredLocations: v.array(v.string()),
        moveInDate: v.optional(v.string()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      throw new Error("Renter not found");
    }

    await ctx.db.patch(renter._id, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    return renter._id;
  },
});

// Update credit information
export const updateCreditInfo = mutation({
  args: {
    userId: v.string(),
    creditInfo: v.object({
      arrayId: v.string(),
      creditScore: v.number(),
      creditBureau: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      throw new Error("Renter not found");
    }

    await ctx.db.patch(renter._id, {
      creditInfo: {
        ...args.creditInfo,
        lastCreditCheck: Date.now(),
      },
      updatedAt: Date.now(),
    });

    return renter._id;
  },
});

// Update verification status
export const updateVerificationStatus = mutation({
  args: {
    userId: v.string(),
    isVerified: v.boolean(),
    documentsSubmitted: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      throw new Error("Renter not found");
    }

    await ctx.db.patch(renter._id, {
      verificationStatus: {
        isVerified: args.isVerified,
        verificationDate: args.isVerified ? Date.now() : null,
        documentsSubmitted: args.documentsSubmitted,
      },
      updatedAt: Date.now(),
    });

    return renter._id;
  },
}); 