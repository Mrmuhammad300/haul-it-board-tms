// Live implementations of the data-source interfaces. These call real public
// APIs and are meant to run server-side (e.g. a Next.js route handler) so API
// keys never reach the browser. None of them are wired into the UI by
// default because this environment has no API keys configured - see
// README.md "Connecting live data sources" for setup steps.

import type {
  DieselPriceSource,
  RouteEstimate,
  RoutingSource,
  WeatherDelaySource,
} from "./types";

/**
 * U.S. Energy Information Administration weekly retail diesel prices.
 * Series `PET.EMD_EPD2D_PTE_NUS_DPG.W` is the U.S. weekly No. 2 diesel
 * retail price. Requires an EIA_API_KEY (free, https://www.eia.gov/opendata/register.php).
 */
export class EiaDieselPriceSource implements DieselPriceSource {
  constructor(private readonly apiKey: string) {}

  async getCurrentDieselPrice(): Promise<number> {
    const url = new URL(
      "https://api.eia.gov/v2/petroleum/pri/gnd/data/"
    );
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("frequency", "weekly");
    url.searchParams.set("data[0]", "value");
    url.searchParams.set("facets[series][]", "EMD_EPD2D_PTE_NUS_DPG");
    url.searchParams.set("sort[0][column]", "period");
    url.searchParams.set("sort[0][direction]", "desc");
    url.searchParams.set("length", "1");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`EIA request failed: ${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    const value = body?.response?.data?.[0]?.value;
    if (typeof value !== "number") {
      throw new Error("EIA response did not contain a diesel price value.");
    }
    return value;
  }
}

/**
 * Google Maps Directions API. Requires GOOGLE_MAPS_API_KEY with the
 * Directions API enabled.
 */
export class GoogleMapsRoutingSource implements RoutingSource {
  constructor(private readonly apiKey: string) {}

  async getRoute(pickupLocation: string, deliveryLocation: string): Promise<RouteEstimate> {
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", pickupLocation);
    url.searchParams.set("destination", deliveryLocation);
    url.searchParams.set("key", this.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Maps request failed: ${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    const leg = body?.routes?.[0]?.legs?.[0];
    if (!leg) {
      throw new Error("Google Maps response did not contain a route.");
    }
    const oneWayLoadedMiles = leg.distance.value / 1609.344;
    const estimatedOneWayDriveMinutes = leg.duration.value / 60;
    return {
      oneWayLoadedMiles,
      roundTripMiles: oneWayLoadedMiles * 2,
      estimatedOneWayDriveMinutes,
    };
  }
}

/**
 * Geocodes a free-text address to coordinates via the Google Geocoding API
 * (same key as GoogleMapsRoutingSource) - NWS needs "lat,lon", not an address.
 */
export async function geocodeAddress(
  apiKey: string,
  address: string
): Promise<{ lat: number; lon: number }> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Geocoding request failed: ${response.status} ${response.statusText}`);
  }
  const body = await response.json();
  const location = body?.results?.[0]?.geometry?.location;
  if (!location) {
    throw new Error("Google Geocoding response did not contain a location.");
  }
  return { lat: location.lat, lon: location.lng };
}

/**
 * National Weather Service forecast. Free, no API key, but requires a
 * descriptive User-Agent per NWS API policy. `location` must be
 * "lat,lon" (e.g. from geocodeAddress) - NWS does not accept addresses.
 */
export class NwsWeatherDelaySource implements WeatherDelaySource {
  constructor(private readonly userAgent: string) {}

  async getWeatherDelayFactor(location: string): Promise<number> {
    const pointsResponse = await fetch(
      `https://api.weather.gov/points/${location}`,
      { headers: { "User-Agent": this.userAgent } }
    );
    if (!pointsResponse.ok) {
      throw new Error(
        `NWS points request failed: ${pointsResponse.status} ${pointsResponse.statusText}`
      );
    }
    const points = await pointsResponse.json();
    const forecastUrl = points?.properties?.forecast;
    if (!forecastUrl) {
      throw new Error("NWS points response did not contain a forecast URL.");
    }

    const forecastResponse = await fetch(forecastUrl, {
      headers: { "User-Agent": this.userAgent },
    });
    if (!forecastResponse.ok) {
      throw new Error(
        `NWS forecast request failed: ${forecastResponse.status} ${forecastResponse.statusText}`
      );
    }
    const forecast = await forecastResponse.json();
    const shortForecast: string = forecast?.properties?.periods?.[0]?.shortForecast ?? "";
    return weatherDelayFactorFromForecastText(shortForecast);
  }
}

/** Very small heuristic mapping forecast text to a drive-time delay multiplier. */
export function weatherDelayFactorFromForecastText(shortForecast: string): number {
  const text = shortForecast.toLowerCase();
  if (/snow|ice|blizzard|freezing/.test(text)) return 1.35;
  if (/thunderstorm|heavy rain/.test(text)) return 1.2;
  if (/rain|showers|fog/.test(text)) return 1.1;
  return 1.0;
}
