import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user profile
export const createOrUpdateUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName || existingUser.firstName,
        lastName: args.lastName || existingUser.lastName,
        phoneNumber: args.phoneNumber || existingUser.phoneNumber,
      });
      return existingUser._id;
    } else {
      // Create new user with default values
      const newUserId = await ctx.db.insert("renters", {
        userId: args.userId,
        email: args.email,
        firstName: args.firstName || "",
        lastName: args.lastName || "",
        phoneNumber: args.phoneNumber || "",
        dateOfBirth: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        employer: "",
        position: "",
        income: 0,
        verified: false,
        verificationStatus: "pending",
      });
      return newUserId;
    }
  },
});

// Get user profile by userId
export const getUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return user;
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    street: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    employer: v.optional(v.string()),
    position: v.optional(v.string()),
    income: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;

    const existingUser = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(existingUser._id, filteredData);
    return existingUser._id;
  },
});

// Mark user as verified
export const verifyUser = mutation({
  args: {
    userId: v.string(),
    verificationStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    await ctx.db.patch(existingUser._id, {
      verified: args.verificationStatus === "verified",
      verificationStatus: args.verificationStatus,
      verificationDate: Date.now(),
    });

    return existingUser._id;
  },
});

// Get all users (admin function)
export const getAllUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db.query("renters");
    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get verified users (admin function)
export const getVerifiedUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const query = ctx.db.query("renters")
      .filter((q) => q.eq(q.field("verified"), true));

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get recent signups (admin function)
export const getRecentSignups = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago

    const query = ctx.db.query("renters")
      .filter((q) => q.gte(q.field("_creationTime"), thirtyDaysAgo))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get user count (admin function)
export const getUserCount = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("renters").collect();
    return users.length;
  },
});

// Save or update a renter's lease application
export const saveApplication = mutation({
  args: {
    userId: v.string(),
    formData: v.any(),
    coApplicants: v.any(),
    occupants: v.any(),
    vehicles: v.any(),
    incomeSources: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("savedApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        formData: args.formData,
        coApplicants: args.coApplicants,
        occupants: args.occupants,
        vehicles: args.vehicles,
        incomeSources: args.incomeSources,
        status: "submitted",
        submittedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("savedApplications", {
      userId: args.userId,
      formData: args.formData,
      coApplicants: args.coApplicants,
      occupants: args.occupants,
      vehicles: args.vehicles,
      incomeSources: args.incomeSources,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    });
  },
});

// Get a saved application for a user
export const getSavedApplication = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savedApplications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});