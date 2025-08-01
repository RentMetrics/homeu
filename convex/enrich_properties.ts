import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Google Places API integration for Convex
async function searchPlaceByAddress(address: string): Promise<any> {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    console.warn('Google Places API key not found');
    return null;
  }

  try {
    // First, search for the place
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.results && searchData.results.length > 0) {
      const place = searchData.results[0];
      const placeId = place.place_id;

      // Get detailed information including photos
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,photos,name,formatted_address&key=${GOOGLE_API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.result) {
        return {
          rating: detailsData.result.rating,
          photos: detailsData.result.photos,
          name: detailsData.result.name,
          formatted_address: detailsData.result.formatted_address,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching Google Places data:', error);
    return null;
  }
}

function getGooglePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    return '';
  }
  
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

export const enrichPropertyWithGoogleData = mutation({
  args: { propertyId: v.string() },
  handler: async (ctx, args) => {
    // Get the property
    const property = await ctx.db
      .query("multifamilyproperties")
      .filter((q) => q.eq(q.field("propertyId"), args.propertyId))
      .first();

    if (!property) {
      throw new Error("Property not found");
    }

    // Build the address for Google Places search
    const address = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
    
    // Get Google Places data
    const googleData = await searchPlaceByAddress(address);
    
    let enrichedData: any = {
      homeuScore: Math.floor(Math.random() * 20) + 80, // Random score between 80-100
      scoreFactors: [
        "Great location",
        "Modern amenities",
        "Responsive management",
        "Good value for money"
      ],
      amenities: [
        "Pool",
        "Gym",
        "Parking",
        "Laundry",
        "Pet friendly"
      ]
    };

    // Add Google data if available
    if (googleData) {
      enrichedData.googleRating = googleData.rating;
      
      if (googleData.photos && googleData.photos.length > 0) {
        enrichedData.googleImageUrl = getGooglePhotoUrl(googleData.photos[0].photo_reference);
      }
    }

    // Update the property with enriched data
    await ctx.db.patch(property._id, enrichedData);

    return {
      propertyId: property.propertyId,
      success: true,
      googleRating: enrichedData.googleRating,
      hasImage: !!enrichedData.googleImageUrl
    };
  },
});

// Get properties in batches for enrichment
export const getPropertiesForEnrichment = query({
  args: { 
    offset: v.number(), 
    limit: v.number() 
  },
  handler: async (ctx, args) => {
    const properties = await ctx.db.query("multifamilyproperties").collect();
    
    // Return only the requested slice
    return properties.slice(args.offset, args.offset + args.limit);
  },
});

// Get total count of properties for pagination
export const getTotalPropertiesCount = query({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("multifamilyproperties").collect();
    return properties.length;
  },
});

// Enrich a batch of properties
export const enrichPropertiesBatch = mutation({
  args: { 
    propertyIds: v.array(v.string()) 
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const propertyId of args.propertyIds) {
      try {
        const property = await ctx.db
          .query("multifamilyproperties")
          .filter((q) => q.eq(q.field("propertyId"), propertyId))
          .first();

        if (!property) {
          results.push({ propertyId, success: false, error: "Property not found" });
          continue;
        }

        // Build the address for Google Places search
        const address = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
        
        // Get Google Places data
        const googleData = await searchPlaceByAddress(address);
        
        let enrichedData: any = {
          homeuScore: Math.floor(Math.random() * 20) + 80,
          scoreFactors: [
            "Great location",
            "Modern amenities",
            "Responsive management",
            "Good value for money"
          ],
          amenities: [
            "Pool",
            "Gym",
            "Parking",
            "Laundry",
            "Pet friendly"
          ]
        };

        // Add Google data if available
        if (googleData) {
          enrichedData.googleRating = googleData.rating;
          
          if (googleData.photos && googleData.photos.length > 0) {
            enrichedData.googleImageUrl = getGooglePhotoUrl(googleData.photos[0].photo_reference);
          }
        }

        await ctx.db.patch(property._id, enrichedData);
        results.push({ 
          propertyId, 
          success: true,
          googleRating: enrichedData.googleRating,
          hasImage: !!enrichedData.googleImageUrl
        });
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        results.push({ propertyId, success: false, error: errorMessage });
      }
    }

    return results;
  },
});

// Simple enrichment function that only processes a small batch
export const enrichAllProperties = mutation({
  args: {},
  handler: async (ctx) => {
    const properties = await ctx.db.query("multifamilyproperties").collect();
    
    // Only process the first 10 properties to avoid timeouts
    const propertiesToProcess = properties.slice(0, 10);
    const results = [];
    
    for (const property of propertiesToProcess) {
      try {
        // Build the address for Google Places search
        const address = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
        
        // Get Google Places data
        const googleData = await searchPlaceByAddress(address);
        
        let enrichedData: any = {
          homeuScore: Math.floor(Math.random() * 20) + 80,
          scoreFactors: [
            "Great location",
            "Modern amenities",
            "Responsive management",
            "Good value for money"
          ],
          amenities: [
            "Pool",
            "Gym",
            "Parking",
            "Laundry",
            "Pet friendly"
          ]
        };

        // Add Google data if available
        if (googleData) {
          enrichedData.googleRating = googleData.rating;
          
          if (googleData.photos && googleData.photos.length > 0) {
            enrichedData.googleImageUrl = getGooglePhotoUrl(googleData.photos[0].photo_reference);
          }
        }

        await ctx.db.patch(property._id, enrichedData);
        results.push({ 
          propertyId: property.propertyId, 
          success: true,
          googleRating: enrichedData.googleRating,
          hasImage: !!enrichedData.googleImageUrl
        });
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        results.push({ propertyId: property.propertyId, success: false, error: errorMessage });
      }
    }

    return {
      processed: results.length,
      total: properties.length,
      results: results
    };
  },
}); 