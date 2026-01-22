-- SQL Export of the Casablanca Pilot Schema --

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  currency_code VARCHAR(3) NOT NULL,
  timezone VARCHAR(255) NOT NULL
);

-- Transport Modes Table
CREATE TABLE IF NOT EXISTS transport_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  icon_url VARCHAR(500)
);

-- Pricing Profiles Table
CREATE TABLE IF NOT EXISTS pricing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES cities(id) NOT NULL,
  mode_id UUID REFERENCES transport_modes(id) NOT NULL,
  pricing_strategy VARCHAR(50) NOT NULL DEFAULT 'METERED',
  active BOOLEAN NOT NULL DEFAULT true,
  rules_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
