import type { CostVariables, JobInfo, OperationalVariables } from "./types";
import { DEFAULT_MINIMUM_HOURLY_RATE } from "./types";
import type { ProductionResult } from "./production";
import type { CostBuildup } from "./cost";

export type PricingMethodName = "hourly" | "perTon" | "mileage";

export interface PricingMethodResult {
  method: PricingMethodName;
  label: string;
  rate: number;
  rateUnit: string;
  total: number;
  notes: string[];
}

export interface PricingEngineResult {
  hourly: PricingMethodResult;
  perTon: PricingMethodResult;
  mileage: PricingMethodResult;
  recommended: PricingMethodResult;
}

/** Miles beyond this one-way distance start pushing the per-ton rate up. */
const SHORT_HAUL_THRESHOLD_MILES = 10;
/** Per-ton rate increase per mile beyond the short-haul threshold. */
const DISTANCE_ADJUSTMENT_PER_MILE = 0.004;
const MAX_DISTANCE_ADJUSTMENT = 1.5;
/** Max per-ton rate increase when the fleet is fully idle relative to schedule. */
const MAX_UTILIZATION_ADJUSTMENT = 0.15;
/** Markup stack is clamped below 100% of revenue so cost-plus math never divides by <= 0. */
const MAX_MARKUP_STACK = 0.95;

function safeMarkupStack(markupStack: number): number {
  return Math.min(markupStack, MAX_MARKUP_STACK);
}

function pricingHourly(
  job: JobInfo,
  cost: CostVariables,
  production: ProductionResult,
  costBuildup: CostBuildup
): PricingMethodResult {
  const markup = safeMarkupStack(costBuildup.markupStack);
  const costPerTruckHour =
    costBuildup.directCost / (job.numberOfTrucks * production.totalProductionHours);
  const rawRate = costPerTruckHour / (1 - markup);
  const minimumHourlyRate = cost.minimumHourlyRate ?? DEFAULT_MINIMUM_HOURLY_RATE;
  const rate = Math.max(minimumHourlyRate, rawRate);
  const notes: string[] = [];
  if (rate === minimumHourlyRate && rawRate < minimumHourlyRate) {
    notes.push(
      `Cost-plus rate of $${rawRate.toFixed(2)}/hr was below the $${minimumHourlyRate}/hr floor; floor applied.`
    );
  }
  const total = rate * job.numberOfTrucks * production.totalProductionHours;
  return {
    method: "hourly",
    label: "Hourly Method",
    rate,
    rateUnit: "$/truck-hour",
    total,
    notes,
  };
}

function pricingPerTon(
  job: JobInfo,
  production: ProductionResult,
  costBuildup: CostBuildup
): PricingMethodResult {
  const markup = safeMarkupStack(costBuildup.markupStack);
  const costPerTon = costBuildup.directCost / job.totalTonnage;
  const baseRate = costPerTon / (1 - markup);

  const milesOverThreshold = Math.max(0, job.oneWayLoadedMiles - SHORT_HAUL_THRESHOLD_MILES);
  const distanceAdjustment = Math.min(
    MAX_DISTANCE_ADJUSTMENT,
    1 + milesOverThreshold * DISTANCE_ADJUSTMENT_PER_MILE
  );

  const utilization = Math.min(
    1,
    production.totalProductionHours / job.estimatedProductionHours
  );
  const utilizationAdjustment = 1 + (1 - utilization) * MAX_UTILIZATION_ADJUSTMENT;

  const rate = baseRate * distanceAdjustment * utilizationAdjustment;
  const notes: string[] = [];
  if (distanceAdjustment > 1) {
    notes.push(`Distance adjustment +${((distanceAdjustment - 1) * 100).toFixed(1)}% for ${job.oneWayLoadedMiles}mi one-way haul.`);
  }
  if (utilizationAdjustment > 1) {
    notes.push(
      `Utilization adjustment +${((utilizationAdjustment - 1) * 100).toFixed(1)}% (fleet uses ${(utilization * 100).toFixed(0)}% of scheduled hours).`
    );
  }
  const total = rate * job.totalTonnage;
  return {
    method: "perTon",
    label: "Per-Ton Method",
    rate,
    rateUnit: "$/ton",
    total,
    notes,
  };
}

function pricingMileage(
  production: ProductionResult,
  costBuildup: CostBuildup
): PricingMethodResult {
  const markup = safeMarkupStack(costBuildup.markupStack);
  const costPerLoadedMile = costBuildup.directCost / production.totalLoadedMiles;
  const rate = costPerLoadedMile / (1 - markup);
  const total = rate * production.totalLoadedMiles;
  return {
    method: "mileage",
    label: "Mileage Method",
    rate,
    rateUnit: "$/loaded mile",
    total,
    notes: [],
  };
}

export function calculatePricing(
  job: JobInfo,
  ops: OperationalVariables,
  cost: CostVariables,
  production: ProductionResult,
  costBuildup: CostBuildup
): PricingEngineResult {
  const hourly = pricingHourly(job, cost, production, costBuildup);
  const perTon = pricingPerTon(job, production, costBuildup);
  const mileage = pricingMileage(production, costBuildup);

  const recommended = [hourly, perTon, mileage].reduce((best, current) =>
    current.total > best.total ? current : best
  );

  return { hourly, perTon, mileage, recommended };
}
