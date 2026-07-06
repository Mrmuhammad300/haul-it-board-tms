import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { toTypedQuote } from "@/lib/db/mappers";
import { CustomerQuoteOutput } from "@/components/CustomerQuoteOutput";

export default async function CustomerQuoteOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.quote.findUnique({ where: { id }, include: { dispatch: true } });

  if (!row) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-zinc-600 dark:text-zinc-400">
          Quote not found.{" "}
          <Link href="/quote" className="text-blue-600 hover:underline dark:text-blue-400">
            Start a new quote
          </Link>
          .
        </p>
      </div>
    );
  }

  const quote = toTypedQuote(row);

  return (
    <CustomerQuoteOutput
      quoteId={quote.id}
      inputs={quote.inputs}
      result={quote.result}
      hasDispatch={row.dispatch !== null}
    />
  );
}
