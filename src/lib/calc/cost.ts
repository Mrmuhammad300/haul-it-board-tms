import type { CostVariables, JobInfo, OperationalVariables } from "./types";
import type { ProductionResult } from "./production";

export interface CostBuildup {
  fuelCostPerMile: number;
  costPerMile: number;
  totalMileageCost: number;
  regularLaborHoursPerTruck: number;
  overtimeLaborHoursPerTruck: number;
  totalLaborCost: number;
  totalInsuranceCost: number;
  /** Sum of labor + mileage + insurance before margin/overhead/dispatch markup. */
  directCost: number;
  /** (margin% + overhead% + dispatch%) / 100, the revenue-based markup stack. */
  markupStack: number;
}

export function calculateDirectCost(
  job: JobInfo,
  ops: OperationalVariables,
  cost: CostVariables,
  production: ProductionResult
): CostBuildup {
  const fuelCostPerMile = cost.fuelCostPerGallon / cost.truckMpg;
  const costPerMile =
    fuelCostPerMile +
    cost.truckOperatingCostPerMile +
    cost.maintenanceReservePerMile +
    cost.tireReservePerMile;
  const totalMileageCost = costPerMile * production.totalRoundTripMiles;

  const hoursPerTruck = production.totalProductionHours;
  const regularLaborHoursPerTruck = Math.min(
    hoursPerTruck,
    ops.driverOvertimeThresholdHours
  );
  const overtimeLaborHoursPerTruck = Math.max(
    0,
    hoursPerTruck - ops.driverOvertimeThresholdHours
  );
  const laborCostPerTruck =
    regularLaborHoursPerTruck * cost.driverHourlyCost +
    overtimeLaborHoursPerTruck * cost.driverHourlyCost * 1.5;
  const totalLaborCost = laborCostPerTruck * job.numberOfTrucks;

  const totalInsuranceCost =
    cost.insuranceAllocationPerDay *
    production.totalJobDurationDays *
    job.numberOfTrucks;

  const directCost = totalLaborCost + totalMileageCost + totalInsuranceCost;

  const markupStack =
    (cost.desiredProfitMarginPercent +
      cost.administrativeOverheadPercent +
      cost.dispatchFeePercent) /
    100;

  return {
    fuelCostPerMile,
    costPerMile,
    totalMileageCost,
    regularLaborHoursPerTruck,
    overtimeLaborHoursPerTruck,
    totalLaborCost,
    totalInsuranceCost,
    directCost,
    markupStack,
  };
}
