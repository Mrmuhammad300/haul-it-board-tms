import type { JobInfo, OperationalVariables } from "./types";

export interface ProductionResult {
  /** Minutes for one full loaded round trip (drive both legs + load + unload), traffic/weather adjusted. */
  cycleTimeMinutes: number;
  loadsPerHourPerTruck: number;
  tonsPerHourPerTruck: number;
  fleetLoadsPerHour: number;
  fleetTonsPerHour: number;
  /** Number of loaded trips needed to move the full tonnage. */
  tripsRequired: number;
  /** Fleet-hours (wall clock, all trucks running in parallel) to complete every trip. */
  totalProductionHours: number;
  /** Calendar days needed at the customer's expected production hours/day. */
  totalJobDurationDays: number;
  /** Trucks required to finish within the customer's estimated production hours. */
  trucksNeededForSchedule: number;
  totalLoadedMiles: number;
  totalRoundTripMiles: number;
}

function driveTimeMinutes(job: JobInfo, ops: OperationalVariables): number {
  const weather = ops.weatherFactor ?? 1;
  const baseMinutes = (job.roundTripMiles / ops.avgTravelSpeedMph) * 60;
  return baseMinutes * ops.jobsiteTrafficFactor * weather;
}

export function calculateProduction(
  job: JobInfo,
  ops: OperationalVariables
): ProductionResult {
  const cycleTimeMinutes =
    driveTimeMinutes(job, ops) +
    ops.avgLoadingTimeMinutes +
    ops.avgUnloadingTimeMinutes;

  const loadsPerHourPerTruck = 60 / cycleTimeMinutes;
  const tonsPerHourPerTruck = loadsPerHourPerTruck * job.truckCapacityTons;
  const fleetLoadsPerHour = loadsPerHourPerTruck * job.numberOfTrucks;
  const fleetTonsPerHour = tonsPerHourPerTruck * job.numberOfTrucks;

  const tripsRequired =
    ops.numberOfTripsRequired ??
    Math.ceil(job.totalTonnage / job.truckCapacityTons);

  const totalProductionHours = tripsRequired / fleetLoadsPerHour;

  const totalJobDurationDays = Math.max(
    1,
    Math.ceil(totalProductionHours / job.estimatedProductionHours)
  );

  const trucksNeededForSchedule = Math.max(
    1,
    Math.ceil(tripsRequired / (loadsPerHourPerTruck * job.estimatedProductionHours))
  );

  return {
    cycleTimeMinutes,
    loadsPerHourPerTruck,
    tonsPerHourPerTruck,
    fleetLoadsPerHour,
    fleetTonsPerHour,
    tripsRequired,
    totalProductionHours,
    totalJobDurationDays,
    trucksNeededForSchedule,
    totalLoadedMiles: job.oneWayLoadedMiles * tripsRequired,
    totalRoundTripMiles: job.roundTripMiles * tripsRequired,
  };
}
