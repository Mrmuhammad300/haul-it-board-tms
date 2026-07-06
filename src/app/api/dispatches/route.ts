import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

interface DispatchRequestBody {
  quoteId: string;
  driver: string;
  truck: string;
  startTime: string;
  customerContact: string;
  specialInstructions: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as DispatchRequestBody;
  if (!body?.quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({ where: { id: body.quoteId } });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Upsert: editing dispatch details for a quote overwrites the prior
  // record rather than keeping history - an accepted launch-scope
  // trade-off (see roadmap's "fast-follow" list for audit trail).
  const dispatch = await prisma.dispatch.upsert({
    where: { quoteId: body.quoteId },
    update: {
      driver: body.driver,
      truck: body.truck,
      startTime: body.startTime,
      customerContact: body.customerContact,
      specialInstructions: body.specialInstructions,
    },
    create: {
      quoteId: body.quoteId,
      driver: body.driver,
      truck: body.truck,
      startTime: body.startTime,
      customerContact: body.customerContact,
      specialInstructions: body.specialInstructions,
    },
  });

  return NextResponse.json({ id: dispatch.id, quoteId: dispatch.quoteId });
}
