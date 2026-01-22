# Modular Travel Price Estimator - Deployment & Database Guide

This application is a flexible transportation pricing engine built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Deployment Guide

### 1. Environment Setup
The application requires a PostgreSQL database. Ensure the following environment variables are set:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `SESSION_SECRET`: A secure string for session management.

### 2. Installation
```bash
npm install
```

### 3. Database Initialization
This project uses Drizzle ORM. Sync your schema and seed the database with the initial pilot data:
```bash
# Push schema to database
npm run db:push

# The application automatically seeds the Casablanca pilot data on first run
npm run dev
```

### 4. Replit Deployment
1. Open the **Deployments** tool in Replit.
2. Select **Autoscale** (recommended for web apps).
3. Configure the machine power (CPU/RAM).
4. Click **Deploy**.

---

## 🗄️ Database Documentation

The database schema is managed via Drizzle ORM and is located in `shared/schema.ts`.

### Tables Overview

#### 1. `cities`
Stores city-specific metadata and currency.
- `id` (UUID): Primary Key
- `name` (String): Display name
- `slug` (String): URL-friendly identifier
- `currencyCode` (String): e.g., "MAD"
- `timezone` (String): e.g., "Africa/Casablanca"

#### 2. `transport_modes`
Stores available transportation types.
- `id` (UUID): Primary Key
- `name` (String): e.g., "Small Red Taxi"
- `slug` (String): e.g., "petit_taxi_red"
- `iconUrl` (String): Path to the icon

#### 3. `pricing_profiles`
The core configuration table for the pricing engine.
- `id` (UUID): Primary Key
- `cityId` (FK): Links to `cities`
- `modeId` (FK): Links to `transport_modes`
- `rulesConfig` (JSONB): Contains the pricing logic (base fare, steps, night surcharges, etc.)

### Initial Seed Data (Casablanca Pilot)
The application comes pre-configured with the Casablanca Petit Taxi rules in the `pricing_profiles` table.

**Rules Config JSON:**
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
