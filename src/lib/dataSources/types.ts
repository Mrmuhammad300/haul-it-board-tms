// Pluggable adapters for the "National Data Sources" the spec asks for:
// EIA diesel prices, a routing API (Google Maps or similar), and NWS weather.
//
// No live API keys are configured in this environment, so every source ships
// a `manual*` implementation that simply echoes a value the dispatcher typed
// into the form. Swap in the `live*` implementation (see README) once an API
// key is available - the calculation engine only depends on these interfaces,
// never on a specific vendor.

export interface DieselPriceSource {
  /** Current national (or PADD-region) average diesel price, $/gal. */
  getCurrentDieselPrice(region?: string): Promise<number>;
}

export interface RouteEstimate {
  oneWayLoadedMiles: number;
  roundTripMiles: number;
  estimatedOneWayDriveMinutes: number;
}

export interface RoutingSource {
  getRoute(pickupLocation: string, deliveryLocation: string): Promise<RouteEstimate>;
}

export interface WeatherDelaySource {
  /**
   * Multiplier applied to drive time to account for forecast conditions,
   * e.g. 1.0 = no delay, 1.2 = 20% slower.
   */
  getWeatherDelayFactor(location: string, date: string): Promise<number>;
}
