import type { QuoteInputs } from "./types";

/** Catches the inputs that would otherwise make the calc chain divide by
 * zero/negative and silently produce NaN/Infinity throughout a quote. */
export function validateQuoteInputs(inputs: QuoteInputs): string[] {
  const issues: string[] = [];
  const { job, operational, cost } = inputs;

  if (!(job.totalTonnage > 0)) {
    issues.push("Total tonnage must be greater than 0.");
  }
  if (!(job.truckCapacityTons > 0)) {
    issues.push("Truck capacity must be greater than 0.");
  }
  if (!(job.numberOfTrucks > 0)) {
    issues.push("Number of trucks must be greater than 0.");
  }
  if (!(job.oneWayLoadedMiles >= 0)) {
    issues.push("One-way loaded miles cannot be negative.");
  }
  if (!(job.roundTripMiles > 0)) {
    issues.push("Estimated round-trip miles must be greater than 0.");
  }
  if (!(job.estimatedProductionHours > 0)) {
    issues.push("Estimated production hours must be greater than 0.");
  }

  if (!(operational.avgLoadingTimeMinutes >= 0)) {
    issues.push("Average loading time cannot be negative.");
  }
  if (!(operational.avgUnloadingTimeMinutes >= 0)) {
    issues.push("Average unloading time cannot be negative.");
  }
  if (!(operational.avgTravelSpeedMph > 0)) {
    issues.push("Average travel speed must be greater than 0.");
  }
  if (!(operational.jobsiteTrafficFactor > 0)) {
    issues.push("Jobsite traffic factor must be greater than 0.");
  }
  if (operational.weatherFactor !== undefined && !(operational.weatherFactor > 0)) {
    issues.push("Weather factor must be greater than 0.");
  }
  if (
    operational.numberOfTripsRequired !== undefined &&
    !(operational.numberOfTripsRequired > 0)
  ) {
    issues.push("Number of trips override must be greater than 0.");
  }
  if (!(operational.driverOvertimeThresholdHours >= 0)) {
    issues.push("Driver overtime threshold cannot be negative.");
  }

  if (!(cost.driverHourlyCost >= 0)) {
    issues.push("Driver hourly cost cannot be negative.");
  }
  if (!(cost.fuelCostPerGallon >= 0)) {
    issues.push("Baseline fuel cost cannot be negative.");
  }
  if (!(cost.truckMpg > 0)) {
    issues.push("Truck MPG must be greater than 0.");
  }
  if (!(cost.insuranceAllocationPerDay >= 0)) {
    issues.push("Insurance allocation cannot be negative.");
  }
  if (!(cost.truckOperatingCostPerMile >= 0)) {
    issues.push("Truck operating cost cannot be negative.");
  }
  if (!(cost.maintenanceReservePerMile >= 0)) {
    issues.push("Maintenance reserve cannot be negative.");
  }
  if (!(cost.tireReservePerMile >= 0)) {
    issues.push("Tire reserve cannot be negative.");
  }
  if (!(cost.administrativeOverheadPercent >= 0)) {
    issues.push("Administrative overhead % cannot be negative.");
  }
  if (!(cost.dispatchFeePercent >= 0)) {
    issues.push("Dispatch fee % cannot be negative.");
  }
  if (!(cost.desiredProfitMarginPercent >= 0)) {
    issues.push("Desired profit margin % cannot be negative.");
  }
  if (cost.minimumHourlyRate !== undefined && !(cost.minimumHourlyRate >= 0)) {
    issues.push("Minimum hourly rate cannot be negative.");
  }

  if (!(inputs.currentDieselPricePerGallon >= 0)) {
    issues.push("Current diesel price cannot be negative.");
  }
  if (inputs.taxRatePercent !== undefined && !(inputs.taxRatePercent >= 0)) {
    issues.push("Tax rate cannot be negative.");
  }
  if (inputs.quoteValidityDays !== undefined && !(inputs.quoteValidityDays > 0)) {
    issues.push("Quote validity days must be greater than 0.");
  }

  // Guards against a degenerate cycle time (e.g. an unrealistically high
  // travel speed making round-trip drive time ~0 while load/unload time is
  // also 0), which would otherwise make loadsPerHourPerTruck blow up.
  if (
    operational.avgTravelSpeedMph > 0 &&
    job.roundTripMiles > 0 &&
    operational.jobsiteTrafficFactor > 0
  ) {
    const weather = operational.weatherFactor ?? 1;
    const driveTimeMinutes =
      (job.roundTripMiles / operational.avgTravelSpeedMph) *
      60 *
      operational.jobsiteTrafficFactor *
      weather;
    const cycleTimeMinutes =
      driveTimeMinutes +
      operational.avgLoadingTimeMinutes +
      operational.avgUnloadingTimeMinutes;
    if (!(cycleTimeMinutes > 0)) {
      issues.push(
        "Cycle time (drive + load + unload) must be greater than 0 - check travel speed and load/unload times."
      );
    }
  }

  return issues;
}
