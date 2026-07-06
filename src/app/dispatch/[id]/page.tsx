import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { toTypedQuote } from "@/lib/db/mappers";
import { formatNumber } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

function estimatedCompletion(jobStartDate: string, startTime: string, productionHours: number): string {
  const start = new Date(`${jobStartDate}T${startTime || "07:00"}:00`);
  if (Number.isNaN(start.getTime())) return "-";
  const end = new Date(start.getTime() + productionHours * 60 * 60 * 1000);
  return end.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 text-sm last:border-0 dark:border-zinc-800">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function DispatchViewPage({
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
  const dispatch = row.dispatch;

  if (!dispatch) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-zinc-600 dark:text-zinc-400">
          No dispatch order has been created for this quote yet.{" "}
          <Link href={`/quote/${quote.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
            Accept the quote
          </Link>{" "}
          to create one.
        </p>
      </div>
    );
  }

  const { inputs, result } = quote;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 print:max-w-none">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Carrier Dispatch Order</h1>
        <PrintButton />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 print:border-none print:p-0">
        <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="text-lg font-semibold">{inputs.customer.customerName}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Quote #{quote.id.slice(0, 8).toUpperCase()} &middot; {inputs.job.materialType}
          </div>
        </div>

        <Row label="Driver" value={dispatch.driver || "Unassigned"} />
        <Row label="Truck" value={dispatch.truck || "Unassigned"} />
        <Row label="Start Time" value={`${inputs.job.jobStartDate} @ ${dispatch.startTime}`} />
        <Row label="Pickup" value={inputs.job.pickupLocation} />
        <Row label="Delivery" value={inputs.job.deliveryLocation} />
        <Row label="Number of Loads" value={formatNumber(result.production.tripsRequired, 0)} />
        <Row
          label="Estimated Completion"
          value={estimatedCompletion(inputs.job.jobStartDate, dispatch.startTime, result.production.totalProductionHours)}
        />
        <Row label="Customer Contact" value={dispatch.customerContact || "-"} />

        <div className="mt-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Special Instructions
          </h3>
          <p className="text-sm">{dispatch.specialInstructions || "None"}</p>
        </div>
      </div>
    </div>
  );
}
