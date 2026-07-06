import type { CostVariables, JobInfo } from "./types";
import type { ProductionResult } from "./production";
import type { CostBuildup } from "./cost";

export interface ProfitDashboard {
  grossRevenue: number;
  carrierPay: number;
  fuelEstimate: number;
  insuranceAllocation: number;
  maintenanceAllocation: number;
  dispatchFee: number;
  administrativeOverhead: number;
  grossProfit: number;
  grossMarginPercent: number;
  profitPerTruck: number;
  profitPerHour: number;
  profitPerTon: number;
  /** True when the achieved margin falls short of the desired margin - flag before sending. */
  belowTargetMargin: boolean;
}

export function calculateProfitDashboard(
  job: JobInfo,
  cost: CostVariables,
  production: ProductionResult,
  costBuildup: CostBuildup,
  grossRevenue: number,
  fuelSurchargeDollarAmount: number
): ProfitDashboard {
  const carrierPay =
    costBuildup.totalLaborCost +
    cost.truckOperatingCostPerMile * production.totalRoundTripMiles;

  const fuelEstimate =
    costBuildup.fuelCostPerMile * production.totalRoundTripMiles +
    fuelSurchargeDollarAmount;

  const insuranceAllocation = costBuildup.totalInsuranceCost;

  const maintenanceAllocation =
    (cost.maintenanceReservePerMile + cost.tireReservePerMile) *
    production.totalRoundTripMiles;

  const dispatchFee = (cost.dispatchFeePercent / 100) * grossRevenue;
  const administrativeOverhead =
    (cost.administrativeOverheadPercent / 100) * grossRevenue;

  const grossProfit =
    grossRevenue -
    carrierPay -
    fuelEstimate -
    insuranceAllocation -
    maintenanceAllocation -
    dispatchFee -
    administrativeOverhead;

  const grossMarginPercent =
    grossRevenue === 0 ? 0 : (grossProfit / grossRevenue) * 100;

  return {
    grossRevenue,
    carrierPay,
    fuelEstimate,
    insuranceAllocation,
    maintenanceAllocation,
    dispatchFee,
    administrativeOverhead,
    grossProfit,
    grossMarginPercent,
    profitPerTruck: grossProfit / job.numberOfTrucks,
    profitPerHour: grossProfit / production.totalProductionHours,
    profitPerTon: grossProfit / job.totalTonnage,
    belowTargetMargin: grossMarginPercent < cost.desiredProfitMarginPercent,
  };
}
