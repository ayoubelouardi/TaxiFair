# TaxiFair - Client-Side Price Estimator

A lightweight, client-side transportation pricing engine. This application functions entirely without a backend or database, using local static data for fare calculations.

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development
```bash
npm run dev
```

### 3. Build & Production
To build the static application:
```bash
npm run build
```
The output will be in the `dist/` folder, ready for static hosting.

---

## 🏗️ Architecture

This application is now a fully client-side React application.

- **Data Source**: Pricing rules, cities, and transport modes are stored in `client/src/data/pricing.json`.
- **Estimation Engine**: The logic for calculating fares (distance, night surcharges, minimum fares) resides in `client/src/lib/estimate.ts`.
- **UI Components**: Built with React, Tailwind CSS, and Shadcn UI.
- **Maps**: Uses Leaflet for origin/destination selection.

## 🗄️ Pricing Configuration

The pricing engine is configured via JSON. You can modify the rules in `client/src/data/pricing.json`.

**Example Rules Config:**
```json
{
  "base_fare": 2.00,
  "minimum_fare": 7.50,
  "distance_step_meters": 80,
  "price_per_step": 0.20,
  "night_surcharge_percent": 50,
  "night_start_hour": 20,
  "night_end_hour": 6,
  "enabled_rules": ["BASE_FARE", "DISTANCE_STEP_CALC", "MINIMUM_CHECK", "NIGHT_MULTIPLIER"]
}
```
