import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NwsWeatherDelaySource, geocodeAddress } from "@/lib/dataSources/live";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleMapsApiKey) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_MAPS_API_KEY is not configured (needed to geocode the address for NWS). Enter the weather factor manually.",
      },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");
  if (!location) {
    return NextResponse.json({ error: "Missing location." }, { status: 400 });
  }

  const userAgent = process.env.NWS_USER_AGENT || "dm-logistics-quote-calc (unset-contact-email)";

  try {
    const { lat, lon } = await geocodeAddress(googleMapsApiKey, location);
    const factor = await new NwsWeatherDelaySource(userAgent).getWeatherDelayFactor(
      `${lat},${lon}`
    );
    return NextResponse.json({ factor });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Weather lookup failed." },
      { status: 502 }
    );
  }
}
