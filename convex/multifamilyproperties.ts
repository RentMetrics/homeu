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
    
    let properties;
    
    // Use indexed queries when possible
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
      // If no specific filters, get a limited set
      properties = await ctx.db
        .query("multifamilyproperties")
        .take(limit);
    }

    // Apply search filter in memory if needed
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      properties = properties.filter(property =>
        property.propertyName.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        property.state.toLowerCase().includes(query)
      );
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
