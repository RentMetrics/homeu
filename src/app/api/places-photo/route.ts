import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const photoRef = searchParams.get("ref");
  const maxWidth = searchParams.get("maxwidth") || "400";

  if (!photoRef) {
    return NextResponse.json({ error: "photo reference required" }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, { redirect: "follow" });

    if (!res.ok) {
      return NextResponse.json({ error: "Photo fetch failed" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Places photo proxy error:", error);
    return NextResponse.json({ error: "Photo proxy failed" }, { status: 500 });
  }
}
