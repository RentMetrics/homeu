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