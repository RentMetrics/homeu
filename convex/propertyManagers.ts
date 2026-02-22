import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create property manager organization
export const createOrganization = mutation({
  args: {
    workosOrganizationId: v.string(),
    companyName: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const organizationId = await ctx.db.insert("propertyManagerOrganizations", {
      workosOrganizationId: args.workosOrganizationId,
      companyName: args.companyName,
      adminEmail: args.adminEmail,
      properties: [],
      isActive: true,
      createdAt: Date.now(),
    });

    return organizationId;
  },
});

// Create property manager
export const createPropertyManager = mutation({
  args: {
    workosUserId: v.string(),
    organizationId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    companyName: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const propertyManagerId = await ctx.db.insert("propertyManagers", {
      workosUserId: args.workosUserId,
      organizationId: args.organizationId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      companyName: args.companyName,
      role: args.role,
      properties: [],
      isActive: true,
      createdAt: Date.now(),
    });

    return propertyManagerId;
  },
});

// Get property manager by WorkOS user ID
export const getPropertyManagerByWorkosId = query({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("propertyManagers")
      .withIndex("by_workosUserId", (q) => q.eq("workosUserId", args.workosUserId))
      .first();
  },
});

// Get organization property managers
export const getOrganizationPropertyManagers = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("propertyManagers")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

// Assign property to property manager
export const assignPropertyToManager = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
    propertyId: v.string(),
  },
  handler: async (ctx, args) => {
    const propertyManager = await ctx.db.get(args.propertyManagerId);
    if (!propertyManager) {
      throw new Error("Property manager not found");
    }

    const updatedProperties = [...propertyManager.properties, args.propertyId];

    await ctx.db.patch(args.propertyManagerId, {
      properties: updatedProperties,
    });

    return args.propertyManagerId;
  },
});

// Submit renter application
export const submitRenterApplication = mutation({
  args: {
    renterId: v.string(),
    propertyId: v.string(),
    propertyManagerId: v.string(),
    organizationId: v.string(),
    documentsHash: v.string(),
    applicationData: v.any(),
  },
  handler: async (ctx, args) => {
    const applicationId = await ctx.db.insert("renterApplications", {
      renterId: args.renterId,
      propertyId: args.propertyId,
      propertyManagerId: args.propertyManagerId,
      organizationId: args.organizationId,
      status: "pending",
      documentsHash: args.documentsHash,
      applicationData: args.applicationData,
      submittedAt: Date.now(),
    });

    return applicationId;
  },
});

// Review renter application
export const reviewRenterApplication = mutation({
  args: {
    applicationId: v.id("renterApplications"),
    status: v.string(),
    reviewedBy: v.string(),
    notes: v.optional(v.string()),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
      notes: args.notes,
      score: args.score,
    });

    return args.applicationId;
  },
});

// Get property manager applications
export const getPropertyManagerApplications = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("renterApplications")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .order("desc")
      .collect();
  },
});

// Get organization applications
export const getOrganizationApplications = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const propertyManagers = await ctx.db
      .query("propertyManagers")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const applications = [];
    for (const pm of propertyManagers) {
      const pmApplications = await ctx.db
        .query("renterApplications")
        .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", pm.workosUserId))
        .collect();
      applications.push(...pmApplications);
    }

    return applications.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// Create property manager invoice
export const createPropertyManagerInvoice = mutation({
  args: {
    organizationId: v.string(),
    propertyManagerId: v.string(),
    invoiceNumber: v.string(),
    month: v.string(),
    properties: v.array(v.string()),
    totalAmount: v.number(),
    currency: v.string(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoiceId = await ctx.db.insert("propertyManagerInvoices", {
      organizationId: args.organizationId,
      propertyManagerId: args.propertyManagerId,
      invoiceNumber: args.invoiceNumber,
      month: args.month,
      properties: args.properties,
      totalAmount: args.totalAmount,
      currency: args.currency,
      status: "draft",
      dueDate: args.dueDate,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return invoiceId;
  },
});

// Update invoice status
export const updateInvoiceStatus = mutation({
  args: {
    invoiceId: v.id("propertyManagerInvoices"),
    status: v.string(),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      status: args.status,
      paymentMethod: args.paymentMethod,
    };

    if (args.status === "sent") {
      updateData.sentAt = Date.now();
    } else if (args.status === "paid") {
      updateData.paidAt = Date.now();
    }

    await ctx.db.patch(args.invoiceId, updateData);
    return args.invoiceId;
  },
});

// Get organization invoices
export const getOrganizationInvoices = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("propertyManagerInvoices")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

// Get property manager stats
export const getPropertyManagerStats = query({
  args: { propertyManagerId: v.string() },
  handler: async (ctx, args) => {
    const applications = await ctx.db
      .query("renterApplications")
      .withIndex("by_propertyManagerId", (q) => q.eq("propertyManagerId", args.propertyManagerId))
      .collect();

    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => a.status === "pending").length;
    const approvedApplications = applications.filter(a => a.status === "approved").length;
    const rejectedApplications = applications.filter(a => a.status === "rejected").length;

    const propertyManager = await ctx.db
      .query("propertyManagers")
      .withIndex("by_workosUserId", (q) => q.eq("workosUserId", args.propertyManagerId))
      .first();

    const managedProperties = propertyManager?.properties.length || 0;

    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      managedProperties,
    };
  },
});

// Update property manager last login
export const updatePropertyManagerLastLogin = mutation({
  args: { workosUserId: v.string() },
  handler: async (ctx, args) => {
    const propertyManager = await ctx.db
      .query("propertyManagers")
      .withIndex("by_workosUserId", (q) => q.eq("workosUserId", args.workosUserId))
      .first();

    if (propertyManager) {
      await ctx.db.patch(propertyManager._id, {
        lastLogin: Date.now(),
      });
    }

    return propertyManager?._id;
  },
});

// Get renter applications
export const getRenterApplications = query({
  args: { renterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("renterApplications")
      .withIndex("by_renterId", (q) => q.eq("renterId", args.renterId))
      .order("desc")
      .collect();
  },
});

// Admin: Get all property managers with enriched data
export const getAllPropertyManagers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 100 } = args;
    const pms = await ctx.db.query("propertyManagers").take(limit);

    // Enrich each PM with property details and stats
    const enriched = await Promise.all(
      pms.map(async (pm) => {
        // Get property details
        const propertyDetails = await Promise.all(
          pm.properties.map(async (propId) => {
            const prop = await ctx.db
              .query("multifamilyproperties")
              .withIndex("by_propertyId", (q) => q.eq("propertyId", propId))
              .first();
            return prop
              ? {
                  propertyId: prop.propertyId,
                  propertyName: prop.propertyName,
                  address: prop.address,
                  city: prop.city,
                  state: prop.state,
                  zipCode: prop.zipCode,
                  totalUnits: prop.totalUnits,
                  isConnectedToHomeU: false,
                  activeResidents: 0,
                  totalMonthlyRent: 0,
                }
              : { propertyId: propId, propertyName: propId, address: "", city: "", state: "", zipCode: "", totalUnits: 0, isConnectedToHomeU: false, activeResidents: 0, totalMonthlyRent: 0 };
          })
        );

        // Get organization
        const organization = await ctx.db
          .query("propertyManagerOrganizations")
          .withIndex("by_workosOrganizationId", (q) => q.eq("workosOrganizationId", pm.organizationId))
          .first();

        return {
          ...pm,
          propertyDetails,
          organization: organization ? { companyName: organization.companyName, adminEmail: organization.adminEmail } : null,
          totalPropertyCount: pm.properties.length,
          connectedPropertyCount: 0,
          activeRenterCount: 0,
        };
      })
    );

    return enriched;
  },
});

// Admin: Create a property manager
export const adminCreatePropertyManager = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    companyName: v.string(),
    role: v.string(),
    propertyIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("propertyManagers", {
      workosUserId: `admin_created_${Date.now()}`,
      organizationId: `org_${Date.now()}`,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      companyName: args.companyName,
      role: args.role,
      properties: args.propertyIds,
      isActive: true,
      createdAt: Date.now(),
    });
    return id;
  },
});

// Admin: Deactivate a property manager
export const adminDeactivatePropertyManager = mutation({
  args: {
    pmId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pmId, { isActive: false });
    return args.pmId;
  },
});

// Admin: Reactivate a property manager
export const adminReactivatePropertyManager = mutation({
  args: {
    pmId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pmId, { isActive: true });
    return args.pmId;
  },
});

// Find an active property manager whose properties array includes the given propertyId
export const findPropertyManagerForProperty = query({
  args: {
    propertyId: v.string(),
  },
  handler: async (ctx, args) => {
    const allPMs = await ctx.db.query("propertyManagers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    return allPMs.find((pm) => pm.properties.includes(args.propertyId)) ?? null;
  },
});

// Generate an onboarding token for PM bank setup
export const generateOnboardingToken = mutation({
  args: {
    pmId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    const pm = await ctx.db.get(args.pmId);
    if (!pm) throw new Error("Property manager not found");

    const token = `pm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("pmOnboardingTokens", {
      propertyManagerId: args.pmId,
      token,
      email: pm.email,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + sevenDaysMs,
    });

    return { token };
  },
});

// Validate an onboarding token and return PM details
export const validateOnboardingToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db.query("pmOnboardingTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) return { valid: false, error: "Token not found" };
    if (tokenDoc.status === "completed") return { valid: false, error: "Token already used" };
    if (tokenDoc.status === "expired" || tokenDoc.expiresAt < Date.now()) {
      return { valid: false, error: "Token expired" };
    }

    const pm = await ctx.db.get(tokenDoc.propertyManagerId);
    if (!pm) return { valid: false, error: "Property manager not found" };

    return {
      valid: true,
      pm: {
        id: pm._id,
        firstName: pm.firstName,
        lastName: pm.lastName,
        companyName: pm.companyName,
        email: pm.email,
      },
    };
  },
});

// Complete PM onboarding after bank setup
export const completeOnboarding = mutation({
  args: {
    token: v.string(),
    straddleCustomerId: v.string(),
    straddleBankAccountId: v.string(),
    payoutSchedule: v.string(),
    payoutMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db.query("pmOnboardingTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenDoc) throw new Error("Token not found");
    if (tokenDoc.status !== "pending") throw new Error("Token is not pending");
    if (tokenDoc.expiresAt < Date.now()) throw new Error("Token expired");

    // Update PM with payment details
    await ctx.db.patch(tokenDoc.propertyManagerId, {
      straddleCustomerId: args.straddleCustomerId,
      straddleBankAccountId: args.straddleBankAccountId,
      paymentOnboardingComplete: true,
      paymentOnboardingDate: Date.now(),
      payoutSchedule: args.payoutSchedule,
      defaultPayoutMethod: args.payoutMethod,
    });

    // Mark token as completed
    await ctx.db.patch(tokenDoc._id, {
      status: "completed",
      completedAt: Date.now(),
    });

    return { success: true };
  },
});