import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { toTypedQuote } from "@/lib/db/mappers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const quote = toTypedQuote(row);
  return NextResponse.json({ id: quote.id, inputs: quote.inputs });
}
