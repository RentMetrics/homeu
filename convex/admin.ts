import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all active payment connections (admin function)
export const getPaymentConnections = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all active payment routings
    const routings = await ctx.db
      .query("rentPaymentRouting")
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(args.limit || 100);

    // Enrich each connection
    const connections = await Promise.all(
      routings.map(async (routing) => {
        const renter = await ctx.db
          .query("renters")
          .withIndex("by_userId", (q) => q.eq("userId", routing.renterId))
          .first();

        const property = await ctx.db
          .query("multifamilyproperties")
          .withIndex("by_propertyId", (q) => q.eq("propertyId", routing.propertyId))
          .first();

        const pmId = routing.propertyManagerId;
        const pm = pmId
          ? await ctx.db
              .query("propertyManagers")
              .withIndex("by_workosUserId", (q) => q.eq("workosUserId", pmId))
              .first()
          : null;

        return {
          id: routing._id,
          renter: renter ? {
            userId: renter.userId,
            name: `${renter.firstName} ${renter.lastName}`,
            email: renter.email,
            phone: renter.phoneNumber,
            verified: renter.verified,
          } : null,
          property: property ? {
            propertyId: property.propertyId,
            name: property.propertyName,
            address: `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`,
            totalUnits: property.totalUnits,
          } : null,
          propertyManager: pm ? {
            workosUserId: pm.workosUserId,
            name: `${pm.firstName} ${pm.lastName}`,
            company: pm.companyName,
            email: pm.email,
            paymentOnboarded: pm.paymentOnboardingComplete || false,
          } : null,
          monthlyRent: routing.monthlyRentAmount,
          dueDay: routing.dueDay,
          autoPayEnabled: routing.autoPayEnabled,
          isActive: routing.isActive,
          createdAt: routing.createdAt,
          updatedAt: routing.updatedAt,
        };
      })
    );

    return connections;
  },
});

// Get admin dashboard stats
export const getAdminDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    // Count totals
    const renters = await ctx.db.query("renters").collect();
    const propertyManagers = await ctx.db.query("propertyManagers").collect();
    const properties = await ctx.db.query("multifamilyproperties").collect();
    const activeRoutings = await ctx.db
      .query("rentPaymentRouting")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Verified renters
    const verifiedRenters = renters.filter(r => r.verified);

    // Active property managers
    const activePMs = propertyManagers.filter(pm => pm.isActive);

    // PMs with payment onboarding complete
    const onboardedPMs = propertyManagers.filter(pm => pm.paymentOnboardingComplete);

    // Calculate total monthly rent being routed
    const totalMonthlyRent = activeRoutings.reduce((sum, r) => sum + r.monthlyRentAmount, 0);

    // Recent signups (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentRenters = renters.filter(r => r._creationTime >= thirtyDaysAgo);

    return {
      totalRenters: renters.length,
      verifiedRenters: verifiedRenters.length,
      recentSignups: recentRenters.length,
      totalPropertyManagers: propertyManagers.length,
      activePropertyManagers: activePMs.length,
      onboardedPropertyManagers: onboardedPMs.length,
      totalProperties: properties.length,
      activeConnections: activeRoutings.length,
      totalMonthlyRentRouted: totalMonthlyRent,
    };
  },
});

// Get connection stats summary
export const getConnectionStats = query({
  args: {},
  handler: async (ctx) => {
    const routings = await ctx.db
      .query("rentPaymentRouting")
      .collect();

    const activeRoutings = routings.filter(r => r.isActive);
    const inactiveRoutings = routings.filter(r => !r.isActive);
    const autoPayRoutings = activeRoutings.filter(r => r.autoPayEnabled);

    // Group by property manager
    const pmGroups: Record<string, number> = {};
    for (const routing of activeRoutings) {
      if (!routing.propertyManagerId) continue;
      pmGroups[routing.propertyManagerId] = (pmGroups[routing.propertyManagerId] || 0) + 1;
    }

    // Group by property
    const propertyGroups: Record<string, number> = {};
    for (const routing of activeRoutings) {
      propertyGroups[routing.propertyId] = (propertyGroups[routing.propertyId] || 0) + 1;
    }

    return {
      totalConnections: routings.length,
      activeConnections: activeRoutings.length,
      inactiveConnections: inactiveRoutings.length,
      autoPayEnabled: autoPayRoutings.length,
      autoPayPercentage: activeRoutings.length > 0
        ? Math.round((autoPayRoutings.length / activeRoutings.length) * 100)
        : 0,
      uniquePropertyManagers: Object.keys(pmGroups).length,
      uniqueProperties: Object.keys(propertyGroups).length,
      totalMonthlyRent: activeRoutings.reduce((sum, r) => sum + r.monthlyRentAmount, 0),
      averageRent: activeRoutings.length > 0
        ? Math.round(activeRoutings.reduce((sum, r) => sum + r.monthlyRentAmount, 0) / activeRoutings.length)
        : 0,
    };
  },
});
