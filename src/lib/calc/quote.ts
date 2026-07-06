import type { QuoteInputs } from "./types";
import { DEFAULT_QUOTE_VALIDITY_DAYS } from "./types";
import { calculateProduction, type ProductionResult } from "./production";
import { calculateDirectCost, type CostBuildup } from "./cost";
import { calculatePricing, type PricingEngineResult } from "./pricing";
import { calculateFuelSurcharge, type FuelSurchargeResult } from "./fuelSurcharge";
import { calculateProfitDashboard, type ProfitDashboard } from "./profit";
import { validateQuoteInputs } from "./validation";

export interface QuoteResult {
  inputs: QuoteInputs;
  production: ProductionResult;
  costBuildup: CostBuildup;
  pricing: PricingEngineResult;
  fuelSurcharge: FuelSurchargeResult;
  profit: ProfitDashboard;
  /** Recommended method total + fuel surcharge, before tax. */
  subtotal: number;
  taxAmount: number;
  /** Final price to present to the customer: subtotal + tax. */
  totalPrice: number;
  quoteIssueDate: string;
  quoteExpirationDate: string;
}

export type BuildQuoteResult =
  | { ok: true; quote: QuoteResult }
  | { ok: false; issues: string[] };

/** Validates inputs first so a bad number (e.g. 0 truck MPG) can never
 * silently turn into a NaN/Infinity quote - see validation.ts. */
export function buildQuote(inputs: QuoteInputs): BuildQuoteResult {
  const issues = validateQuoteInputs(inputs);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, quote: buildQuoteUnchecked(inputs) };
}

function buildQuoteUnchecked(inputs: QuoteInputs): QuoteResult {
  const { job, operational, cost } = inputs;

  const production = calculateProduction(job, operational);
  const costBuildup = calculateDirectCost(job, operational, cost, production);
  const pricing = calculatePricing(job, operational, cost, production, costBuildup);

  const fuelSurcharge = calculateFuelSurcharge({
    currentDieselPricePerGallon: inputs.currentDieselPricePerGallon,
    baselineDieselPricePerGallon: cost.fuelCostPerGallon,
    truckMpg: cost.truckMpg,
    totalRoundTripMiles: production.totalRoundTripMiles,
    baseQuoteTotal: pricing.recommended.total,
  });

  const profit = calculateProfitDashboard(
    job,
    cost,
    production,
    costBuildup,
    fuelSurcharge.updatedQuoteTotal,
    fuelSurcharge.fuelSurchargeDollarAmount
  );

  const subtotal = fuelSurcharge.updatedQuoteTotal;
  const taxRatePercent = inputs.taxRatePercent ?? 0;
  const taxAmount = subtotal * (taxRatePercent / 100);
  const totalPrice = subtotal + taxAmount;

  const quoteIssueDate = new Date().toISOString().slice(0, 10);
  const validityDays = inputs.quoteValidityDays ?? DEFAULT_QUOTE_VALIDITY_DAYS;
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + validityDays);
  const quoteExpirationDate = expiration.toISOString().slice(0, 10);

  return {
    inputs,
    production,
    costBuildup,
    pricing,
    fuelSurcharge,
    profit,
    subtotal,
    taxAmount,
    totalPrice,
    quoteIssueDate,
    quoteExpirationDate,
  };
}
