import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { EiaDieselPriceSource } from "@/lib/dataSources/live";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "EIA_API_KEY is not configured. Enter the diesel price manually." },
      { status: 501 }
    );
  }

  try {
    const price = await new EiaDieselPriceSource(apiKey).getCurrentDieselPrice();
    return NextResponse.json({ price });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "EIA request failed." },
      { status: 502 }
    );
  }
}
