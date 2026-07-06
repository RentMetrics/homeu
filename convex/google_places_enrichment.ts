/**
 * Google Places Enrichment Actions
 *
 * Fetches property photos and data from Google Places API
 * Run these as Convex actions (server-side with Node.js APIs)
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

// Google Places API types
interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: PlacePhoto[];
}

interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  photos?: PlacePhoto[];
}

/**
 * Search Google Places for a property using the NEW Places API
 */
async function searchGooglePlaces(
  propertyName: string,
  city: string,
  state: string,
  apiKey: string
): Promise<PlaceSearchResult[]> {
  const query = `${propertyName} ${city} ${state}`;
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'en',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // Convert new API format to old format for compatibility
  const results = (data.places || []).map((place: any) => ({
    place_id: place.id.replace('places/', ''), // Remove 'places/' prefix
    name: place.displayName?.text || '',
    formatted_address: place.formattedAddress || '',
    rating: place.rating,
    photos: place.photos?.map((photo: any) => ({
      photo_reference: photo.name.replace('places/', '').replace('/photos/', '_'),
      height: photo.heightPx || 400,
      width: photo.widthPx || 400,
    })) || [],
  }));

  return results;
}

/**
 * Get place details including photos using the NEW Places API
 */
async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails | null> {
  // Ensure placeId has the 'places/' prefix for new API
  const formattedPlaceId = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
  const url = `https://places.googleapis.com/v1/${formattedPlaceId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,photos',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorText = await response.text();
    throw new Error(`Google Places API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // Convert new API format to old format for compatibility
  return {
    place_id: data.id?.replace('places/', '') || placeId,
    name: data.displayName?.text || '',
    formatted_address: data.formattedAddress || '',
    rating: data.rating,
    user_ratings_total: data.userRatingCount,
    photos: data.photos?.map((photo: any) => ({
      photo_reference: photo.name,
      height: photo.heightPx || 400,
      width: photo.widthPx || 400,
      html_attributions: [],
    })) || [],
  };
}

/**
 * Generate photo URL from photo reference using the NEW Places API
 */
function getPhotoUrl(photoReference: string, maxWidth: number, apiKey: string): string {
  // New API format: https://places.googleapis.com/v1/{photoName}/media
  // photoReference should be in format: places/{place_id}/photos/{photo_id}
  const photoName = photoReference.startsWith('places/') ? photoReference : `places/${photoReference}`;
  return `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=${maxWidth}`;
}

// Explicit result types so actions that call each other via ctx.runAction/ctx.runQuery
// don't hit circular type inference (TS7022/TS7023)
interface EnrichSingleResult {
  success: boolean;
  message: string;
  skipped?: boolean;
  propertyId?: string;
  propertyName?: string;
  placeId?: string;
  photosFound?: number;
  rating?: number;
}

interface EnrichBatchResults {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  details: any[];
}

/**
 * Enrich a single property with Google Places data
 */
export const enrichSingleProperty = action({
  args: {
    propertyId: v.string(),
    force: v.optional(v.boolean()), // Force re-enrichment even if already has data
  },
  handler: async (ctx, args): Promise<EnrichSingleResult> => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set');
    }

    // Get property from database
    const property = await ctx.runQuery(api.multifamilyproperties.getPropertyById, {
      propertyId: args.propertyId
    });

    if (!property) {
      return { success: false, message: 'Property not found' };
    }

    // Skip if already enriched (unless force = true)
    if (property.googlePlaceId && !args.force) {
      return {
        success: true,
        message: 'Property already enriched',
        skipped: true,
      };
    }

    console.log(`Enriching property: ${property.propertyName} in ${property.city}, ${property.state}`);

    try {
      // Search for the property
      const searchResults = await searchGooglePlaces(
        property.propertyName,
        property.city,
        property.state,
        apiKey
      );

      if (searchResults.length === 0) {
        console.log(`No Google Places results found for: ${property.propertyName}`);
        return {
          success: false,
          message: 'No results found on Google Places',
          propertyId: property.propertyId,
          propertyName: property.propertyName,
        };
      }

      const firstResult = searchResults[0];
      console.log(`Found place_id: ${firstResult.place_id}`);

      // Get detailed information
      const details = await getPlaceDetails(firstResult.place_id, apiKey);

      if (!details) {
        return {
          success: false,
          message: 'Could not retrieve place details',
          propertyId: property.propertyId,
        };
      }

      // Extract photo references
      const photos = details.photos?.slice(0, 5).map(photo => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })) || [];

      // Get the primary image URL (first photo)
      const primaryImageUrl = photos.length > 0
        ? getPhotoUrl(photos[0].photoReference, 1600, apiKey)
        : undefined;

      // Update property in database with the full Google Places result so
      // re-enrichment skipping (googlePlaceId) and photo galleries work
      await ctx.runMutation(api.multifamilyproperties.updatePropertyWithGoogleData, {
        propertyId: property.propertyId,
        googleRating: details.rating,
        googleImageUrl: primaryImageUrl,
        googlePlaceId: details.place_id,
        googleUserRatingsTotal: details.user_ratings_total,
        googleFormattedAddress: details.formatted_address,
        googlePhotos: photos,
        googleAttributionRequired: photos.length > 0,
        googleLastVerified: Date.now(),
      });

      console.log(`Successfully enriched: ${property.propertyName} with ${photos.length} photos`);

      return {
        success: true,
        message: 'Property enriched successfully',
        propertyId: property.propertyId,
        propertyName: property.propertyName,
        placeId: details.place_id,
        photosFound: photos.length,
        rating: details.rating,
      };

    } catch (error) {
      console.error(`Error enriching property ${property.propertyId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        propertyId: property.propertyId,
        propertyName: property.propertyName,
      };
    }
  },
});

/**
 * Enrich multiple properties in a city/state
 */
export const enrichPropertiesByLocation = action({
  args: {
    city: v.string(),
    state: v.string(),
    limit: v.optional(v.number()),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<EnrichBatchResults> => {
    const limit = args.limit || 50;

    // Get properties that need enrichment
    const properties = await ctx.runQuery(api.multifamilyproperties.getPropertiesByLocation, {
      city: args.city,
      state: args.state,
      limit: limit,
    });

    // Filter to only properties that need enrichment (unless force = true)
    const toEnrich = args.force
      ? properties
      : properties.filter(p => !p.googlePlaceId);

    console.log(`Found ${toEnrich.length} properties to enrich in ${args.city}, ${args.state}`);

    const results = {
      total: toEnrich.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    // Enrich each property (with rate limiting to avoid API quota issues)
    for (const property of toEnrich) {
      const result = await ctx.runAction(api.google_places_enrichment.enrichSingleProperty, {
        propertyId: property.propertyId,
        force: args.force,
      });

      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.successful++;
        }
      } else {
        results.failed++;
      }

      results.details.push(result);

      // Rate limiting: wait 100ms between requests to avoid hitting API limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  },
});

/**
 * Enrich all properties (use with caution - can be expensive!)
 */
export const enrichAllProperties = action({
  args: {
    maxProperties: v.optional(v.number()),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<EnrichBatchResults> => {
    const maxProperties = args.maxProperties || 100;

    console.log(`Starting enrichment for up to ${maxProperties} properties`);

    // Get all properties that need enrichment
    const allProperties = await ctx.runQuery(api.multifamilyproperties.getAllProperties, {
      limit: maxProperties,
    });

    const toEnrich = args.force
      ? allProperties
      : allProperties.filter(p => !p.googlePlaceId);

    console.log(`Found ${toEnrich.length} properties needing enrichment`);

    const results = {
      total: toEnrich.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    for (const property of toEnrich) {
      const result = await ctx.runAction(api.google_places_enrichment.enrichSingleProperty, {
        propertyId: property.propertyId,
        force: args.force,
      });

      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.successful++;
        }
      } else {
        results.failed++;
      }

      results.details.push(result);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  },
});

/**
 * Get properties that need enrichment
 */
export const getPropertiesNeedingEnrichment = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    total: number;
    needingEnrichment: number;
    percentage: string;
    properties: { propertyId: string; propertyName: string; city: string; state: string }[];
  }> => {
    const limit = args.limit || 100;

    const properties = await ctx.runQuery(api.multifamilyproperties.getAllProperties, {
      limit: limit,
    });

    const needingEnrichment = properties.filter(p => !p.googlePlaceId);

    return {
      total: properties.length,
      needingEnrichment: needingEnrichment.length,
      percentage: (needingEnrichment.length / properties.length * 100).toFixed(1),
      properties: needingEnrichment.map(p => ({
        propertyId: p.propertyId,
        propertyName: p.propertyName,
        city: p.city,
        state: p.state,
      })),
    };
  },
});
