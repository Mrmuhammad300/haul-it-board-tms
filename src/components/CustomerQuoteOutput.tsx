"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuoteInputs, QuoteResult } from "@/lib/calc";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";

interface CustomerQuoteOutputProps {
  quoteId: string;
  inputs: QuoteInputs;
  result: QuoteResult;
  hasDispatch: boolean;
  revisedFromId: string | null;
}

export function CustomerQuoteOutput({
  quoteId,
  inputs,
  result,
  hasDispatch,
  revisedFromId,
}: CustomerQuoteOutputProps) {
  const router = useRouter();
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [driver, setDriver] = useState("");
  const [truck, setTruck] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [customerContactOverride, setCustomerContactOverride] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const customerContact = customerContactOverride ?? inputs.customer.contactName ?? "";

  async function handleAccept() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          driver,
          truck,
          startTime,
          customerContact,
          specialInstructions,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create dispatch");
      }
      router.push(`/dispatch/${quoteId}`);
    } catch {
      setSubmitError("Couldn't create the dispatch order. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 print:max-w-none">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold tracking-tight">Customer Quote</h1>
        <div className="flex gap-2">
          <Link
            href={`/quote?fromId=${quoteId}`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Revise Quote
          </Link>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Print / Save PDF
          </button>
          {hasDispatch ? (
            <Link
              href={`/dispatch/${quoteId}`}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View Dispatch Order
            </Link>
          ) : (
            <button
              onClick={() => setShowDispatchForm((v) => !v)}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Accept &amp; Create Dispatch
            </button>
          )}
        </div>
      </div>

      {revisedFromId && (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 print:hidden dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400">
          Revision of Quote #{revisedFromId.slice(0, 8).toUpperCase()}.
        </div>
      )}

      {showDispatchForm && !hasDispatch && (
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 print:hidden">
          <h2 className="mb-3 text-sm font-semibold">Dispatch Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Driver</span>
              <input className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" value={driver} onChange={(e) => setDriver(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Truck</span>
              <input className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" value={truck} onChange={(e) => setTruck(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Start Time</span>
              <input type="time" className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Customer Contact</span>
              <input className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" value={customerContact} onChange={(e) => setCustomerContactOverride(e.target.value)} />
            </label>
            <label className="col-span-full flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Special Instructions</span>
              <textarea className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" rows={2} value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
            </label>
          </div>
          {submitError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{submitError}</p>}
          <button
            onClick={handleAccept}
            disabled={submitting}
            className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Confirm & Create Dispatch Order"}
          </button>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 print:border-none print:p-0">
        <div className="mb-6 flex items-start justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div>
            <div className="text-lg font-semibold">D&amp;M Logistics</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Dump Truck Hauling Services</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">Quote #{quoteId.slice(0, 8).toUpperCase()}</div>
            <div className="text-zinc-500 dark:text-zinc-400">Issued {formatDate(result.quoteIssueDate)}</div>
            <div className="text-zinc-500 dark:text-zinc-400">Expires {formatDate(result.quoteExpirationDate)}</div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Customer</h3>
            <div className="text-sm">
              <div className="font-medium">{inputs.customer.customerName}</div>
              {inputs.customer.contactName && <div>{inputs.customer.contactName}</div>}
              {inputs.customer.contactPhone && <div>{inputs.customer.contactPhone}</div>}
              {inputs.customer.contactEmail && <div>{inputs.customer.contactEmail}</div>}
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Route</h3>
            <div className="text-sm">
              <div>Pickup: {inputs.job.pickupLocation}</div>
              <div>Delivery: {inputs.job.deliveryLocation}</div>
              <div>Job Start: {formatDate(inputs.job.jobStartDate)}</div>
            </div>
          </div>
        </div>

        <table className="mb-6 w-full text-sm">
          <tbody>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 text-zinc-500 dark:text-zinc-400">Material</td>
              <td className="py-2 text-right font-medium">{inputs.job.materialType}</td>
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 text-zinc-500 dark:text-zinc-400">Estimated Tonnage</td>
              <td className="py-2 text-right font-medium">{formatNumber(inputs.job.totalTonnage, 0)} tons</td>
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 text-zinc-500 dark:text-zinc-400">Estimated Trips</td>
              <td className="py-2 text-right font-medium">{formatNumber(result.production.tripsRequired, 0)}</td>
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 text-zinc-500 dark:text-zinc-400">Estimated Hours</td>
              <td className="py-2 text-right font-medium">{formatNumber(result.production.totalProductionHours, 1)} hrs</td>
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 text-zinc-500 dark:text-zinc-400">
                Pricing Method ({result.pricing.recommended.label})
              </td>
              <td className="py-2 text-right font-medium">{formatCurrency(result.pricing.recommended.total)}</td>
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 text-zinc-500 dark:text-zinc-400">
                Fuel Surcharge ({formatPercent(result.fuelSurcharge.fuelSurchargePercent, 2)})
              </td>
              <td className="py-2 text-right font-medium">{formatCurrency(result.fuelSurcharge.fuelSurchargeDollarAmount)}</td>
            </tr>
            {result.taxAmount > 0 && (
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 text-zinc-500 dark:text-zinc-400">
                  Taxes ({formatPercent(inputs.taxRatePercent ?? 0, 2)})
                </td>
                <td className="py-2 text-right font-medium">{formatCurrency(result.taxAmount)}</td>
              </tr>
            )}
            <tr>
              <td className="pt-3 text-base font-semibold">Total Estimated Price</td>
              <td className="pt-3 text-right text-base font-semibold">{formatCurrency(result.totalPrice)}</td>
            </tr>
          </tbody>
        </table>

        <div className="border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Terms &amp; Conditions
          </h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>This quote is valid until {formatDate(result.quoteExpirationDate)} and is subject to material availability.</li>
            <li>
              Fuel surcharge is indexed to the national diesel average at time of dispatch and may be
              recalculated if diesel prices move materially before the job start date.
            </li>
            <li>Pricing assumes normal jobsite access, standard load/unload times, and no extended wait time beyond what is quoted.</li>
            <li>Weather-related delays may result in a revised schedule and, where applicable, a revised quote.</li>
            <li>Payment terms: Net 30 from invoice date unless otherwise agreed in writing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
