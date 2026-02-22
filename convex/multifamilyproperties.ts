import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const bulkUpload = mutation({
  args: {
    properties: v.array(v.object({
      propertyId: v.string(),
      propertyName: v.string(),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      totalUnits: v.number(),
      yearBuilt: v.number(),
      averageUnitSize: v.number(),
    })),
  },
  handler: async (ctx, args) => {
          const properties = args.properties.map(property => ({
        ...property,
        createdAt: Date.now(),
      }));

    const insertedIds = [];
    for (const property of properties) {
      const id = await ctx.db.insert("multifamilyproperties", property);
      insertedIds.push(id);
    }

    return insertedIds;
  },
});

// Simple query to get all properties for debugging
export const getAllProperties = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 100 } = args;
    const properties = await ctx.db.query("multifamilyproperties").take(limit);
    return properties;
  },
});

// List function for property search
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 100 } = args;
    const properties = await ctx.db.query("multifamilyproperties").take(limit);
    return properties;
  },
});

// Get total count for debugging
export const getPropertiesCount = query({
  args: {},
  handler: async (ctx) => {
    // Use a simple count approach that won't hit limits
    const properties = await ctx.db.query("multifamilyproperties").take(1000);
    return properties.length; // This is approximate for large datasets
  },
});

// Efficient search using indexed queries and pagination
export const searchAllPropertiesByLocation = query({
  args: { 
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { city, state, limit = 100, cursor } = args;
    
    console.log("Efficient search args:", { city, state, limit, cursor });
    
    let properties = [];
    
    // Use indexed queries for efficient searching
    if (city && state) {
      console.log("Searching by city and state:", city, state);
      
      // Try exact match first using index
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_city_state", (q) => 
          q.eq("city", city).eq("state", state)
        )
        .take(limit);
        
      console.log("Exact match results:", properties.length);
      
      // If no exact matches, try case-insensitive search with smaller batches
      if (properties.length === 0) {
        console.log("No exact matches, trying case-insensitive search");
        
        // Use a smaller batch size to avoid read limits
        const allProperties = await ctx.db.query("multifamilyproperties").take(2000);
        
        properties = allProperties.filter(property => {
          const propertyCity = property.city?.toLowerCase() || '';
          const propertyState = property.state?.toLowerCase() || '';
          const searchCity = city.toLowerCase();
          const searchState = state.toLowerCase();
          
          return propertyCity.includes(searchCity) && propertyState.includes(searchState);
        }).slice(0, limit);
        
        console.log("Case-insensitive match results:", properties.length);
      }
      
    } else if (city) {
      console.log("Searching by city only:", city);
      
      // Try exact match first
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_city", (q) => 
          q.eq("city", city)
        )
        .take(limit);
        
      console.log("Exact city match results:", properties.length);
      
      // If no exact matches, try case-insensitive search
      if (properties.length === 0) {
        console.log("No exact city matches, trying case-insensitive search");
        
        const allProperties = await ctx.db.query("multifamilyproperties").take(2000);
        
        properties = allProperties.filter(property => {
          const propertyCity = property.city?.toLowerCase() || '';
          const searchCity = city.toLowerCase();
          return propertyCity.includes(searchCity);
        }).slice(0, limit);
        
        console.log("Case-insensitive city match results:", properties.length);
      }
      
    } else if (state) {
      console.log("Searching by state only:", state);
      
      // Try exact match first
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_state", (q) => 
          q.eq("state", state)
        )
        .take(limit);
        
      console.log("Exact state match results:", properties.length);
      
      // If no exact matches, try case-insensitive search
      if (properties.length === 0) {
        console.log("No exact state matches, trying case-insensitive search");
        
        const allProperties = await ctx.db.query("multifamilyproperties").take(2000);
        
        properties = allProperties.filter(property => {
          const propertyState = property.state?.toLowerCase() || '';
          const searchState = state.toLowerCase();
          return propertyState.includes(searchState);
        }).slice(0, limit);
        
        console.log("Case-insensitive state match results:", properties.length);
      }
      
    } else {
      console.log("No search criteria, returning limited set");
      properties = await ctx.db.query("multifamilyproperties").take(limit);
      console.log("Default results:", properties.length);
    }
    
    console.log(`Efficient search found ${properties.length} properties`);
    
    return properties.map((property: any) => ({
      ...property,
      displayName: property.propertyName || `${property.city}, ${property.state}`,
      averageRent: 0,
      occupancyRate: 0,
      score: calculatePropertyScore(property)
    }));
  },
});

// Debug function to see sample data
export const getSampleProperties = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("multifamilyproperties").take(10);
    return properties.map(p => ({
      id: p._id,
      propertyName: p.propertyName,
      city: p.city,
      state: p.state,
      cityLower: p.city?.toLowerCase(),
      stateLower: p.state?.toLowerCase()
    }));
  },
});

// Get all unique cities and states for debugging
export const getUniqueLocations = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("multifamilyproperties").take(1000);
    const cities = [...new Set(properties.map(p => p.city))].sort();
    const states = [...new Set(properties.map(p => p.state))].sort();
    return { cities, states, totalProperties: properties.length };
  },
});

export const searchProperties = query({
  args: {
    searchQuery: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchQuery, city, state, limit = 50 } = args;

    // When a text search query is provided, use the full-text search index
    // This searches all 47K+ properties by propertyName
    if (searchQuery && searchQuery.length >= 2) {
      const filterFields: Record<string, string> = {};
      if (city) filterFields.city = city;
      if (state) filterFields.state = state;

      const results = await ctx.db
        .query("multifamilyproperties")
        .withSearchIndex("search_name", (q) => {
          let sq = q.search("propertyName", searchQuery);
          if (city) sq = sq.eq("city", city);
          if (state) sq = sq.eq("state", state);
          return sq;
        })
        .take(limit);

      return results;
    }

    // No text search - use regular indexed queries
    let properties;
    if (city && state) {
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_city_state", (q) =>
          q.eq("city", city).eq("state", state)
        )
        .take(limit);
    } else if (city) {
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_city", (q) =>
          q.eq("city", city)
        )
        .take(limit);
    } else if (state) {
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_state", (q) =>
          q.eq("state", state)
        )
        .take(limit);
    } else {
      properties = await ctx.db
        .query("multifamilyproperties")
        .take(limit);
    }

    return properties;
  },
});

export const searchPropertiesByLocation = query({
  args: { 
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { city, state, limit = 50 } = args;
    
    console.log("Search args:", { city, state, limit });
    
    let properties = [];
    
    // Use indexed queries to efficiently search the entire database
    if (city && state) {
      console.log("Searching by city and state:", city, state);
      
      // Try exact match first using index
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_city_state", (q) => 
          q.eq("city", city).eq("state", state)
        )
        .take(limit);
        
      console.log("Exact match results:", properties.length);
      
      // If no exact matches, try case-insensitive search
      if (properties.length === 0) {
        console.log("No exact matches, trying case-insensitive search");
        
        // Get all properties and filter in memory for case-insensitive matching
        const allProperties = await ctx.db.query("multifamilyproperties").take(10000);
        
        properties = allProperties.filter(property => {
          const propertyCity = property.city?.toLowerCase() || '';
          const propertyState = property.state?.toLowerCase() || '';
          const searchCity = city.toLowerCase();
          const searchState = state.toLowerCase();
          
          return propertyCity.includes(searchCity) && propertyState.includes(searchState);
        }).slice(0, limit);
        
        console.log("Case-insensitive match results:", properties.length);
      }
      
    } else if (city) {
      console.log("Searching by city only:", city);
      
      // Try exact match first
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_city", (q) => 
          q.eq("city", city)
        )
        .take(limit);
        
      console.log("Exact city match results:", properties.length);
      
      // If no exact matches, try case-insensitive search
      if (properties.length === 0) {
        console.log("No exact city matches, trying case-insensitive search");
        
        const allProperties = await ctx.db.query("multifamilyproperties").take(10000);
        
        properties = allProperties.filter(property => {
          const propertyCity = property.city?.toLowerCase() || '';
          const searchCity = city.toLowerCase();
          return propertyCity.includes(searchCity);
        }).slice(0, limit);
        
        console.log("Case-insensitive city match results:", properties.length);
      }
      
    } else if (state) {
      console.log("Searching by state only:", state);
      
      // Try exact match first
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_state", (q) => 
          q.eq("state", state)
        )
        .take(limit);
        
      console.log("Exact state match results:", properties.length);
      
      // If no exact matches, try case-insensitive search
      if (properties.length === 0) {
        console.log("No exact state matches, trying case-insensitive search");
        
        const allProperties = await ctx.db.query("multifamilyproperties").take(10000);
        
        properties = allProperties.filter(property => {
          const propertyState = property.state?.toLowerCase() || '';
          const searchState = state.toLowerCase();
          return propertyState.includes(searchState);
        }).slice(0, limit);
        
        console.log("Case-insensitive state match results:", properties.length);
      }
      
    } else {
      console.log("No search criteria, returning limited set");
      properties = await ctx.db.query("multifamilyproperties").take(limit);
      console.log("Default results:", properties.length);
    }
    
    console.log("Final results count:", properties.length);
    
    return properties.map((property: any) => ({
      ...property,
      displayName: property.propertyName || `${property.city}, ${property.state}`,
      averageRent: 0,
      occupancyRate: 0,
      score: calculatePropertyScore(property)
    }));
  },
});

// Helper function to calculate property score
function calculatePropertyScore(property: any): number {
  let score = 70; // Base score
  
  // Factor in occupancy rate (higher is better)
  if (property.occupancyRate) {
    score += (property.occupancyRate - 0.5) * 20; // ±10 points based on occupancy
  }
  
  // Factor in year built (newer is better, but not too new)
  if (property.yearBuilt) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - property.yearBuilt;
    if (age >= 0 && age <= 10) {
      score += 10; // New properties get bonus
    } else if (age > 10 && age <= 20) {
      score += 5; // Moderately new properties get small bonus
    } else if (age > 30) {
      score -= 5; // Very old properties get penalty
    }
  }
  
  // Factor in total units (larger properties might be better managed)
  if (property.totalUnits) {
    if (property.totalUnits >= 50 && property.totalUnits <= 200) {
      score += 5; // Medium-large properties get bonus
    } else if (property.totalUnits > 200) {
      score += 3; // Very large properties get small bonus
    }
  }
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper function to get a property by ID
export const getPropertyById = query({
  args: {
    propertyId: v.string(),
  },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();
    
    return property;
  },
});

// Helper function to get properties by location
export const getPropertiesByLocation = query({
  args: {
    city: v.string(),
    state: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { city, state, limit = 50 } = args;
    
    const properties = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_city_state", (q) => 
        q.eq("city", city).eq("state", state)
      )
      .take(limit);
    
    return properties;
  },
});

// Helper function to update property with Google data
export const updatePropertyWithGoogleData = mutation({
  args: {
    propertyId: v.string(),
    googleRating: v.optional(v.number()),
    googleImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();

    if (!property) {
      throw new Error(`Property with ID ${args.propertyId} not found`);
    }

    await ctx.db.patch(property._id, {
      googleRating: args.googleRating,
      googleImageUrl: args.googleImageUrl,
    });

    return { success: true };
  },
});

// Get distinct states - uses a sample to extract unique states efficiently
// (avoids reading all 47K+ docs which exceeds Convex limits)
export const getDistinctStates = query({
  args: {},
  handler: async (ctx) => {
    // US states list - since this is a national property database, use the standard set
    // and verify each has at least one property via the index
    const US_STATES = [
      "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
      "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
      "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
      "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
      "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
    ];
    const statesWithProperties: string[] = [];
    for (const state of US_STATES) {
      const property = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_state", (q) => q.eq("state", state))
        .first();
      if (property) statesWithProperties.push(state);
    }
    return statesWithProperties;
  },
});

// Get cities for a given state (capped read to stay within Convex limits)
export const getCitiesByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const properties = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .take(8000);
    const cities = [...new Set(properties.map((p) => p.city))].sort();
    return cities;
  },
});

// Update PM contact info on a property
export const updatePMContact = mutation({
  args: {
    propertyId: v.id("multifamilyproperties"),
    pmCompanyName: v.optional(v.string()),
    pmWebsite: v.optional(v.string()),
    pmEmail: v.optional(v.string()),
    pmPhone: v.optional(v.string()),
    pmContactName: v.optional(v.string()),
    pmContactTitle: v.optional(v.string()),
    pmNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { propertyId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) patch[key] = value;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(propertyId, patch);
    }
    return { success: true };
  },
});

// Get property with associated market data
export const getPropertyWithMarketData = query({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    const property = await ctx.db
      .query("multifamilyproperties")
      .withIndex("by_propertyId", (q) => q.eq("propertyId", args.propertyId))
      .first();
    if (!property) return null;

    const rentData = await ctx.db
      .query("rentData")
      .withIndex("by_propertyId_month", (q) => q.eq("propertyId", args.propertyId))
      .collect();
    const occupancyData = await ctx.db
      .query("occupancyData")
      .withIndex("by_propertyId_month", (q) => q.eq("propertyId", args.propertyId))
      .collect();
    const concessionData = await ctx.db
      .query("concessionData")
      .withIndex("by_propertyId_month", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    return { ...property, rentData, occupancyData, concessionData };
  },
});

// Admin: Create a property manually (for smaller properties not in national DB)
export const createProperty = mutation({
  args: {
    propertyName: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    totalUnits: v.number(),
    yearBuilt: v.number(),
    averageUnitSize: v.number(),
    pmCompanyName: v.optional(v.string()),
    pmEmail: v.optional(v.string()),
    pmPhone: v.optional(v.string()),
    pmContactName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const propertyId = `MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const id = await ctx.db.insert("multifamilyproperties", {
      propertyId,
      propertyName: args.propertyName,
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      totalUnits: args.totalUnits,
      yearBuilt: args.yearBuilt,
      averageUnitSize: args.averageUnitSize,
      pmCompanyName: args.pmCompanyName,
      pmEmail: args.pmEmail,
      pmPhone: args.pmPhone,
      pmContactName: args.pmContactName,
      createdAt: Date.now(),
    });
    return { id, propertyId };
  },
});
