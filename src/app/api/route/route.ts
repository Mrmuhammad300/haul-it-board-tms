import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleMapsRoutingSource } from "@/lib/dataSources/live";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is not configured. Enter mileage manually." },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pickup = searchParams.get("pickup");
  const delivery = searchParams.get("delivery");
  if (!pickup || !delivery) {
    return NextResponse.json({ error: "Missing pickup or delivery." }, { status: 400 });
  }

  try {
    const route = await new GoogleMapsRoutingSource(apiKey).getRoute(pickup, delivery);
    return NextResponse.json(route);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google Maps request failed." },
      { status: 502 }
    );
  }
}
