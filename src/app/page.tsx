import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { toTypedQuote } from "@/lib/db/mappers";
import { formatCurrency, formatDate } from "@/lib/format";

// Quotes are written continuously via /api/quotes - never prerender this
// list statically, or newly saved quotes wouldn't show up until a rebuild.
export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await prisma.quote.findMany({ orderBy: { createdAt: "desc" } });
  const quotes = rows.map(toTypedQuote);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-10 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Dump Truck Hauling Quote Calculator
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Build a sustainable quote from job, operational, and cost inputs. Compare the
          Hourly, Per-Ton, and Mileage pricing methods, apply a live fuel surcharge, and
          check profit margin before you send it.
        </p>
        <div>
          <Link
            href="/quote"
            className="mt-2 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start a New Quote
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Recent Quotes</h2>
        {quotes.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
            No quotes yet. Saved quotes appear here so you can reopen the customer output
            or dispatch view.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Recommended Total</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3 font-medium">{q.inputs.customer.customerName}</td>
                    <td className="px-4 py-3">{q.inputs.job.materialType}</td>
                    <td className="px-4 py-3">
                      {q.inputs.job.pickupLocation} &rarr; {q.inputs.job.deliveryLocation}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(q.result.totalPrice)}</td>
                    <td className="px-4 py-3">{formatDate(q.createdAt.toISOString())}</td>
                    <td className="px-4 py-3">
                      <Link href={`/quote/${q.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        View Quote
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
