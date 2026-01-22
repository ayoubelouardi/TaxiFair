-- Casablanca Pilot Seed Data --

-- 1. Insert City
INSERT INTO cities (name, slug, currency_code, timezone)
VALUES ('Casablanca', 'casablanca', 'MAD', 'Africa/Casablanca');

-- 2. Insert Transport Mode
INSERT INTO transport_modes (name, slug, icon_url)
VALUES ('Small Red Taxi', 'petit_taxi_red', 'taxi-icon.png');

-- 3. Insert Pricing Profile
-- Note: Replace placeholders with actual IDs from previous steps if running manually
INSERT INTO pricing_profiles (city_id, mode_id, pricing_strategy, active, rules_config)
SELECT 
  c.id, 
  tm.id, 
  'METERED', 
  true, 
  '{
    "base_fare": 2.00,
    "minimum_fare": 7.50,
    "distance_step_meters": 80,
    "price_per_step": 0.20,
    "night_surcharge_percent": 50,
    "night_start_hour": 20,
    "night_end_hour": 6,
    "enabled_rules": ["BASE_FARE", "DISTANCE_STEP_CALC", "MINIMUM_CHECK", "NIGHT_MULTIPLIER"]
  }'::jsonb
FROM cities c, transport_modes tm
WHERE c.slug = 'casablanca' AND tm.slug = 'petit_taxi_red';
