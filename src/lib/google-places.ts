// Google Places API integration
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

export interface GooglePlaceData {
  rating?: number;
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  name: string;
  formatted_address: string;
}

export async function searchPlaceByAddress(address: string): Promise<GooglePlaceData | null> {
  if (!GOOGLE_API_KEY) {
    console.warn('Google API key not found');
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

export function getGooglePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  if (!GOOGLE_API_KEY) {
    return '';
  }
  
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

export async function enrichPropertyWithGoogleData(property: any) {
  const address = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
  const googleData = await searchPlaceByAddress(address);

  if (googleData) {
    return {
      ...property,
      googleRating: googleData.rating,
      googleImageUrl: googleData.photos && googleData.photos.length > 0 
        ? getGooglePhotoUrl(googleData.photos[0].photo_reference)
        : undefined,
    };
  }

  return property;
} 