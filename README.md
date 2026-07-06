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

Requires a Postgres database (see "Persistence & auth" below).

```bash
npm install                          # also runs `prisma generate` via postinstall
cp .env.example .env                 # fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm run db:migrate                   # applies prisma/migrations against DATABASE_URL
npm run db:create-user -- you@example.com yourpassword "Your Name"
npm run dev                          # http://localhost:3000 - log in with the user above
npm test                             # runs the calc engine unit tests (vitest)
npm run lint
npm run build
```

Every route requires login (`src/proxy.ts` redirects to `/login` otherwise):

- `/` — dashboard listing saved quotes (Server Component, reads Postgres directly).
- `/quote` — the Quote Calculator: fill in the four input groups and see the
  Production Calculator, Pricing Engine, Fuel Surcharge Module, and Profit
  Dashboard update live. "Save & Generate Customer Quote" POSTs to
  `/api/quotes` and opens the customer-facing output.
- `/quote/[id]` — the printable Customer Quote Output. "Accept & Create
  Dispatch" POSTs to `/api/dispatches` and turns it into a dispatch order.
- `/dispatch/[id]` — the Carrier Dispatch View for an accepted quote.
- `/login` — Credentials-based sign-in (email + password). There is no
  signup UI by design - see "Persistence & auth" below.

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
- `manual.ts` — echoes a dispatcher-entered value. Always available as a
  fallback, and the only thing used when no API keys are configured.
- `live.ts` — real adapters for the EIA diesel price API, Google Maps
  Directions/Geocoding, and the National Weather Service.

### Connecting live data sources

Each is wired behind a server-side route handler so keys never reach the
browser, with a "Refresh" button in the Quote Calculator form next to the
corresponding field. With no keys configured, each button shows an inline
"not configured, enter manually" message rather than breaking the form.

1. **Diesel prices (EIA)**: register a free key at
   https://www.eia.gov/opendata/register.php and set `EIA_API_KEY`.
   `src/app/api/diesel-price/route.ts` calls `EiaDieselPriceSource`; the
   "Refresh diesel price (EIA)" button fills in "Current Diesel Price".
2. **Routing (Google Maps)**: enable the Directions API (and Geocoding API -
   see weather below) and set `GOOGLE_MAPS_API_KEY`.
   `src/app/api/route/route.ts` calls `GoogleMapsRoutingSource`; the "Look up
   mileage" button fills in one-way loaded miles and round-trip miles from
   the pickup/delivery fields.
3. **Weather (NWS)**: no key required for NWS itself, but it only accepts
   coordinates, not addresses, so `src/app/api/weather-delay/route.ts` first
   geocodes the pickup location via Google's Geocoding API (`geocodeAddress`
   in `live.ts`, same `GOOGLE_MAPS_API_KEY`) before calling
   `NwsWeatherDelaySource`. Also set `NWS_USER_AGENT` to a descriptive value
   (e.g. `"dm-logistics-quote-calc (ops@yourcompany.com)"`) per NWS API
   policy. The "Refresh weather delay (NWS)" button fills in the weather
   factor.

## Persistence & auth

Quotes and dispatches live in Postgres via Prisma (`prisma/schema.prisma`:
`Quote`, `Dispatch`, `User`). `src/lib/db/client.ts` is the Prisma client
singleton, built on Prisma 7's driver-adapter pattern (`@prisma/adapter-pg`) -
Prisma 7 no longer reads a `url` from `datasource {}` in `schema.prisma`;
the CLI's migrate connection comes from `prisma.config.ts` instead, and the
runtime client requires an explicit adapter. `src/lib/db/mappers.ts` casts
the `inputs`/`result` JSON columns back to their typed shape at the read
boundary - they're deliberately kept as JSON rather than fully normalized
(see the roadmap's reporting/analytics note for when that should change).

Auth is [Auth.js](https://authjs.dev) (NextAuth v5) with a single
Credentials provider and JWT sessions (`src/auth.ts`) - no OAuth/SSO, no
roles beyond "logged in or not," by design for a small internal team on a
tight launch timeline. `src/proxy.ts` (the Next.js 16 file convention that
replaced `middleware.ts`) redirects any unauthenticated request to
`/login`. There is intentionally no signup page - bootstrap a dispatcher
login with:

```bash
npm run db:create-user -- dispatcher@yourcompany.com theirpassword "Their Name"
```

`trustHost: true` is set in `src/auth.ts` because Auth.js otherwise throws
`UntrustedHost` (and silently lets the request through instead of failing
safe) whenever the request's Host header doesn't match `NEXTAUTH_URL` -
this matters on Vercel preview deployments, which get a new URL per
deployment, not just for local testing on a non-default port.

## Deployment

Deploys as a standard Next.js app on Vercel:

1. Provision a Postgres database (Vercel Postgres or Neon both work) and
   set `DATABASE_URL` in the Vercel project's environment variables.
2. Set `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`) and
   `NEXTAUTH_URL` (your production domain).
3. Run `npm run db:migrate` once against the production database (or use
   `prisma migrate deploy` in a release step) before first traffic.
4. Bootstrap at least one dispatcher login with `npm run db:create-user`.

`.github/workflows/ci.yml` runs lint, typecheck, tests, and a production
build on every PR - it uses a placeholder `DATABASE_URL` since none of
those steps need a live database (`prisma generate` only needs the schema
file, and no page queries Postgres at build time).

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
