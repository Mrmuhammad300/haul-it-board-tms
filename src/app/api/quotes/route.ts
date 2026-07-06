import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import type { QuoteInputs, QuoteResult } from "@/lib/calc";
import type { Prisma } from "@/generated/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { inputs: QuoteInputs; result: QuoteResult };
  if (!body?.inputs || !body?.result) {
    return NextResponse.json({ error: "Missing inputs or result" }, { status: 400 });
  }

  const quote = await prisma.quote.create({
    data: {
      inputs: body.inputs as unknown as Prisma.InputJsonValue,
      result: body.result as unknown as Prisma.InputJsonValue,
      createdBy: session.user.email ?? undefined,
    },
  });

  return NextResponse.json({ id: quote.id });
}
