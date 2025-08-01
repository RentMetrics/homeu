import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Query to get all properties
export const get = query({
  args: {
    type: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let properties = await ctx.db.query("properties").collect();

    // Apply filters
    if (args.type && args.type !== "all") {
      properties = properties.filter((p) => p.type === args.type);
    }

    if (args.minPrice) {
      properties = properties.filter((p) => p.price >= args.minPrice!);
    }

    if (args.maxPrice) {
      properties = properties.filter((p) => p.price <= args.maxPrice!);
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      properties = properties.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.location.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return properties;
  },
});

// Mutation to add a new property
export const add = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    price: v.number(),
    beds: v.number(),
    baths: v.number(),
    sqft: v.number(),
    location: v.string(),
    image: v.string(),
    amenities: v.array(v.string()),
    description: v.string(),
    homeuScore: v.number(),
    scoreFactors: v.array(v.string()),
    availableDate: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const propertyId = await ctx.db.insert("properties", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return propertyId;
  },
}); 