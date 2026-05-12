-- =============================================================================
-- 002_cotizador_schema.sql
-- Cotizador SaaS — core tables, RLS policies, triggers, and seed data
-- Requires: 001_waitlist.sql already applied
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared: updated_at trigger function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Reference tables (read-only for authenticated users)
-- ---------------------------------------------------------------------------

CREATE TABLE ref_printer_models (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  bed_x_mm    NUMERIC(7,2),
  bed_y_mm    NUMERIC(7,2),
  bed_z_mm    NUMERIC(7,2),
  power_w     NUMERIC(6,2),
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE ref_filament_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand           TEXT NOT NULL,
  material_type   TEXT NOT NULL,  -- PLA, PETG, ABS, TPU, etc.
  color           TEXT,
  price_per_kg_ars NUMERIC(10,2) NOT NULL,
  density_g_cm3   NUMERIC(5,3) NOT NULL DEFAULT 1.24,
  last_updated    DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE ref_electricity_rates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province         TEXT NOT NULL,
  tier             TEXT NOT NULL DEFAULT 'R1',
  rate_kwh_ars     NUMERIC(10,4) NOT NULL,
  last_updated     DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ---------------------------------------------------------------------------
-- User-scoped tables
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  business_name         TEXT,
  phone                 TEXT,
  province              TEXT,
  electricity_rate_kwh  NUMERIC(10,4),
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE printers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  printer_model_id    UUID REFERENCES ref_printer_models(id),
  power_w             NUMERIC(6,2),
  purchase_price_ars  NUMERIC(12,2),
  depreciation_months INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_printers_user_id ON printers(user_id);

CREATE TRIGGER printers_updated_at
  BEFORE UPDATE ON printers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE materials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  filament_id         UUID REFERENCES ref_filament_catalog(id),
  material_type       TEXT,
  color               TEXT,
  price_per_kg_ars    NUMERIC(10,2),
  density_g_cm3       NUMERIC(5,3) DEFAULT 1.24,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_user_id ON materials(user_id);

CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft | sent | accepted | rejected
  total_ars       NUMERIC(14,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_user_id ON quotes(user_id);

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE quote_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  filament_g      NUMERIC(8,2),
  print_hours     NUMERIC(6,2),
  unit_price_ars  NUMERIC(12,2),
  quantity        INTEGER NOT NULL DEFAULT 1,
  subtotal_ars    NUMERIC(14,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-create users row on Supabase Auth sign-up
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS: enable on all tables
-- ---------------------------------------------------------------------------

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_printer_models    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_filament_catalog  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_electricity_rates ENABLE ROW LEVEL SECURITY;

-- users: owner-all (PK = auth.uid())
CREATE POLICY "users_owner_all" ON users
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- printers: owner-all
CREATE POLICY "printers_owner_all" ON printers
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- materials: owner-all
CREATE POLICY "materials_owner_all" ON materials
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- quotes: owner-all
CREATE POLICY "quotes_owner_all" ON quotes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- quote_items: derived ownership via quotes.user_id
CREATE POLICY "quote_items_owner_all" ON quote_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
        AND quotes.user_id = auth.uid()
    )
  );

-- ref tables: SELECT-only for authenticated users
CREATE POLICY "ref_printer_models_read_all" ON ref_printer_models
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ref_filament_catalog_read_all" ON ref_filament_catalog
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ref_electricity_rates_read_all" ON ref_electricity_rates
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- Seed data for ref_printer_models (placeholder, last_updated = migration date)
-- ---------------------------------------------------------------------------

INSERT INTO ref_printer_models (brand, model, bed_x_mm, bed_y_mm, bed_z_mm, power_w, last_updated) VALUES
  ('Bambu Lab', 'A1 Mini',        180, 180, 180, 250, '2026-05-01'),
  ('Bambu Lab', 'P1S',            256, 256, 256, 350, '2026-05-01'),
  ('Bambu Lab', 'X1 Carbon',      256, 256, 256, 350, '2026-05-01'),
  ('Creality',  'Ender 3 V3 SE',  220, 220, 250, 300, '2026-05-01'),
  ('Creality',  'Ender 3 Pro',    220, 220, 250, 270, '2026-05-01'),
  ('Creality',  'CR-10 Smart',    300, 300, 400, 350, '2026-05-01'),
  ('Prusa',     'MK4',            250, 210, 220, 200, '2026-05-01'),
  ('Prusa',     'Mini+',          180, 180, 180, 180, '2026-05-01'),
  ('Anycubic',  'Kobra 2 Pro',    220, 220, 250, 300, '2026-05-01'),
  ('Anycubic',  'Kobra Max',      400, 400, 450, 350, '2026-05-01');

-- ---------------------------------------------------------------------------
-- Seed data for ref_filament_catalog (ARS prices as of May 2026, placeholder)
-- ---------------------------------------------------------------------------

INSERT INTO ref_filament_catalog (brand, material_type, color, price_per_kg_ars, density_g_cm3, last_updated) VALUES
  ('eSUN',       'PLA',  'Natural',  18500, 1.24, '2026-05-01'),
  ('eSUN',       'PLA',  'Black',    18500, 1.24, '2026-05-01'),
  ('eSUN',       'PETG', 'Clear',    22000, 1.27, '2026-05-01'),
  ('eSUN',       'ABS',  'White',    19000, 1.05, '2026-05-01'),
  ('eSUN',       'TPU',  'Black',    27000, 1.21, '2026-05-01'),
  ('PrintaFlex', 'PLA',  'Natural',  16000, 1.24, '2026-05-01'),
  ('PrintaFlex', 'PETG', 'Black',    19500, 1.27, '2026-05-01'),
  ('Polymaker',  'PolyTerra PLA', 'Matte Black', 24000, 1.24, '2026-05-01'),
  ('Bambu Lab',  'Basic PLA', 'Natural', 30000, 1.24, '2026-05-01'),
  ('Bambu Lab',  'Basic PETG', 'Clear', 34000, 1.27, '2026-05-01');

-- ---------------------------------------------------------------------------
-- Seed data for ref_electricity_rates (ARS/kWh placeholder, Argentine provinces)
-- Tarifa R1 ENRE / distribuidoras provinciales — mayo 2026 (aproximado)
-- ---------------------------------------------------------------------------

INSERT INTO ref_electricity_rates (province, tier, rate_kwh_ars, last_updated) VALUES
  ('Buenos Aires (CABA)',    'R1', 125.50, '2026-05-01'),
  ('Buenos Aires (GBA)',     'R1', 118.20, '2026-05-01'),
  ('Buenos Aires (Interior)','R1',  95.00, '2026-05-01'),
  ('Córdoba',                'R1',  88.40, '2026-05-01'),
  ('Santa Fe',               'R1',  92.30, '2026-05-01'),
  ('Mendoza',                'R1',  80.10, '2026-05-01'),
  ('Tucumán',                'R1',  75.60, '2026-05-01'),
  ('Rosario',                'R1',  92.30, '2026-05-01'),
  ('Neuquén',                'R1',  70.20, '2026-05-01'),
  ('Salta',                  'R1',  68.90, '2026-05-01'),
  ('Entre Ríos',             'R1',  78.50, '2026-05-01'),
  ('Chubut',                 'R1',  65.40, '2026-05-01'),
  ('Misiones',               'R1',  72.00, '2026-05-01'),
  ('Corrientes',             'R1',  69.80, '2026-05-01'),
  ('San Luis',               'R1',  67.30, '2026-05-01'),
  ('La Pampa',               'R1',  73.10, '2026-05-01'),
  ('Jujuy',                  'R1',  66.50, '2026-05-01'),
  ('Río Negro',              'R1',  68.00, '2026-05-01'),
  ('San Juan',               'R1',  71.20, '2026-05-01'),
  ('Formosa',                'R1',  64.80, '2026-05-01'),
  ('Chaco',                  'R1',  65.90, '2026-05-01'),
  ('Catamarca',              'R1',  67.70, '2026-05-01'),
  ('La Rioja',               'R1',  66.00, '2026-05-01'),
  ('Santiago del Estero',    'R1',  63.50, '2026-05-01'),
  ('Santa Cruz',             'R1',  60.20, '2026-05-01'),
  ('Tierra del Fuego',       'R1',  55.80, '2026-05-01');
