# D&M Logistics — Dump Truck Hauling Quote Calculator

A quote calculator and dispatch tool for dump-truck hauling jobs: it turns job,
operational, and cost inputs into a defensible price, compares three pricing
methods, applies a fuel surcharge, and flags jobs that don't hit margin
before you send the quote.

## Scope of this build

This implements the **Core Calculation Logic** described in the product spec:
Job/Operational/Cost inputs, the Pricing Engine (Hourly / Per-Ton / Mileage +
hybrid recommendation), the Fuel Surcharge Module, the Production Calculator,
the Profit Dashboard, a printable Customer Quote Output, and a Carrier
Dispatch View generated from an accepted quote.

The document's "Long-Term Vision" section (CRM, carrier management, live
tracking, driver mobile app, invoicing, A/R, reporting, etc.) is a roadmap of
future modules for a full TMS, not something this build implements. This repo
is the calculation engine and the first slice of UI that roadmap would sit on
top of.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # runs the calc engine unit tests (vitest)
npm run lint
npm run build
```

- `/` — dashboard listing quotes you've saved (stored in the browser's
  `localStorage`; there's no backend/database yet).
- `/quote` — the Quote Calculator: fill in the four input groups and see the
  Production Calculator, Pricing Engine, Fuel Surcharge Module, and Profit
  Dashboard update live. "Save & Generate Customer Quote" persists the quote
  and opens the customer-facing output.
- `/quote/[id]` — the printable Customer Quote Output. "Accept & Create
  Dispatch" turns it into a dispatch order.
- `/dispatch/[id]` — the Carrier Dispatch View for an accepted quote.

## Architecture

All the math lives in `src/lib/calc/`, independent of React/Next so it's easy
to unit test and to reuse from an API route later:

| File | Responsibility |
| --- | --- |
| `types.ts` | `JobInfo`, `OperationalVariables`, `CostVariables`, `QuoteInputs` |
| `production.ts` | Cycle time, loads/tons per hour, trips required, fleet-hours, trucks needed for schedule |
| `cost.ts` | Direct cost build-up (labor incl. overtime, mileage/fuel/maintenance/tire, insurance) and the revenue-based markup stack |
| `pricing.ts` | The three pricing methods and the hybrid recommendation (highest of the three) |
| `fuelSurcharge.ts` | Diesel price delta → surcharge % / $ / updated total |
| `profit.ts` | Profit Dashboard line items, margin %, and the below-target-margin flag |
| `quote.ts` | Wires the above together, applies tax, computes issue/expiration dates |

`src/lib/dataSources/` defines the "National Data Sources" integration points
as interfaces (`DieselPriceSource`, `RoutingSource`, `WeatherDelaySource`) with
two implementations each:
- `manual.ts` — echoes a dispatcher-entered value. Used today since no API
  keys are configured in this environment.
- `live.ts` — real adapters for the EIA diesel price API, Google Maps
  Directions, and the National Weather Service. Not wired into the UI by
  default.

### Connecting live data sources

1. **Diesel prices (EIA)**: register a free key at
   https://www.eia.gov/opendata/register.php, set `EIA_API_KEY`, and call
   `new EiaDieselPriceSource(process.env.EIA_API_KEY)` from a server-side route
   handler (never expose the key to the browser).
2. **Routing (Google Maps)**: enable the Directions API, set
   `GOOGLE_MAPS_API_KEY`, and use `GoogleMapsRoutingSource` the same way.
3. **Weather (NWS)**: no key required, but the API requires a descriptive
   `User-Agent` (e.g. `"dm-logistics-quote-calc (ops@yourcompany.com)"`) —
   pass it into `NwsWeatherDelaySource`.

Wire these into a Next.js route handler (e.g. `src/app/api/diesel-price/route.ts`)
that the Quote Calculator form can call to prefill the "Current Diesel Price"
field, rather than calling them directly from client components.

## Pricing engine notes

- **Hourly**: cost-plus rate per truck-hour, floored at a configurable minimum
  (defaults to $95/hr) so short, efficient jobs never get quoted below the
  floor.
- **Per-Ton**: cost-plus rate per ton, adjusted up for long-haul one-way
  distances (beyond a 10-mile short-haul threshold) and for fleet
  under-utilization relative to the customer's expected schedule.
- **Mileage**: cost-plus rate per *loaded* mile — since it recovers the full
  round-trip cost (including the empty return leg) against loaded miles only,
  it naturally prices differently from the other two methods.
- **Recommended**: whichever of the three totals is highest, so you never
  under-price a job just because one method's blind spot doesn't fit the job.

## Testing

`src/lib/calc/quote.test.ts` uses a hand-derived fixture (chosen so the
underlying numbers land on clean values) to regression-test the full
calculation chain, plus targeted tests for the hourly rate floor, the
long-haul per-ton adjustment, the fuel surcharge sign flip when diesel drops
below baseline, profit dashboard reconciliation, and the margin flag.
