import type {
  DieselPriceSource,
  RouteEstimate,
  RoutingSource,
  WeatherDelaySource,
} from "./types";

/** Echoes back a dispatcher-entered diesel price. No network call. */
export class ManualDieselPriceSource implements DieselPriceSource {
  constructor(private readonly pricePerGallon: number) {}

  async getCurrentDieselPrice(): Promise<number> {
    return this.pricePerGallon;
  }
}

/** Echoes back dispatcher-entered mileage. No network call. */
export class ManualRoutingSource implements RoutingSource {
  constructor(private readonly estimate: RouteEstimate) {}

  async getRoute(): Promise<RouteEstimate> {
    return this.estimate;
  }
}

/** Echoes back a dispatcher-entered weather delay factor (defaults to no delay). */
export class ManualWeatherDelaySource implements WeatherDelaySource {
  constructor(private readonly factor: number = 1) {}

  async getWeatherDelayFactor(): Promise<number> {
    return this.factor;
  }
}
