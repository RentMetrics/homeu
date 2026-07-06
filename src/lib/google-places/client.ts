/**
 * Google Places API Client
 *
 * Handles all interactions with Google Places API for property enrichment
 */

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: PlacePhoto[];
}

export interface PlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: PlacePhoto[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export class GooglePlacesClient {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Places API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search for a place using text query (property name + city)
   * Best for apartment complexes
   */
  async textSearch(query: string): Promise<PlaceSearchResult[]> {
    const url = new URL(`${this.baseUrl}/place/textsearch/json`);
    url.searchParams.set('query', query);
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    return data.results || [];
  }

  /**
   * Get detailed information about a place using place_id
   * Returns photos and other details
   */
  async getPlaceDetails(placeId: string, fields?: string[]): Promise<PlaceDetails | null> {
    const url = new URL(`${this.baseUrl}/place/details/json`);
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', fields?.join(',') || 'place_id,name,formatted_address,rating,user_ratings_total,photos,geometry');
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS' || data.status === 'NOT_FOUND') {
        return null;
      }
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    return data.result;
  }

  /**
   * Get the URL for a place photo
   * Note: This returns a URL, not the actual image data
   * The image can be fetched and cached separately
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 1600): string {
    const url = new URL(`${this.baseUrl}/place/photo`);
    url.searchParams.set('maxwidth', maxWidth.toString());
    url.searchParams.set('photo_reference', photoReference);
    url.searchParams.set('key', this.apiKey);
    return url.toString();
  }

  /**
   * Search for a property by address or name
   * Returns the first matching result with photos
   */
  async findProperty(propertyName: string, city: string, state: string): Promise<PlaceDetails | null> {
    // Try with full property name first
    const query = `${propertyName}, ${city}, ${state}`;
    console.log(`Searching for: ${query}`);

    const searchResults = await this.textSearch(query);

    if (searchResults.length === 0) {
      console.log(`No results found for: ${query}`);
      return null;
    }

    // Get detailed info for the first result
    const firstResult = searchResults[0];
    console.log(`Found place_id: ${firstResult.place_id}`);

    const details = await this.getPlaceDetails(firstResult.place_id);
    return details;
  }

  /**
   * Download photo as binary data
   * Use this if you want to upload to your own storage (S3, etc.)
   */
  async downloadPhoto(photoReference: string, maxWidth: number = 1600): Promise<ArrayBuffer> {
    const url = this.getPhotoUrl(photoReference, maxWidth);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download photo: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  }
}

/**
 * Helper function to create a Google Places client
 * Uses environment variable for API key
 */
export function createGooglePlacesClient(): GooglePlacesClient {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY environment variable is not set');
  }

  return new GooglePlacesClient(apiKey);
}

/**
 * Utility function to build search query
 */
export function buildPropertySearchQuery(
  propertyName: string,
  address: string,
  city: string,
  state: string
): string {
  // Try property name + city first (most accurate for apartment complexes)
  return `${propertyName} ${city} ${state}`;
}

/**
 * Utility to extract best photo from results
 */
export function getBestPhoto(photos: PlacePhoto[] | undefined): PlacePhoto | null {
  if (!photos || photos.length === 0) {
    return null;
  }

  // Sort by size (larger is usually better quality)
  const sorted = [...photos].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });

  return sorted[0];
}
