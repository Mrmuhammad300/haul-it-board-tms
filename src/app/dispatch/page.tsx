import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { toTypedQuote } from "@/lib/db/mappers";
import {
  dispatchStartDate,
  dispatchStatus,
  formatCompletion,
  DISPATCH_STATUS_LABEL,
  type DispatchStatus,
} from "@/lib/dispatchStatus";
import { formatNumber } from "@/lib/format";

// Dispatches are created continuously via /api/dispatches - never
// prerender this list statically.
export const dynamic = "force-dynamic";

const STATUS_BADGE_CLASSES: Record<DispatchStatus, string> = {
  scheduled: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  in_progress: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
};

export default async function DispatchBoardPage() {
  const rows = await prisma.dispatch.findMany({ include: { quote: true } });

  const dispatches = rows
    .map((row) => {
      const quote = toTypedQuote(row.quote);
      return {
        dispatch: row,
        quote,
        start: dispatchStartDate(quote.inputs.job.jobStartDate, row.startTime),
        status: dispatchStatus(
          quote.inputs.job.jobStartDate,
          row.startTime,
          quote.result.production.totalProductionHours
        ),
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dispatch Board</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Every active dispatch order, across all quotes, in one place.
        </p>
      </div>

      {dispatches.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700">
          No dispatch orders yet. Accept a quote to create one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Driver / Truck</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Loads</th>
                <th className="px-4 py-3">Est. Completion</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {dispatches.map(({ dispatch, quote, status }) => (
                <tr key={dispatch.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
                    >
                      {DISPATCH_STATUS_LABEL[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{quote.inputs.customer.customerName}</td>
                  <td className="px-4 py-3">
                    {dispatch.driver || "Unassigned"} &middot; {dispatch.truck || "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    {quote.inputs.job.jobStartDate} @ {dispatch.startTime}
                  </td>
                  <td className="px-4 py-3">
                    {quote.inputs.job.pickupLocation} &rarr; {quote.inputs.job.deliveryLocation}
                  </td>
                  <td className="px-4 py-3">{formatNumber(quote.result.production.tripsRequired, 0)}</td>
                  <td className="px-4 py-3">
                    {formatCompletion(
                      quote.inputs.job.jobStartDate,
                      dispatch.startTime,
                      quote.result.production.totalProductionHours
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dispatch/${quote.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
