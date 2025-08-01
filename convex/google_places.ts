import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Function to enrich a single property with Google Places data
export const enrichPropertyWithGoogleData = action({
  args: {
    propertyId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the property from the database
    const property = await ctx.runQuery("multifamilyproperties:getPropertyById" as any, {
      propertyId: args.propertyId,
    });

    if (!property) {
      throw new Error(`Property with ID ${args.propertyId} not found`);
    }

    try {
      // Try multiple search strategies for better results
      const searchStrategies = [
        // Strategy 1: Property name + city + state (most common format)
        `${property.propertyName} ${property.city} ${property.state}`,
        // Strategy 2: Property name + address + city + state
        `${property.propertyName} ${property.address} ${property.city} ${property.state}`,
        // Strategy 3: Address + city + state
        `${property.address} ${property.city} ${property.state}`,
        // Strategy 4: Property name + "apartments" + city + state
        `${property.propertyName} apartments ${property.city} ${property.state}`,
        // Strategy 5: Property name + "apartment" + city + state
        `${property.propertyName} apartment ${property.city} ${property.state}`,
        // Strategy 6: Just property name + city
        `${property.propertyName} ${property.city}`,
        // Strategy 7: Property name + "apartments" + city
        `${property.propertyName} apartments ${property.city}`,
        // Strategy 8: Just property name (fallback)
        property.propertyName,
      ];

      let place = null;
      let imageUrl = null;
      let successfulQuery = "";

      // Try each search strategy until we find results
      for (const searchQuery of searchStrategies) {
        console.log(`Trying search query: "${searchQuery}" for property ${args.propertyId}`);
        
        const placesResponse = await fetch(
          `https://places.googleapis.com/v1/places:searchText`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': process.env.CONVEX_GOOGLE_PLACES_API_KEY!,
              'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.photos'
            },
            body: JSON.stringify({
              textQuery: searchQuery
            })
          }
        );

        if (!placesResponse.ok) {
          console.log(`Google Places API error for query "${searchQuery}": ${placesResponse.statusText}`);
          continue;
        }

        const placesData = await placesResponse.json();

        if (placesData.places && placesData.places.length > 0) {
          place = placesData.places[0];
          successfulQuery = searchQuery;
          console.log(`Found place: ${place.displayName?.text || 'Unknown'} for query "${searchQuery}"`);
          
          // Get the first photo if available
          if (place.photos && place.photos.length > 0) {
            const photo = place.photos[0];
            imageUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&key=${process.env.CONVEX_GOOGLE_PLACES_API_KEY}`;
          }
          break; // Found a result, stop trying other strategies
        } else {
          console.log(`No results for query "${searchQuery}"`);
        }

        // Add a small delay between API calls to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (place) {
        // Update the property with Google data
        await ctx.runMutation("multifamilyproperties:updatePropertyWithGoogleData" as any, {
          propertyId: args.propertyId,
          googleRating: place.rating || undefined,
          googleImageUrl: imageUrl || undefined,
        });

        return {
          success: true,
          propertyId: args.propertyId,
          googleRating: place.rating,
          googleImageUrl: imageUrl,
          placeName: place.name,
          successfulQuery,
        };
      } else {
        console.log(`No Google Places results found for property: ${args.propertyId} after trying all strategies`);
        return {
          success: false,
          propertyId: args.propertyId,
          message: "No Google Places results found after trying all search strategies",
          triedQueries: searchStrategies,
        };
      }
    } catch (error) {
      console.error(`Error enriching property ${args.propertyId}:`, error);
      return {
        success: false,
        propertyId: args.propertyId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

// Function to enrich all properties in a specific city/state
export const enrichPropertiesByLocation = action({
  args: {
    city: v.string(),
    state: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { city, state, limit = 50 } = args;
    
    console.log(`Starting enrichment for ${city}, ${state} (limit: ${limit})`);
    
    // Get properties for the specified location
    const properties = await ctx.runQuery("multifamilyproperties:getPropertiesByLocation" as any, {
      city,
      state,
      limit,
    });

    console.log(`Found ${properties.length} properties to enrich`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process properties in batches to avoid rate limits
    for (const property of properties) {
      try {
        // Skip if already has real Google data (not placeholder)
        if (property.googleImageUrl && !property.googleImageUrl.includes('picsum.photos')) {
          console.log(`Property ${property.propertyId} already has real Google data, skipping`);
          results.push({
            propertyId: property.propertyId,
            status: "skipped",
            reason: "Already has real Google data",
          });
          continue;
        }

        // Add a small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

        const result = await ctx.runAction("google_places:enrichPropertyWithGoogleData" as any, {
          propertyId: property.propertyId,
        });

        if (result.success) {
          successCount++;
          console.log(`Successfully enriched property: ${property.propertyId}`);
        } else {
          errorCount++;
          console.log(`Failed to enrich property: ${property.propertyId} - ${result.message || result.error}`);
        }

        results.push({
          propertyId: property.propertyId,
          status: result.success ? "success" : "error",
          result,
        });

      } catch (error) {
        errorCount++;
        console.error(`Error processing property ${property.propertyId}:`, error);
        results.push({
          propertyId: property.propertyId,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log(`Enrichment complete. Success: ${successCount}, Errors: ${errorCount}`);

    return {
      totalProcessed: properties.length,
      successCount,
      errorCount,
      results,
    };
  },
});

// Function to get properties that need enrichment (no Google data)
export const getPropertiesNeedingEnrichment = query({
  args: {
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { city, state, limit = 100 } = args;
    
    let properties;
    
    if (city && state) {
      properties = await ctx.db
        .query("multifamilyproperties")
        .withIndex("by_city_state", (q) => 
          q.eq("city", city).eq("state", state)
        )
        .take(limit);
    } else {
      properties = await ctx.db.query("multifamilyproperties").take(limit);
    }

    // Filter properties that don't have Google image data or have placeholder URLs
    const propertiesNeedingEnrichment = properties.filter(
      (property) => !property.googleImageUrl || property.googleImageUrl.includes('picsum.photos')
    );

    return {
      total: properties.length,
      needEnrichment: propertiesNeedingEnrichment.length,
      properties: propertiesNeedingEnrichment.map(p => ({
        propertyId: p.propertyId,
        propertyName: p.propertyName,
        address: p.address,
        city: p.city,
        state: p.state,
        hasGoogleData: !!p.googleImageUrl,
      })),
    };
  },
}); 

// Test function to see property data and test Google Places API
export const testGooglePlacesSearch = action({
  args: {
    propertyId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the property from the database
    const property = await ctx.runQuery("multifamilyproperties:getPropertyById" as any, {
      propertyId: args.propertyId,
    });

    if (!property) {
      throw new Error(`Property with ID ${args.propertyId} not found`);
    }

    console.log("Property data:", {
      propertyId: property.propertyId,
      propertyName: property.propertyName,
      address: property.address,
      city: property.city,
      state: property.state,
    });

    // Actually enrich the property using the main function
    const enrichmentResult = await ctx.runAction("google_places:enrichPropertyWithGoogleData" as any, {
      propertyId: args.propertyId,
    });

    // Get the updated property to see the results
    const updatedProperty = await ctx.runQuery("multifamilyproperties:getPropertyById" as any, {
      propertyId: args.propertyId,
    });

    return {
      property: {
        propertyId: property.propertyId,
        propertyName: property.propertyName,
        address: property.address,
        city: property.city,
        state: property.state,
      },
      enrichmentResult,
      updatedProperty: {
        propertyId: updatedProperty.propertyId,
        propertyName: updatedProperty.propertyName,
        googleRating: updatedProperty.googleRating,
        googleImageUrl: updatedProperty.googleImageUrl,
      },
    };
  },
}); 

// Simple test function to verify Google Places API is working
export const testGooglePlacesAPI = action({
  args: {},
  handler: async (ctx, args) => {
    try {
      // Test with a known property that should exist in Google Places
      const testQueries = [
        "College Towers Kent Ohio",
        "Kent State University",
        "Kent Ohio apartments",
        "College Towers apartments Kent",
        "1800 Rhodes Rd Kent OH",
        "College Towers 1800 Rhodes Rd",
      ];

      const results = [];

      for (const query of testQueries) {
        console.log(`Testing query: "${query}"`);
        
        const placesResponse = await fetch(
          `https://places.googleapis.com/v1/places:searchText`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': process.env.CONVEX_GOOGLE_PLACES_API_KEY!,
              'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.photos'
            },
            body: JSON.stringify({
              textQuery: query
            })
          }
        );

        if (!placesResponse.ok) {
          results.push({
            query,
            error: `API Error: ${placesResponse.statusText}`,
            status: placesResponse.status,
          });
          continue;
        }

        const placesData = await placesResponse.json();
        
        if (placesData.places && placesData.places.length > 0) {
          const firstResult = placesData.places[0];
          results.push({
            query,
            status: "success",
            placeName: firstResult.displayName?.text || 'Unknown',
            address: firstResult.formattedAddress || 'Unknown',
            rating: firstResult.rating,
            hasPhotos: firstResult.photos && firstResult.photos.length > 0,
            totalResults: placesData.places.length,
          });
        } else {
          results.push({
            query,
            status: "no_results",
            apiStatus: placesData.error?.status || 'UNKNOWN',
            errorMessage: placesData.error?.message || 'No results found',
          });
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return {
        success: true,
        results,
        apiKeyConfigured: !!process.env.CONVEX_GOOGLE_PLACES_API_KEY,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        apiKeyConfigured: !!process.env.CONVEX_GOOGLE_PLACES_API_KEY,
      };
    }
  },
}); 

// Automated enrichment for all markets
export const enrichAllMarkets = action({
  args: {
    batchSize: v.optional(v.number()),
    delayBetweenBatches: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { batchSize = 5, delayBetweenBatches = 1000 } = args;
    
    console.log(`Starting automated enrichment for all markets (batch size: ${batchSize}, delay: ${delayBetweenBatches}ms)`);
    
    // Get all unique locations
    const uniqueLocations = await ctx.runQuery("multifamilyproperties:getUniqueLocations" as any);
    
    if (!uniqueLocations || !uniqueLocations.cities) {
      throw new Error("Failed to get unique locations");
    }
    
    const cities = uniqueLocations.cities;
    console.log(`Found ${cities.length} cities to process`);
    
    const results = [];
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    
    // Process cities in batches
    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cities.length / batchSize)}: ${batch.join(', ')}`);
      
      for (const city of batch) {
        try {
          // Get properties for this city that need enrichment
          const propertiesNeedingEnrichment = await ctx.runQuery("google_places:getPropertiesNeedingEnrichment" as any, {
            city,
            limit: 50
          });
          
          if (propertiesNeedingEnrichment.needEnrichment > 0) {
            console.log(`Enriching ${propertiesNeedingEnrichment.needEnrichment} properties in ${city}`);
            
            // Enrich properties for this city
            const enrichmentResult = await ctx.runAction("google_places:enrichPropertiesByLocation" as any, {
              city,
              limit: 50
            });
            
            results.push({
              city,
              success: true,
              propertiesProcessed: enrichmentResult.totalProcessed,
              successCount: enrichmentResult.successCount,
              errorCount: enrichmentResult.errorCount,
              skippedCount: enrichmentResult.totalProcessed - enrichmentResult.successCount - enrichmentResult.errorCount
            });
            
            totalSuccess += enrichmentResult.successCount;
            totalErrors += enrichmentResult.errorCount;
            totalSkipped += (enrichmentResult.totalProcessed - enrichmentResult.successCount - enrichmentResult.errorCount);
            
            console.log(`✅ ${city}: ${enrichmentResult.successCount} enriched, ${enrichmentResult.errorCount} errors, ${enrichmentResult.totalProcessed - enrichmentResult.successCount - enrichmentResult.errorCount} skipped`);
          } else {
            console.log(`⏭️  ${city}: No properties need enrichment`);
            results.push({
              city,
              success: true,
              propertiesProcessed: 0,
              successCount: 0,
              errorCount: 0,
              skippedCount: 0,
              note: "No properties need enrichment"
            });
            totalSkipped += propertiesNeedingEnrichment.total;
          }
          
          // Add delay between cities to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Error processing ${city}:`, error);
          results.push({
            city,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
          totalErrors++;
        }
      }
      
      // Add delay between batches
      if (i + batchSize < cities.length) {
        console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    console.log(`🎉 Automated enrichment complete!`);
    console.log(`Total Success: ${totalSuccess}, Total Errors: ${totalErrors}, Total Skipped: ${totalSkipped}`);
    
    return {
      totalCities: cities.length,
      totalSuccess,
      totalErrors,
      totalSkipped,
      results
    };
  },
});

// Get enrichment status across all markets
export const getEnrichmentStatus = query({
  args: {},
  handler: async (ctx, args) => {
    const uniqueLocations = await ctx.db.query("multifamilyproperties").take(1000);
    
    // Group properties by city
    const cityStats: Record<string, any> = {};
    const stateStats: Record<string, any> = {};
    
    for (const property of uniqueLocations) {
      const city = property.city;
      const state = property.state;
      
      // Initialize city stats
      if (!cityStats[city]) {
        cityStats[city] = {
          total: 0,
          withGoogleData: 0,
          withRealGoogleData: 0,
          withPlaceholderData: 0,
          withoutData: 0
        };
      }
      
      // Initialize state stats
      if (!stateStats[state]) {
        stateStats[state] = {
          total: 0,
          withGoogleData: 0,
          withRealGoogleData: 0,
          withPlaceholderData: 0,
          withoutData: 0
        };
      }
      
      // Update counts
      cityStats[city].total++;
      stateStats[state].total++;
      
      if (property.googleImageUrl) {
        cityStats[city].withGoogleData++;
        stateStats[state].withGoogleData++;
        
        if (property.googleImageUrl.includes('picsum.photos')) {
          cityStats[city].withPlaceholderData++;
          stateStats[state].withPlaceholderData++;
        } else {
          cityStats[city].withRealGoogleData++;
          stateStats[state].withRealGoogleData++;
        }
      } else {
        cityStats[city].withoutData++;
        stateStats[state].withoutData++;
      }
    }
    
    // Calculate overall stats
    const totalProperties = uniqueLocations.length;
    const totalWithGoogleData = uniqueLocations.filter(p => p.googleImageUrl).length;
    const totalWithRealGoogleData = uniqueLocations.filter(p => p.googleImageUrl && !p.googleImageUrl.includes('picsum.photos')).length;
    const totalWithPlaceholderData = uniqueLocations.filter(p => p.googleImageUrl && p.googleImageUrl.includes('picsum.photos')).length;
    const totalWithoutData = uniqueLocations.filter(p => !p.googleImageUrl).length;
    
    return {
      overall: {
        totalProperties,
        totalWithGoogleData,
        totalWithRealGoogleData,
        totalWithPlaceholderData,
        totalWithoutData,
        enrichmentRate: Math.round((totalWithRealGoogleData / totalProperties) * 100)
      },
      byCity: cityStats,
      byState: stateStats
    };
  },
}); 