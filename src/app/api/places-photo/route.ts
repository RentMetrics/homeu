import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const photoRef = searchParams.get("ref");
  const photoName = searchParams.get("name"); // new API: places/{id}/photos/{ref}
  const query = searchParams.get("query");
  const maxWidth = searchParams.get("maxwidth") || "600";

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  // Helper: fetch photo by Places API (New) resource name
  async function fetchPhotoByName(name: string) {
    const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  // Helper: fetch photo by legacy photo_reference
  async function fetchPhotoByRef(ref: string) {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  try {
    // Option 1: New API photo name (e.g., places/ChIJ.../photos/ATCDN...)
    if (photoName) {
      const result = await fetchPhotoByName(photoName);
      if (result) return result;
      return NextResponse.json({ error: "Photo fetch failed" }, { status: 502 });
    }

    // Option 2: Legacy photo reference
    if (photoRef) {
      const result = await fetchPhotoByRef(photoRef);
      if (result) return result;
      return NextResponse.json({ error: "Photo fetch failed" }, { status: 502 });
    }

    // Option 3: Text search for a place and get its photo
    if (query) {
      const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({ textQuery: query }),
      });

      if (!searchRes.ok) {
        return NextResponse.json({ error: "Place search failed" }, { status: 502 });
      }

      const searchData = await searchRes.json();
      const foundPhotoName = searchData.places?.[0]?.photos?.[0]?.name;

      if (!foundPhotoName) {
        return NextResponse.json({ error: "No photo found" }, { status: 404 });
      }

      const result = await fetchPhotoByName(foundPhotoName);
      if (result) return result;
      return NextResponse.json({ error: "Photo fetch failed" }, { status: 502 });
    }

    return NextResponse.json({ error: "Provide 'ref', 'name', or 'query' parameter" }, { status: 400 });
  } catch (error) {
    console.error("Places photo proxy error:", error);
    return NextResponse.json({ error: "Photo proxy failed" }, { status: 500 });
  }
}
