import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Upload occupancy data
export const bulkUploadOccupancy = mutation({
  args: {
    data: v.array(v.object({
      propertyId: v.string(),
      month: v.string(),
      occupancyRate: v.number(),
      occupiedUnits: v.number(),
      vacantUnits: v.number(),
      totalUnits: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const record of args.data) {
      const id = await ctx.db.insert("occupancyData", {
        ...record,
        createdAt: Date.now(),
      });
      insertedIds.push(id);
    }
    return insertedIds;
  },
});

// Upload concession data
export const bulkUploadConcessions = mutation({
  args: {
    data: v.array(v.object({
      propertyId: v.string(),
      month: v.string(),
      concessionType: v.string(),
      concessionAmount: v.number(),
      concessionDuration: v.number(),
      unitsWithConcessions: v.number(),
      totalUnits: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const record of args.data) {
      const id = await ctx.db.insert("concessionData", {
        ...record,
        createdAt: Date.now(),
      });
      insertedIds.push(id);
    }
    return insertedIds;
  },
});

// Upload rent data
export const bulkUploadRent = mutation({
  args: {
    data: v.array(v.object({
      propertyId: v.string(),
      month: v.string(),
      averageRent: v.number(),
      minRent: v.number(),
      maxRent: v.number(),
      rentPerSqFt: v.number(),
      totalRevenue: v.number(),
      unitsRented: v.number(),
      totalUnits: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const insertedIds = [];
    for (const record of args.data) {
      const id = await ctx.db.insert("rentData", {
        ...record,
        createdAt: Date.now(),
      });
      insertedIds.push(id);
    }
    return insertedIds;
  },
});

// Get property data by propertyId
export const getPropertyById = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();
    
    return property;
  },
});

// Get occupancy data for a property
export const getOccupancyData = query({
  args: { 
    propertyId: v.string(),
    startMonth: v.optional(v.string()),
    endMonth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("occupancyData")
      .withIndex("by_propertyId_month", (q) => q.eq("propertyId", args.propertyId));
    
    if (args.startMonth && args.endMonth) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("month"), args.startMonth!),
          q.lte(q.field("month"), args.endMonth!)
        )
      );
    }
    
    return await query.order("asc").collect();
  },
});

// Get concession data for a property
export const getConcessionData = query({
  args: { 
    propertyId: v.string(),
    startMonth: v.optional(v.string()),
    endMonth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("concessionData")
      .withIndex("by_propertyId_month", (q) => q.eq("propertyId", args.propertyId));
    
    if (args.startMonth && args.endMonth) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("month"), args.startMonth!),
          q.lte(q.field("month"), args.endMonth!)
        )
      );
    }
    
    return await query.order("asc").collect();
  },
});

// Get rent data for a property
export const getRentData = query({
  args: { 
    propertyId: v.string(),
    startMonth: v.optional(v.string()),
    endMonth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("rentData")
      .withIndex("by_propertyId_month", (q) => q.eq("propertyId", args.propertyId));
    
    if (args.startMonth && args.endMonth) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("month"), args.startMonth!),
          q.lte(q.field("month"), args.endMonth!)
        )
      );
    }
    
    return await query.order("asc").collect();
  },
});

// Get all property IDs for validation
export const getAllPropertyIds = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("multifamilyproperties").collect();
    return properties.map(p => p.propertyId);
  },
}); 
// Market data summary for the admin data-management page
export const getMarketDataSummary = query({
  args: {
    propertyId: v.optional(v.string()),
    startMonth: v.optional(v.string()),
    endMonth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const inRange = (month: string) =>
      (!args.startMonth || month >= args.startMonth) &&
      (!args.endMonth || month <= args.endMonth);

    const propertyId = args.propertyId;

    const rentData = (propertyId
      ? await ctx.db
          .query("rentData")
          .withIndex("by_propertyId_month", (q) => q.eq("propertyId", propertyId))
          .collect()
      : await ctx.db.query("rentData").collect()
    ).filter((r) => inRange(r.month));

    const occupancyData = (propertyId
      ? await ctx.db
          .query("occupancyData")
          .withIndex("by_propertyId_month", (q) => q.eq("propertyId", propertyId))
          .collect()
      : await ctx.db.query("occupancyData").collect()
    ).filter((r) => inRange(r.month));

    const concessionData = (propertyId
      ? await ctx.db
          .query("concessionData")
          .withIndex("by_propertyId_month", (q) => q.eq("propertyId", propertyId))
          .collect()
      : await ctx.db.query("concessionData").collect()
    ).filter((r) => inRange(r.month));

    const propertyIds = new Set([
      ...rentData.map((r) => r.propertyId),
      ...occupancyData.map((r) => r.propertyId),
      ...concessionData.map((r) => r.propertyId),
    ]);
    const months = [...new Set([
      ...rentData.map((r) => r.month),
      ...occupancyData.map((r) => r.month),
      ...concessionData.map((r) => r.month),
    ])].sort();

    const avg = (values: number[]) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return {
      propertyCount: propertyIds.size,
      monthsAvailable: months,
      rentSummary: {
        averageRent: avg(rentData.map((r) => r.averageRent)),
        totalRecords: rentData.length,
      },
      occupancySummary: {
        averageOccupancy: avg(occupancyData.map((r) => r.occupancyRate)),
        totalRecords: occupancyData.length,
      },
      concessionSummary: {
        totalRecords: concessionData.length,
      },
      rentData,
      occupancyData,
      concessionData,
    };
  },
});
