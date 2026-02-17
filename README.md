# Dalil (دليل) - Client-Side Price Estimator

> **"Your city, decoded."** | **"طريقك، بكل بساطة"**

A lightweight, client-side transportation pricing engine. Dalil prioritizes speed, privacy, and cultural resonance, functioning entirely without a backend to provide instant fare calculations.

## Brand Essence

**Dalil (دليل)** means "Guide," "Proof," or "Evidence" in Arabic. It represents clarity in a complex city landscape.

- **Privacy by Design:** No backend means user data never leaves their device
- **Cultural Roots:** Deeply inspired by Arabic calligraphy and geometric art
- **Zero Friction:** Lightweight, static, and instant

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
