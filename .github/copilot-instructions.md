# Copilot Instructions for TaxiFair (Dalil)

This file contains repository-specific guidance for Copilot-style assistants to help with code understanding, builds, and common developer tasks.

---

## Quick commands

- Install dependencies: `npm install`
- Run development server: `npm run dev` (Vite)
- Build production artifacts: `npm run build` (output -> `dist/`)
- Preview production build locally: `npm run preview` or `npm run start`
- Type-check only: `npm run check` (runs `tsc`)

Notes:
- There are no test or lint scripts configured in `package.json` at present. If tests are added, use the configured test runner's CLI to run single tests (e.g., `npx vitest run path/to/test`), but do not assume a runner is present.

---

## High-level architecture (big-picture)

- Monorepo-like layout but effectively a single client application:
  - `client/` — Main React + Vite application (UI, data, estimation engine).
  - `shared/` — Shared TypeScript schemas and types (zod schemas live in `shared/schema.ts`).
  - `dist/` — Build output (static site) produced by `npm run build`.
  - `database/` — Documentation / modeling assets (not a running DB in this repo).

- Key runtime responsibilities:
  - Pricing configuration is authored as JSON in `client/src/data/pricing.json` and TypeScript in `client/src/data/pricing.ts`.
  - Fare estimation logic lives in `client/src/lib/estimate.ts`. This file:
    - Calculates straight-line distance and applies a ROAD_FACTOR and average speed estimates.
    - Applies pricing rules from the `rulesConfig` object (base fare, distance-step pricing, minimum fare, night surcharge).
    - Exposes `estimateFare(input: EstimateRequest): EstimateResponse` with shapes defined in `shared/schema.ts`.
  - UI uses React + Tailwind (Tailwind config at `tailwind.config.ts`) and mapping with Leaflet for origin/destination selection.

- Important path aliasing and types:
  - Code imports `@shared/schema` (see `shared/schema.ts`) — maintain tsconfig path mappings if moving files.
  - Schemas are defined with `zod` and exported types (City, PricingProfile, EstimateRequest/Response) — prefer these for cross-file type safety.

---

## Key repository-specific conventions and patterns

- Pricing rules shape and semantics:
  - `rulesConfig` lives on pricing profiles and includes keys such as `base_fare`, `minimum_fare`, `distance_step_meters`, `price_per_step`, `night_surcharge_percent`, `night_start_hour`, `night_end_hour`, and `enabled_rules`.
  - `enabled_rules` is an array of rule identifiers (e.g., `BASE_FARE`, `DISTANCE_STEP_CALC`, `MINIMUM_CHECK`, `NIGHT_MULTIPLIER`) — code branches on these exact strings in the estimator.
  - Night detection handles ranges that wrap midnight (i.e., `night_start_hour > night_end_hour` is supported).

- Estimation logic:
  - Distance is estimated using Haversine formula then multiplied by a `ROAD_FACTOR` (1.4) to approximate realistic route distance.
  - Distance costs are calculated by stepping `distance_step_meters` and multiplying by `price_per_step` — rounding behavior occurs in the estimator (see `Number(...toFixed(2))`).
  - The estimator supports an `isNightOverride` to force night pricing recalculation; if present it will re-run the price calculation with the override.

- File & naming conventions:
  - Slugs are used to reference entities: `citySlug` and `transportModeSlug` (match values in `pricing.json`).
  - Pricing/profile identifiers are treated as stable keys and linked via `cityId` / `modeId` in `pricingProfiles`.

- Shared types and validation:
  - Use `shared/schema.ts` zod schemas for request/response shapes and for validating any external JSON if needed.

---

## Where to look for things (quick map)

- Fare calculation: `client/src/lib/estimate.ts`
- Pricing JSON/config: `client/src/data/pricing.json` and `client/src/data/pricing.ts`
- Shared types/schemas: `shared/schema.ts`
- Tailwind / UI styling: `tailwind.config.ts`, `client/src` components
- Build outputs: `dist/`

---

## Existing CI / assistant configs to incorporate

- No dedicated Copilot/Cursor/Claude/Agent config files were found (e.g., `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `.windsurfrules`, etc.).

---

## Notes for future assistant sessions

- Rely on `shared/schema.ts` for authoritative types and shapes rather than inferring shapes from example JSON.
- When exploring pricing behavior, open `client/src/lib/estimate.ts` and `client/src/data/pricing.json` together — they define the rules and how they are evaluated.
- Do not assume tests or linters are present; check `package.json` before attempting to run tests or lint commands.

