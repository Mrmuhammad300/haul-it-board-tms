"use client";

import type { QuoteResult } from "@/lib/calc";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-1.5 text-sm last:border-0 dark:border-zinc-800">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function QuoteResultsPanel({ result }: { result: QuoteResult }) {
  const { production, pricing, fuelSurcharge, profit } = result;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card title="Production Calculator">
        <Row label="Loads per hour / truck" value={formatNumber(production.loadsPerHourPerTruck, 2)} />
        <Row label="Tons per hour / truck" value={formatNumber(production.tonsPerHourPerTruck, 2)} />
        <Row label="Fleet loads per hour" value={formatNumber(production.fleetLoadsPerHour, 2)} />
        <Row label="Fleet tons per hour" value={formatNumber(production.fleetTonsPerHour, 2)} />
        <Row label="Trips required" value={formatNumber(production.tripsRequired, 0)} />
        <Row label="Total production time (fleet-hrs)" value={formatNumber(production.totalProductionHours, 2)} />
        <Row label="Total job duration" value={`${production.totalJobDurationDays} day(s)`} />
        <Row label="Trucks needed to meet schedule" value={formatNumber(production.trucksNeededForSchedule, 0)} />
      </Card>

      <Card title="Pricing Engine">
        <div className="mb-3 grid grid-cols-3 gap-3 text-center text-sm">
          {[pricing.hourly, pricing.perTon, pricing.mileage].map((m) => (
            <div
              key={m.method}
              className={`rounded-md border p-3 ${
                m.method === pricing.recommended.method
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{m.label}</div>
              <div className="text-base font-semibold">{formatCurrency(m.total)}</div>
              <div className="text-xs text-zinc-400">
                {formatCurrency(m.rate)} {m.rateUnit}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
          <span className="font-semibold">Recommended: {pricing.recommended.label}</span>{" "}
          &mdash; {formatCurrency(pricing.recommended.total)}
        </div>
        {[pricing.hourly, pricing.perTon, pricing.mileage]
          .flatMap((m) => m.notes)
          .map((note, i) => (
            <p key={i} className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {note}
            </p>
          ))}
      </Card>

      <Card title="Fuel Surcharge Module">
        <Row label="Baseline diesel price" value={formatCurrency(result.inputs.cost.fuelCostPerGallon)} />
        <Row label="Current diesel price" value={formatCurrency(result.inputs.currentDieselPricePerGallon)} />
        <Row label="Fuel surcharge %" value={formatPercent(fuelSurcharge.fuelSurchargePercent, 2)} />
        <Row label="Fuel surcharge $" value={formatCurrency(fuelSurcharge.fuelSurchargeDollarAmount)} />
        <Row label="Updated quote total" value={formatCurrency(fuelSurcharge.updatedQuoteTotal)} />
      </Card>

      <Card title="Profit Dashboard">
        <Row label="Gross revenue" value={formatCurrency(profit.grossRevenue)} />
        <Row label="Carrier pay" value={formatCurrency(profit.carrierPay)} />
        <Row label="Fuel estimate" value={formatCurrency(profit.fuelEstimate)} />
        <Row label="Insurance allocation" value={formatCurrency(profit.insuranceAllocation)} />
        <Row label="Maintenance allocation" value={formatCurrency(profit.maintenanceAllocation)} />
        <Row label="Dispatch fee" value={formatCurrency(profit.dispatchFee)} />
        <Row label="Administrative overhead" value={formatCurrency(profit.administrativeOverhead)} />
        <Row label="Gross profit" value={formatCurrency(profit.grossProfit)} />
        <Row label="Gross margin %" value={formatPercent(profit.grossMarginPercent, 1)} />
        <Row label="Profit per truck" value={formatCurrency(profit.profitPerTruck)} />
        <Row label="Profit per hour" value={formatCurrency(profit.profitPerHour)} />
        <Row label="Profit per ton" value={formatCurrency(profit.profitPerTon)} />
        {profit.belowTargetMargin && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            Margin is below the target of {formatPercent(result.inputs.cost.desiredProfitMarginPercent, 1)}.
            Review pricing before sending this quote.
          </div>
        )}
      </Card>
    </div>
  );
}
