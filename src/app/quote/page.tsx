"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildQuote, DEFAULT_MINIMUM_HOURLY_RATE, type QuoteInputs } from "@/lib/calc";
import { Section, NumberField, TextField, DateField, RefreshButton } from "@/components/forms";
import { QuoteResultsPanel } from "@/components/QuoteResultsPanel";

function defaultInputs(): QuoteInputs {
  return {
    customer: {
      customerName: "Acme Construction",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
    },
    job: {
      materialType: "Crushed Stone",
      totalTonnage: 500,
      truckType: "Tri-axle dump",
      truckCapacityTons: 20,
      numberOfTrucks: 3,
      pickupLocation: "Quarry A",
      deliveryLocation: "Site B",
      oneWayLoadedMiles: 12,
      roundTripMiles: 24,
      jobStartDate: new Date().toISOString().slice(0, 10),
      estimatedProductionHours: 8,
    },
    operational: {
      avgLoadingTimeMinutes: 10,
      avgUnloadingTimeMinutes: 8,
      avgTravelSpeedMph: 40,
      jobsiteTrafficFactor: 1.1,
      weatherFactor: 1.0,
      driverOvertimeThresholdHours: 8,
    },
    cost: {
      driverHourlyCost: 32,
      fuelCostPerGallon: 3.8,
      truckMpg: 6,
      insuranceAllocationPerDay: 45,
      truckOperatingCostPerMile: 0.9,
      maintenanceReservePerMile: 0.15,
      tireReservePerMile: 0.08,
      administrativeOverheadPercent: 6,
      dispatchFeePercent: 8,
      desiredProfitMarginPercent: 15,
      minimumHourlyRate: DEFAULT_MINIMUM_HOURLY_RATE,
    },
    currentDieselPricePerGallon: 4.1,
    taxRatePercent: 0,
    quoteValidityDays: 14,
  };
}

export default function QuoteCalculatorPage() {
  const [inputs, setInputs] = useState<QuoteInputs>(defaultInputs());
  const router = useRouter();

  const buildResult = useMemo(() => buildQuote(inputs), [inputs]);
  const result = buildResult.ok ? buildResult.quote : null;
  const issues = buildResult.ok ? [] : buildResult.issues;

  function update<K extends keyof QuoteInputs>(key: K, value: QuoteInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function updateJob<K extends keyof QuoteInputs["job"]>(key: K, value: QuoteInputs["job"][K]) {
    setInputs((prev) => ({ ...prev, job: { ...prev.job, [key]: value } }));
  }

  function updateOperational<K extends keyof QuoteInputs["operational"]>(
    key: K,
    value: QuoteInputs["operational"][K]
  ) {
    setInputs((prev) => ({ ...prev, operational: { ...prev.operational, [key]: value } }));
  }

  function updateCost<K extends keyof QuoteInputs["cost"]>(key: K, value: QuoteInputs["cost"][K]) {
    setInputs((prev) => ({ ...prev, cost: { ...prev.cost, [key]: value } }));
  }

  function updateCustomer<K extends keyof QuoteInputs["customer"]>(
    key: K,
    value: QuoteInputs["customer"][K]
  ) {
    setInputs((prev) => ({ ...prev, customer: { ...prev.customer, [key]: value } }));
  }

  async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body?.error ?? "Request failed.");
    }
    return body as T;
  }

  async function refreshDieselPrice() {
    const { price } = await fetchJson<{ price: number }>("/api/diesel-price");
    update("currentDieselPricePerGallon", price);
  }

  async function refreshRoute() {
    const params = new URLSearchParams({
      pickup: inputs.job.pickupLocation,
      delivery: inputs.job.deliveryLocation,
    });
    const route = await fetchJson<{ oneWayLoadedMiles: number; roundTripMiles: number }>(
      `/api/route?${params}`
    );
    updateJob("oneWayLoadedMiles", route.oneWayLoadedMiles);
    updateJob("roundTripMiles", route.roundTripMiles);
  }

  async function refreshWeatherDelay() {
    const params = new URLSearchParams({ location: inputs.job.pickupLocation });
    const { factor } = await fetchJson<{ factor: number }>(`/api/weather-delay?${params}`);
    updateOperational("weatherFactor", factor);
  }

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, result }),
      });
      if (!response.ok) {
        throw new Error("Failed to save quote");
      }
      const { id } = (await response.json()) as { id: string };
      router.push(`/quote/${id}`);
    } catch {
      setSaveError("Couldn't save the quote. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Quote Calculator</h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Fill in job, operational, and cost details. Results update live below.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-5">
        <Section title="Customer Information">
          <TextField label="Customer Name" value={inputs.customer.customerName} onChange={(v) => updateCustomer("customerName", v)} />
          <TextField label="Contact Name" value={inputs.customer.contactName ?? ""} onChange={(v) => updateCustomer("contactName", v)} />
          <TextField label="Contact Phone" value={inputs.customer.contactPhone ?? ""} onChange={(v) => updateCustomer("contactPhone", v)} />
          <TextField label="Contact Email" value={inputs.customer.contactEmail ?? ""} onChange={(v) => updateCustomer("contactEmail", v)} />
        </Section>

        <Section title="Job Information">
          <TextField label="Material Type" value={inputs.job.materialType} onChange={(v) => updateJob("materialType", v)} />
          <NumberField label="Total Tonnage" suffix="tons" min={0.01} value={inputs.job.totalTonnage} onChange={(v) => updateJob("totalTonnage", v)} />
          <TextField label="Truck Type" value={inputs.job.truckType} onChange={(v) => updateJob("truckType", v)} />
          <NumberField label="Truck Capacity" suffix="tons" min={0.01} value={inputs.job.truckCapacityTons} onChange={(v) => updateJob("truckCapacityTons", v)} />
          <NumberField label="Number of Trucks" min={1} value={inputs.job.numberOfTrucks} onChange={(v) => updateJob("numberOfTrucks", v)} />
          <TextField label="Pickup Location" value={inputs.job.pickupLocation} onChange={(v) => updateJob("pickupLocation", v)} />
          <TextField label="Delivery Location" value={inputs.job.deliveryLocation} onChange={(v) => updateJob("deliveryLocation", v)} />
          <NumberField label="One-Way Loaded Miles" suffix="mi" min={0} value={inputs.job.oneWayLoadedMiles} onChange={(v) => updateJob("oneWayLoadedMiles", v)} />
          <NumberField label="Estimated Round-Trip Miles" suffix="mi" min={0.01} value={inputs.job.roundTripMiles} onChange={(v) => updateJob("roundTripMiles", v)} />
          <DateField label="Job Start Date" value={inputs.job.jobStartDate} onChange={(v) => updateJob("jobStartDate", v)} />
          <NumberField label="Estimated Production Hours / Day" suffix="hrs" min={0.01} value={inputs.job.estimatedProductionHours} onChange={(v) => updateJob("estimatedProductionHours", v)} />
          <RefreshButton label="Look up mileage from pickup/delivery (Google Maps)" onFetch={refreshRoute} />
        </Section>

        <Section title="Operational Variables">
          <NumberField label="Avg Loading Time" suffix="min" min={0} value={inputs.operational.avgLoadingTimeMinutes} onChange={(v) => updateOperational("avgLoadingTimeMinutes", v)} />
          <NumberField label="Avg Unloading Time" suffix="min" min={0} value={inputs.operational.avgUnloadingTimeMinutes} onChange={(v) => updateOperational("avgUnloadingTimeMinutes", v)} />
          <NumberField label="Avg Travel Speed" suffix="mph" min={0.01} value={inputs.operational.avgTravelSpeedMph} onChange={(v) => updateOperational("avgTravelSpeedMph", v)} />
          <NumberField label="Jobsite Traffic Factor" suffix="x" step={0.01} min={0.01} value={inputs.operational.jobsiteTrafficFactor} onChange={(v) => updateOperational("jobsiteTrafficFactor", v)} />
          <NumberField label="Weather Factor (optional)" suffix="x" step={0.01} min={0.01} value={inputs.operational.weatherFactor ?? 1} onChange={(v) => updateOperational("weatherFactor", v)} />
          <NumberField label="Number of Trips (override, optional)" min={1} value={inputs.operational.numberOfTripsRequired ?? NaN} onChange={(v) => updateOperational("numberOfTripsRequired", Number.isFinite(v) ? v : undefined)} />
          <NumberField label="Driver Overtime Threshold" suffix="hrs/day" min={0} value={inputs.operational.driverOvertimeThresholdHours} onChange={(v) => updateOperational("driverOvertimeThresholdHours", v)} />
          <RefreshButton label="Refresh weather delay for pickup location (NWS)" onFetch={refreshWeatherDelay} />
        </Section>

        <Section title="Cost Variables">
          <NumberField label="Driver Hourly Cost" suffix="$/hr" min={0} value={inputs.cost.driverHourlyCost} onChange={(v) => updateCost("driverHourlyCost", v)} />
          <NumberField label="Baseline Fuel Cost" suffix="$/gal" step={0.01} min={0} value={inputs.cost.fuelCostPerGallon} onChange={(v) => updateCost("fuelCostPerGallon", v)} />
          <NumberField label="Truck MPG" suffix="mi/gal" step={0.1} min={0.1} value={inputs.cost.truckMpg} onChange={(v) => updateCost("truckMpg", v)} />
          <NumberField label="Insurance Allocation" suffix="$/truck/day" min={0} value={inputs.cost.insuranceAllocationPerDay} onChange={(v) => updateCost("insuranceAllocationPerDay", v)} />
          <NumberField label="Truck Operating Cost" suffix="$/mi" step={0.01} min={0} value={inputs.cost.truckOperatingCostPerMile} onChange={(v) => updateCost("truckOperatingCostPerMile", v)} />
          <NumberField label="Maintenance Reserve" suffix="$/mi" step={0.01} min={0} value={inputs.cost.maintenanceReservePerMile} onChange={(v) => updateCost("maintenanceReservePerMile", v)} />
          <NumberField label="Tire Reserve" suffix="$/mi" step={0.01} min={0} value={inputs.cost.tireReservePerMile} onChange={(v) => updateCost("tireReservePerMile", v)} />
          <NumberField label="Administrative Overhead" suffix="% of revenue" min={0} value={inputs.cost.administrativeOverheadPercent} onChange={(v) => updateCost("administrativeOverheadPercent", v)} />
          <NumberField label="Dispatch Fee" suffix="% of revenue" min={0} value={inputs.cost.dispatchFeePercent} onChange={(v) => updateCost("dispatchFeePercent", v)} />
          <NumberField label="Desired Profit Margin" suffix="% of revenue" min={0} value={inputs.cost.desiredProfitMarginPercent} onChange={(v) => updateCost("desiredProfitMarginPercent", v)} />
          <NumberField label="Minimum Hourly Rate" suffix="$/hr floor" min={0} value={inputs.cost.minimumHourlyRate ?? DEFAULT_MINIMUM_HOURLY_RATE} onChange={(v) => updateCost("minimumHourlyRate", v)} />
        </Section>

        <Section title="Fuel, Tax & Quote Terms" description="Diesel price can be pulled from the EIA weekly average if EIA_API_KEY is configured; otherwise enter it manually (see README).">
          <NumberField label="Current Diesel Price" suffix="$/gal" step={0.01} min={0} value={inputs.currentDieselPricePerGallon} onChange={(v) => update("currentDieselPricePerGallon", v)} />
          <NumberField label="Tax Rate" suffix="%" step={0.01} min={0} value={inputs.taxRatePercent ?? 0} onChange={(v) => update("taxRatePercent", v)} />
          <NumberField label="Quote Validity" suffix="days" min={1} value={inputs.quoteValidityDays ?? 14} onChange={(v) => update("quoteValidityDays", v)} />
          <RefreshButton label="Refresh diesel price (EIA)" onFetch={refreshDieselPrice} />
        </Section>
      </div>

      {issues.length > 0 && (
        <div className="mb-8 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <p className="mb-1 font-semibold">Fix the following before results can be calculated:</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Results</h2>
            <div className="flex items-center gap-3">
              {saveError && <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Saving..." : "Save & Generate Customer Quote"}
              </button>
            </div>
          </div>
          <QuoteResultsPanel result={result} />
        </>
      )}
    </div>
  );
}
