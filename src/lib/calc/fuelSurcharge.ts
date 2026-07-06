export interface FuelSurchargeInputs {
  currentDieselPricePerGallon: number;
  baselineDieselPricePerGallon: number;
  truckMpg: number;
  /** Total miles the fleet will actually drive for this job (round trip x trips). */
  totalRoundTripMiles: number;
  /** The quote total (from the recommended pricing method) before the surcharge is applied. */
  baseQuoteTotal: number;
}

export interface FuelSurchargeResult {
  /** Positive when diesel is above baseline, negative when below (a customer credit). */
  dieselPriceDeltaPerGallon: number;
  extraFuelCostPerMile: number;
  fuelSurchargeDollarAmount: number;
  fuelSurchargePercent: number;
  updatedQuoteTotal: number;
}

export function calculateFuelSurcharge(
  inputs: FuelSurchargeInputs
): FuelSurchargeResult {
  const {
    currentDieselPricePerGallon,
    baselineDieselPricePerGallon,
    truckMpg,
    totalRoundTripMiles,
    baseQuoteTotal,
  } = inputs;

  const dieselPriceDeltaPerGallon =
    currentDieselPricePerGallon - baselineDieselPricePerGallon;
  const extraFuelCostPerMile = dieselPriceDeltaPerGallon / truckMpg;
  const fuelSurchargeDollarAmount = extraFuelCostPerMile * totalRoundTripMiles;
  const fuelSurchargePercent =
    baseQuoteTotal === 0 ? 0 : (fuelSurchargeDollarAmount / baseQuoteTotal) * 100;
  const updatedQuoteTotal = baseQuoteTotal + fuelSurchargeDollarAmount;

  return {
    dieselPriceDeltaPerGallon,
    extraFuelCostPerMile,
    fuelSurchargeDollarAmount,
    fuelSurchargePercent,
    updatedQuoteTotal,
  };
}
