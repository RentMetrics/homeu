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

    // Note: creditInfo field doesn't exist in schema, so we'll skip this for now
    // await ctx.db.patch(renter._id, {
    //   creditInfo: {
    //     ...args.creditInfo,
    //     updatedAt: Date.now(),
    //   },
    // });

    return renter._id;
  },
});

// ========================================
// PROPERTY LINKING
// ========================================

/**
 * Link a renter to an existing property in the database.
 * Checks if a PM is associated and onboarded.
 *
 * Returns status:
 * - "linked": PM on platform and onboarded → ready to pay
 * - "pending_pm_setup": PM exists but hasn't completed payment onboarding
 * - "pending_property": No PM found, outreach needed
 */
export const linkRenterToProperty = mutation({
  args: {
    userId: v.string(),
    propertyId: v.string(),
    unitNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return { success: false, status: "error", message: "Renter not found" };
    }

    const property = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();

    if (!property) {
      return { success: false, status: "error", message: "Property not found" };
    }

    // Find a PM that manages this property
    const allPMs = await ctx.db.query("propertyManagers").collect();
    const pm = allPMs.find(
      (p) => p.isActive && p.properties.includes(args.propertyId)
    );

    if (pm && pm.paymentOnboardingComplete) {
      // Fully linked — PM is on platform and ready
      await ctx.db.patch(renter._id, {
        propertyId: args.propertyId,
        propertyManagerId: pm._id.toString(),
        unitNumber: args.unitNumber,
        propertyLinkStatus: "linked",
      });

      return {
        success: true,
        status: "linked",
        message: "You're connected! Your property manager is set up on HomeU.",
        propertyName: property.propertyName,
        pmCompanyName: pm.companyName,
      };
    }

    if (pm && !pm.paymentOnboardingComplete) {
      // PM exists but hasn't set up payments
      await ctx.db.patch(renter._id, {
        propertyId: args.propertyId,
        propertyManagerId: pm._id.toString(),
        unitNumber: args.unitNumber,
        propertyLinkStatus: "pending_pm_setup",
      });

      await ctx.db.insert("pmOutreachRequests", {
        renterId: args.userId,
        propertyId: args.propertyId,
        pmEmail: pm.email,
        pmCompanyName: pm.companyName,
        pmContactName: `${pm.firstName} ${pm.lastName}`,
        propertyName: property.propertyName,
        propertyAddress: property.address,
        propertyCity: property.city,
        propertyState: property.state,
        propertyZipCode: property.zipCode,
        status: "pending",
        createdAt: Date.now(),
      });

      return {
        success: true,
        status: "pending_pm_setup",
        message: "We'll reach out to your property manager to complete their payment setup.",
        propertyName: property.propertyName,
        pmCompanyName: pm.companyName,
      };
    }

    // No PM found — use contact info from the property record
    await ctx.db.patch(renter._id, {
      propertyId: args.propertyId,
      unitNumber: args.unitNumber,
      propertyLinkStatus: property.pmEmail ? "pending_pm_setup" : "pending_property",
      pmContactInfo: property.pmEmail ? {
        companyName: property.pmCompanyName || "Unknown",
        contactName: property.pmContactName || undefined,
        email: property.pmEmail,
        phone: property.pmPhone || undefined,
      } : undefined,
    });

    if (property.pmEmail) {
      await ctx.db.insert("pmOutreachRequests", {
        renterId: args.userId,
        propertyId: args.propertyId,
        pmEmail: property.pmEmail,
        pmCompanyName: property.pmCompanyName || "Unknown",
        pmContactName: property.pmContactName || undefined,
        pmPhone: property.pmPhone || undefined,
        propertyName: property.propertyName,
        propertyAddress: property.address,
        propertyCity: property.city,
        propertyState: property.state,
        propertyZipCode: property.zipCode,
        status: "pending",
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      status: property.pmEmail ? "pending_pm_setup" : "pending_property",
      message: property.pmEmail
        ? "We'll reach out to your property manager to get them set up on HomeU."
        : "We've saved your property. We'll work on connecting with your management company.",
      propertyName: property.propertyName,
    };
  },
});

/**
 * Submit a property that's not in our database, along with PM contact info.
 */
export const submitManualPropertyAndLink = mutation({
  args: {
    userId: v.string(),
    propertyName: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    unitNumber: v.string(),
    pmCompanyName: v.string(),
    pmContactName: v.optional(v.string()),
    pmEmail: v.string(),
    pmPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter) {
      return { success: false, status: "error", message: "Renter not found" };
    }

    const propertyId = `MANUAL_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await ctx.db.insert("multifamilyproperties", {
      propertyId,
      propertyName: args.propertyName,
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      totalUnits: 0,
      yearBuilt: 0,
      averageUnitSize: 0,
      pmCompanyName: args.pmCompanyName,
      pmContactName: args.pmContactName,
      pmEmail: args.pmEmail,
      pmPhone: args.pmPhone,
      createdAt: Date.now(),
    });

    await ctx.db.patch(renter._id, {
      propertyId,
      unitNumber: args.unitNumber,
      propertyLinkStatus: "pending_property",
      pmContactInfo: {
        companyName: args.pmCompanyName,
        contactName: args.pmContactName,
        email: args.pmEmail,
        phone: args.pmPhone,
      },
    });

    await ctx.db.insert("pmOutreachRequests", {
      renterId: args.userId,
      propertyId,
      pmEmail: args.pmEmail,
      pmCompanyName: args.pmCompanyName,
      pmContactName: args.pmContactName,
      pmPhone: args.pmPhone,
      propertyName: args.propertyName,
      propertyAddress: args.address,
      propertyCity: args.city,
      propertyState: args.state,
      propertyZipCode: args.zipCode,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      success: true,
      status: "pending_property",
      propertyId,
      message: "We've saved your property info and will reach out to your property manager to get them on HomeU.",
    };
  },
});

/**
 * Skip property linking — user can do it later from the dashboard
 */
export const skipPropertyLink = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (renter) {
      await ctx.db.patch(renter._id, {
        propertyLinkStatus: "unlinked",
      });
    }

    return { success: true };
  },
});

/**
 * Get renter's property link status and details
 */
export const getPropertyLinkStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const renter = await ctx.db
      .query("renters")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!renter || !renter.propertyId) {
      return { status: renter?.propertyLinkStatus || "unlinked" };
    }

    const property = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", renter.propertyId!))
      .first();

    return {
      status: renter.propertyLinkStatus || "unlinked",
      propertyId: renter.propertyId,
      propertyName: property?.propertyName,
      propertyAddress: property?.address,
      propertyCity: property?.city,
      propertyState: property?.state,
      unitNumber: renter.unitNumber,
      pmContactInfo: renter.pmContactInfo,
      propertyManagerId: renter.propertyManagerId,
    };
  },
});

/**
 * Get pending PM outreach requests (admin)
 */
export const getPendingOutreachRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pmOutreachRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Update verification status
export const updateVerificationStatus = mutation({
  args: {
    userId: v.string(),
    isVerified: v.boolean(),
    verificationDate: v.optional(v.number()),
    documentsSubmitted: v.optional(v.array(v.string())),
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
      verified: args.isVerified,
      verificationDate: args.verificationDate,
      verificationStatus: args.isVerified ? "VERIFIED" : "PENDING",
    });

    return renter._id;
  },
}); 
// Get all renters (admin customers page)
export const getAllRenters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("renters").collect();
  },
});
