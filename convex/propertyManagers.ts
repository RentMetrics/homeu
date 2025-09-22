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