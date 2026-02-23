import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "Google API key not configured" }, { status: 500 });
  }

  try {
    // Use Google Places API (New) searchNearby to find the locality
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.formattedAddress,places.addressComponents",
      },
      body: JSON.stringify({
        includedTypes: ["locality"],
        maxResultCount: 1,
        locationRestriction: {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: 10000.0,
          },
        },
      }),
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      const components = data.places?.[0]?.addressComponents;

      if (components) {
        let city = "";
        let state = "";

        for (const comp of components) {
          if (comp.types?.includes("locality")) {
            city = comp.longText || comp.shortText || "";
          }
          if (comp.types?.includes("administrative_area_level_1")) {
            state = comp.shortText || "";
          }
        }

        if (city && state) {
          return NextResponse.json({ city, state });
        }
      }
    }

    // Fallback: try legacy Geocoding API (in case it's enabled)
    const geocodeRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=locality|administrative_area_level_1&key=${GOOGLE_API_KEY}`
    );
    const geocodeData = await geocodeRes.json();

    if (geocodeData.results && geocodeData.results.length > 0) {
      const components = geocodeData.results[0].address_components;
      let city = "";
      let state = "";

      for (const component of components) {
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          state = component.short_name;
        }
      }

      return NextResponse.json({ city, state });
    }

    return NextResponse.json({ city: "", state: "" });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
