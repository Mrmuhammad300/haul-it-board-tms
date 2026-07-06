// Core domain types for the D&M Logistics dump-truck quote calculator.
// These mirror the "Job Information / Operational Variables / Cost Variables"
// input groups from the product spec.

export interface JobInfo {
  materialType: string;
  totalTonnage: number;
  truckType: string;
  truckCapacityTons: number;
  numberOfTrucks: number;
  pickupLocation: string;
  deliveryLocation: string;
  /** One-way miles while carrying a load (pickup -> delivery). */
  oneWayLoadedMiles: number;
  /** Estimated miles for a full loop including the empty return leg. */
  roundTripMiles: number;
  jobStartDate: string;
  /** Hours per day the customer expects trucks on site / producing. */
  estimatedProductionHours: number;
}

export interface OperationalVariables {
  avgLoadingTimeMinutes: number;
  avgUnloadingTimeMinutes: number;
  avgTravelSpeedMph: number;
  /** Multiplier >= 1, e.g. 1.15 = 15% slower due to jobsite congestion. */
  jobsiteTrafficFactor: number;
  /** Multiplier >= 1, e.g. 1.1 = 10% slower due to weather. Optional, defaults to 1. */
  weatherFactor?: number;
  /** Optional override; when omitted it is derived from tonnage / truck capacity. */
  numberOfTripsRequired?: number;
  /** Hours per truck per day before overtime labor rates apply. */
  driverOvertimeThresholdHours: number;
}

export interface CostVariables {
  driverHourlyCost: number;
  /** Baseline diesel price ($/gal) baked into the base cost build-up. */
  fuelCostPerGallon: number;
  truckMpg: number;
  /** Flat $ per truck per day, e.g. certificate-of-insurance allocation. */
  insuranceAllocationPerDay: number;
  /** Non-fuel operating cost ($/mile): lease/depreciation, licensing, etc. */
  truckOperatingCostPerMile: number;
  maintenanceReservePerMile: number;
  tireReservePerMile: number;
  /** % of gross revenue reserved for back-office overhead. */
  administrativeOverheadPercent: number;
  /** % of gross revenue paid out as a dispatch/brokerage fee. */
  dispatchFeePercent: number;
  /** Target gross margin %, used both for pricing and for the underpricing flag. */
  desiredProfitMarginPercent: number;
  /** Rate floor for the Hourly Method. Defaults to 95 if not provided. */
  minimumHourlyRate?: number;
}

export interface CustomerInfo {
  customerName: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface QuoteInputs {
  customer: CustomerInfo;
  job: JobInfo;
  operational: OperationalVariables;
  cost: CostVariables;
  /** Current national/regional diesel average, e.g. from EIA. */
  currentDieselPricePerGallon: number;
  /** Sales tax rate applied to the recommended total, e.g. 0.0825 for 8.25%. Optional. */
  taxRatePercent?: number;
  /** Days from quote issue date until it expires. Defaults to 14. */
  quoteValidityDays?: number;
}

export const DEFAULT_MINIMUM_HOURLY_RATE = 95;
export const DEFAULT_QUOTE_VALIDITY_DAYS = 14;
