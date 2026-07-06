import { describe, expect, it } from "vitest";
import { buildQuote, type QuoteResult } from "./quote";
import { calculateProduction } from "./production";
import { calculateFuelSurcharge } from "./fuelSurcharge";
import type { QuoteInputs } from "./types";

// A fixture chosen so the underlying numbers land on clean values, making the
// expected results easy to hand-verify (see PR description / comments below
// for the derivation).
function baseInputs(): QuoteInputs {
  return {
    customer: { customerName: "Acme Construction" },
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
      jobStartDate: "2026-08-01",
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
      minimumHourlyRate: 95,
    },
    currentDieselPricePerGallon: 4.1,
    taxRatePercent: 0,
  };
}

/** Unwraps a successful buildQuote() result, failing the test loudly if
 * validation rejected the fixture instead of computing a quote. */
function expectQuote(inputs: QuoteInputs): QuoteResult {
  const result = buildQuote(inputs);
  if (!result.ok) {
    throw new Error(`Expected a valid quote, got issues: ${result.issues.join(", ")}`);
  }
  return result.quote;
}

describe("calculateProduction", () => {
  it("derives cycle time, trips, and fleet hours from job + operational inputs", () => {
    const inputs = baseInputs();
    const production = calculateProduction(inputs.job, inputs.operational);

    expect(production.cycleTimeMinutes).toBeCloseTo(57.6, 6);
    expect(production.loadsPerHourPerTruck).toBeCloseTo(1.041666667, 6);
    expect(production.tripsRequired).toBe(25);
    expect(production.totalProductionHours).toBeCloseTo(8, 6);
    expect(production.totalLoadedMiles).toBeCloseTo(300, 6);
    expect(production.totalRoundTripMiles).toBeCloseTo(600, 6);
    expect(production.trucksNeededForSchedule).toBe(3);
  });

  it("rounds trips up when tonnage doesn't divide evenly by truck capacity", () => {
    const inputs = baseInputs();
    inputs.job.totalTonnage = 501;
    const production = calculateProduction(inputs.job, inputs.operational);
    expect(production.tripsRequired).toBe(26);
  });
});

describe("buildQuote - pricing engine", () => {
  it("computes all three methods and recommends the highest sustainable rate", () => {
    const result = expectQuote(baseInputs());

    expect(result.pricing.hourly.total).toBeCloseTo(2761.97, 2);
    expect(result.pricing.mileage.total).toBeCloseTo(2761.97, 2);
    expect(result.pricing.perTon.total).toBeCloseTo(2784.07, 2);

    // Per-ton carries a small long-haul distance adjustment, so it wins.
    expect(result.pricing.recommended.method).toBe("perTon");
    expect(result.pricing.recommended.total).toBe(result.pricing.perTon.total);
  });

  it("always recommends the highest of the three method totals", () => {
    const result = expectQuote(baseInputs());
    const { hourly, perTon, mileage, recommended } = result.pricing;
    const max = Math.max(hourly.total, perTon.total, mileage.total);
    expect(recommended.total).toBe(max);
  });

  it("never lets the hourly rate fall below the configured minimum", () => {
    const inputs = baseInputs();
    // Drive costs to near zero and shorten the job so the raw cost-plus
    // hourly rate would otherwise be far below the $95 floor.
    inputs.cost.driverHourlyCost = 1;
    inputs.cost.truckOperatingCostPerMile = 0.01;
    inputs.cost.maintenanceReservePerMile = 0.01;
    inputs.cost.tireReservePerMile = 0.01;
    inputs.cost.insuranceAllocationPerDay = 1;
    inputs.cost.desiredProfitMarginPercent = 1;
    inputs.cost.administrativeOverheadPercent = 1;
    inputs.cost.dispatchFeePercent = 1;

    const result = expectQuote(inputs);
    expect(result.pricing.hourly.rate).toBe(95);
    expect(result.pricing.hourly.notes.join(" ")).toMatch(/floor applied/);
  });

  it("increases the per-ton rate for long-haul jobs beyond the short-haul threshold", () => {
    const shortHaul = expectQuote(baseInputs());

    const longHaulInputs = baseInputs();
    longHaulInputs.job.oneWayLoadedMiles = 60;
    longHaulInputs.job.roundTripMiles = 120;
    const longHaul = expectQuote(longHaulInputs);

    expect(longHaul.pricing.perTon.rate).toBeGreaterThan(shortHaul.pricing.perTon.rate);
  });
});

describe("fuel surcharge module", () => {
  it("adds a surcharge when current diesel price is above baseline", () => {
    const surcharge = calculateFuelSurcharge({
      currentDieselPricePerGallon: 4.1,
      baselineDieselPricePerGallon: 3.8,
      truckMpg: 6,
      totalRoundTripMiles: 600,
      baseQuoteTotal: 2784.0676056338,
    });

    expect(surcharge.fuelSurchargeDollarAmount).toBeCloseTo(30, 6);
    expect(surcharge.updatedQuoteTotal).toBeCloseTo(2814.0676056338, 4);
    expect(surcharge.fuelSurchargePercent).toBeGreaterThan(0);
  });

  it("produces a negative surcharge (customer credit) when diesel drops below baseline", () => {
    const surcharge = calculateFuelSurcharge({
      currentDieselPricePerGallon: 3.5,
      baselineDieselPricePerGallon: 3.8,
      truckMpg: 6,
      totalRoundTripMiles: 600,
      baseQuoteTotal: 2784.0676056338,
    });

    expect(surcharge.fuelSurchargeDollarAmount).toBeLessThan(0);
    expect(surcharge.updatedQuoteTotal).toBeLessThan(2784.0676056338);
  });
});

describe("profit dashboard", () => {
  it("reconciles gross revenue down to gross profit and flags margin correctly", () => {
    const result = expectQuote(baseInputs());
    const { profit } = result;

    expect(profit.grossRevenue).toBeCloseTo(result.subtotal, 6);
    const reconciled =
      profit.grossRevenue -
      profit.carrierPay -
      profit.fuelEstimate -
      profit.insuranceAllocation -
      profit.maintenanceAllocation -
      profit.dispatchFee -
      profit.administrativeOverhead;
    expect(profit.grossProfit).toBeCloseTo(reconciled, 6);

    expect(profit.grossMarginPercent).toBeCloseTo(15.25, 1);
    expect(profit.belowTargetMargin).toBe(false);

    expect(profit.profitPerTruck).toBeCloseTo(profit.grossProfit / 3, 6);
    expect(profit.profitPerHour).toBeCloseTo(profit.grossProfit / result.production.totalProductionHours, 6);
    expect(profit.profitPerTon).toBeCloseTo(profit.grossProfit / 500, 6);
  });

  it("flags the quote when the achieved margin misses the desired margin", () => {
    const inputs = baseInputs();
    // A target so aggressive that revenue-based dispatch/admin/margin
    // percentages eat past what direct costs can support.
    inputs.cost.desiredProfitMarginPercent = 60;
    inputs.cost.dispatchFeePercent = 20;
    inputs.cost.administrativeOverheadPercent = 15;

    const result = expectQuote(inputs);
    expect(result.profit.belowTargetMargin).toBe(true);
  });
});

describe("buildQuote - totals and expiration", () => {
  it("applies tax on top of the fuel-surcharged subtotal", () => {
    const inputs = baseInputs();
    inputs.taxRatePercent = 8.25;
    const result = expectQuote(inputs);

    expect(result.taxAmount).toBeCloseTo(result.subtotal * 0.0825, 6);
    expect(result.totalPrice).toBeCloseTo(result.subtotal + result.taxAmount, 6);
  });

  it("sets an expiration date quoteValidityDays after the issue date", () => {
    const inputs = baseInputs();
    inputs.quoteValidityDays = 7;
    const result = expectQuote(inputs);

    const issue = new Date(result.quoteIssueDate);
    const expiration = new Date(result.quoteExpirationDate);
    const diffDays = (expiration.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });
});

describe("buildQuote - input validation", () => {
  it.each([
    ["totalTonnage", (i: QuoteInputs) => (i.job.totalTonnage = 0)],
    ["truckCapacityTons", (i: QuoteInputs) => (i.job.truckCapacityTons = 0)],
    ["numberOfTrucks", (i: QuoteInputs) => (i.job.numberOfTrucks = 0)],
    ["roundTripMiles", (i: QuoteInputs) => (i.job.roundTripMiles = 0)],
    ["estimatedProductionHours", (i: QuoteInputs) => (i.job.estimatedProductionHours = 0)],
    ["avgTravelSpeedMph", (i: QuoteInputs) => (i.operational.avgTravelSpeedMph = 0)],
    ["truckMpg", (i: QuoteInputs) => (i.cost.truckMpg = 0)],
    ["oneWayLoadedMiles negative", (i: QuoteInputs) => (i.job.oneWayLoadedMiles = -1)],
    ["driverOvertimeThresholdHours negative", (i: QuoteInputs) => (i.operational.driverOvertimeThresholdHours = -1)],
  ])("rejects a non-positive %s instead of returning a NaN quote", (_label, mutate) => {
    const inputs = baseInputs();
    mutate(inputs);
    const result = buildQuote(inputs);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it("accepts the base fixture with no issues", () => {
    const result = buildQuote(baseInputs());
    expect(result.ok).toBe(true);
  });
});
