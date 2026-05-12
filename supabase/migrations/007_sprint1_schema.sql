-- =============================================================================
-- 007_sprint1_schema.sql
-- Sprint 1 — Cotizador Engine: Additive schema extension + richer seed data.
-- Requires: migrations 001-006 already applied.
-- Safe to apply with existing User A row and Sprint 0 printer/material rows.
-- ALL new columns are nullable or have DEFAULT → zero NOT NULL retrofits.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend ref_printer_models
-- ---------------------------------------------------------------------------

ALTER TABLE ref_printer_models
  ADD COLUMN IF NOT EXISTS gcode_identifiers     TEXT[]         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS popularity_rank       INTEGER        NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS estimated_life_hours  INTEGER        NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS firmware_type         TEXT           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nozzle_diameter_default NUMERIC(4,2) DEFAULT 0.4,
  ADD COLUMN IF NOT EXISTS full_name             TEXT           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reference_price_ars   NUMERIC(12,2)  DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- 2. Extend ref_filament_catalog
-- ---------------------------------------------------------------------------

ALTER TABLE ref_filament_catalog
  ADD COLUMN IF NOT EXISTS gcode_identifiers  TEXT[]        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS popularity_rank    INTEGER       NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS nozzle_temp_min    INTEGER       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nozzle_temp_max    INTEGER       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bed_temp_min       INTEGER       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bed_temp_max       INTEGER       DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS filament_diameter  NUMERIC(4,2)  NOT NULL DEFAULT 1.75;

-- ---------------------------------------------------------------------------
-- 3. Extend printers (user-owned rows)
-- ---------------------------------------------------------------------------

ALTER TABLE printers
  ADD COLUMN IF NOT EXISTS life_hours_estimate  INTEGER       NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS nozzle_diameter      NUMERIC(4,2)  NOT NULL DEFAULT 0.4,
  ADD COLUMN IF NOT EXISTS accumulated_hours    NUMERIC(8,2)  NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 4. Extend materials (user-owned rows)
-- ---------------------------------------------------------------------------

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS filament_diameter  NUMERIC(4,2)  NOT NULL DEFAULT 1.75,
  ADD COLUMN IF NOT EXISTS nozzle_temp        INTEGER       DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- 5. Extend users
-- ---------------------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS labor_rate_hour        NUMERIC(10,2) DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS default_margin_percent NUMERIC(5,2)  DEFAULT 100,
  ADD COLUMN IF NOT EXISTS default_labor_factor   NUMERIC(4,2)  DEFAULT 0.20,
  ADD COLUMN IF NOT EXISTS logo_url               TEXT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan                   TEXT          NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS business_phone         TEXT          DEFAULT NULL;

-- Optional: add CHECK constraint on plan if column was just added (no existing rows violate it)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE users
  ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro', 'farm'));

-- ---------------------------------------------------------------------------
-- 6. Seed ref_printer_models — 6 ranked models with gcode_identifiers
--    Strategy: UPDATE existing rows (identified by brand+model), then INSERT
--    any that are missing.  Re-running is safe (UPDATE on missing row = no-op,
--    INSERT … ON CONFLICT DO NOTHING for already-present rows).
-- ---------------------------------------------------------------------------

-- 6a. Creality Ender 3 V3 SE  (rank 1)
UPDATE ref_printer_models
SET
  gcode_identifiers    = ARRAY['ender 3 v3', 'ender3v3', 'creality_ender_3', 'ender-3 v3 se', 'ender 3 v3 se'],
  popularity_rank      = 1,
  estimated_life_hours = 5000,
  firmware_type        = 'Marlin',
  nozzle_diameter_default = 0.4,
  full_name            = 'Creality Ender 3 V3 SE',
  reference_price_ars  = 280000,
  last_updated         = CURRENT_DATE
WHERE brand = 'Creality' AND model = 'Ender 3 V3 SE';

-- 6b. Bambu Lab A1 Mini  (rank 2)
UPDATE ref_printer_models
SET
  gcode_identifiers    = ARRAY['bambu lab a1 mini', 'a1_mini', 'a1 mini', 'bambu a1 mini'],
  popularity_rank      = 2,
  estimated_life_hours = 6000,
  firmware_type        = 'Bambu',
  nozzle_diameter_default = 0.4,
  full_name            = 'Bambu Lab A1 Mini',
  reference_price_ars  = 580000,
  last_updated         = CURRENT_DATE
WHERE brand = 'Bambu Lab' AND model = 'A1 Mini';

-- 6c. Bambu Lab X1 Carbon  (rank 3)
UPDATE ref_printer_models
SET
  gcode_identifiers    = ARRAY['bambu lab x1', 'x1c', 'x1 carbon', 'bambu x1c', 'x1 carbon bbl'],
  popularity_rank      = 3,
  estimated_life_hours = 6000,
  firmware_type        = 'Bambu',
  nozzle_diameter_default = 0.4,
  full_name            = 'Bambu Lab X1 Carbon',
  reference_price_ars  = 950000,
  last_updated         = CURRENT_DATE
WHERE brand = 'Bambu Lab' AND model = 'X1 Carbon';

-- 6d. Creality K1  (rank 4) — INSERT because 002 seeded K1 Smart, not K1
INSERT INTO ref_printer_models
  (brand, model, bed_x_mm, bed_y_mm, bed_z_mm, power_w, gcode_identifiers,
   popularity_rank, estimated_life_hours, firmware_type, nozzle_diameter_default,
   full_name, reference_price_ars, last_updated)
VALUES
  ('Creality', 'K1', 220, 220, 250, 350,
   ARRAY['k1', 'creality k1', 'creality_k1'],
   4, 5000, 'Klipper', 0.4, 'Creality K1', 420000, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Also update CR-10 Smart to K1 Smart entry if it exists (re-tagging)
UPDATE ref_printer_models
SET
  gcode_identifiers    = ARRAY['k1', 'creality k1', 'creality_k1'],
  popularity_rank      = 4,
  firmware_type        = 'Klipper',
  full_name            = 'Creality K1',
  reference_price_ars  = 420000,
  last_updated         = CURRENT_DATE
WHERE brand = 'Creality' AND model = 'CR-10 Smart' AND
  NOT EXISTS (SELECT 1 FROM ref_printer_models WHERE brand = 'Creality' AND model = 'K1');

-- 6e. Anycubic Kobra 2 Pro  (rank 5)
UPDATE ref_printer_models
SET
  gcode_identifiers    = ARRAY['kobra', 'anycubic kobra', 'kobra 2 pro', 'kobra2pro'],
  popularity_rank      = 5,
  estimated_life_hours = 4000,
  firmware_type        = 'Marlin',
  nozzle_diameter_default = 0.4,
  full_name            = 'Anycubic Kobra 2 Pro',
  reference_price_ars  = 320000,
  last_updated         = CURRENT_DATE
WHERE brand = 'Anycubic' AND model = 'Kobra 2 Pro';

-- 6f. Prusa MK4  (rank 6)
UPDATE ref_printer_models
SET
  gcode_identifiers    = ARRAY['mk4', 'original prusa mk4', 'prusa_mk4', 'prusa mk4'],
  popularity_rank      = 6,
  estimated_life_hours = 8000,
  firmware_type        = 'Marlin',
  nozzle_diameter_default = 0.4,
  full_name            = 'Prusa MK4',
  reference_price_ars  = 720000,
  last_updated         = CURRENT_DATE
WHERE brand = 'Prusa' AND model = 'MK4';

-- Ensure all 6 target printers exist (safety INSERTs for rows not in 002 seed)
INSERT INTO ref_printer_models
  (brand, model, bed_x_mm, bed_y_mm, bed_z_mm, power_w, gcode_identifiers,
   popularity_rank, estimated_life_hours, firmware_type, nozzle_diameter_default,
   full_name, reference_price_ars, last_updated)
VALUES
  ('Creality', 'Ender 3 V3 SE', 220, 220, 250, 300,
   ARRAY['ender 3 v3', 'ender3v3', 'creality_ender_3', 'ender-3 v3 se', 'ender 3 v3 se'],
   1, 5000, 'Marlin', 0.4, 'Creality Ender 3 V3 SE', 280000, CURRENT_DATE),
  ('Bambu Lab', 'A1 Mini', 180, 180, 180, 250,
   ARRAY['bambu lab a1 mini', 'a1_mini', 'a1 mini', 'bambu a1 mini'],
   2, 6000, 'Bambu', 0.4, 'Bambu Lab A1 Mini', 580000, CURRENT_DATE),
  ('Bambu Lab', 'X1 Carbon', 256, 256, 256, 350,
   ARRAY['bambu lab x1', 'x1c', 'x1 carbon', 'bambu x1c', 'x1 carbon bbl'],
   3, 6000, 'Bambu', 0.4, 'Bambu Lab X1 Carbon', 950000, CURRENT_DATE),
  ('Anycubic', 'Kobra 2 Pro', 220, 220, 250, 300,
   ARRAY['kobra', 'anycubic kobra', 'kobra 2 pro', 'kobra2pro'],
   5, 4000, 'Marlin', 0.4, 'Anycubic Kobra 2 Pro', 320000, CURRENT_DATE),
  ('Prusa', 'MK4', 250, 210, 220, 200,
   ARRAY['mk4', 'original prusa mk4', 'prusa_mk4', 'prusa mk4'],
   6, 8000, 'Marlin', 0.4, 'Prusa MK4', 720000, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Seed ref_filament_catalog — Argentine brands × PLA + PETG = 8 rows
--    UPDATE existing rows, INSERT missing ones, all idempotent via ON CONFLICT.
-- ---------------------------------------------------------------------------

-- 7a. PrintaLot PLA
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['printalot', 'pla printalot', 'printalot pla'],
  popularity_rank   = 1,
  nozzle_temp_min   = 195,
  nozzle_temp_max   = 215,
  bed_temp_min      = 50,
  bed_temp_max      = 60,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = 'PrintaLot' AND material_type = 'PLA';

-- 7b. PrintaLot PETG
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['printalot petg', 'petg printalot'],
  popularity_rank   = 5,
  nozzle_temp_min   = 230,
  nozzle_temp_max   = 250,
  bed_temp_min      = 70,
  bed_temp_max      = 85,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = 'PrintaLot' AND material_type = 'PETG';

-- 7c. Grilon3 PLA
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['grilon3', 'grilon 3', 'grilon3 pla'],
  popularity_rank   = 2,
  nozzle_temp_min   = 195,
  nozzle_temp_max   = 215,
  bed_temp_min      = 50,
  bed_temp_max      = 60,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = 'Grilon3' AND material_type = 'PLA';

-- 7d. Grilon3 PETG
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['grilon3 petg', 'grilon 3 petg'],
  popularity_rank   = 6,
  nozzle_temp_min   = 230,
  nozzle_temp_max   = 250,
  bed_temp_min      = 70,
  bed_temp_max      = 85,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = 'Grilon3' AND material_type = 'PETG';

-- 7e. Hellbot PLA
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['hellbot', 'hellbot pla'],
  popularity_rank   = 3,
  nozzle_temp_min   = 195,
  nozzle_temp_max   = 215,
  bed_temp_min      = 50,
  bed_temp_max      = 60,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = 'Hellbot' AND material_type = 'PLA';

-- 7f. Hellbot PETG
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['hellbot petg'],
  popularity_rank   = 7,
  nozzle_temp_min   = 230,
  nozzle_temp_max   = 250,
  bed_temp_min      = 70,
  bed_temp_max      = 85,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = 'Hellbot' AND material_type = 'PETG';

-- 7g. 3N3 PLA
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['3n3', '3n3 filaments', '3n3 pla'],
  popularity_rank   = 4,
  nozzle_temp_min   = 195,
  nozzle_temp_max   = 215,
  bed_temp_min      = 50,
  bed_temp_max      = 60,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = '3N3' AND material_type = 'PLA';

-- 7h. 3N3 PETG
UPDATE ref_filament_catalog
SET
  gcode_identifiers = ARRAY['3n3 petg', '3n3 filaments petg'],
  popularity_rank   = 8,
  nozzle_temp_min   = 230,
  nozzle_temp_max   = 250,
  bed_temp_min      = 70,
  bed_temp_max      = 85,
  filament_diameter = 1.75,
  last_updated      = CURRENT_DATE
WHERE brand = '3N3' AND material_type = 'PETG';

-- Safety INSERTs for Argentine brands not present in Sprint 0 seed
-- (002 seeded eSUN, PrintaFlex, Polymaker, Bambu Lab — NOT the AR brands)
INSERT INTO ref_filament_catalog
  (brand, material_type, color, price_per_kg_ars, density_g_cm3,
   gcode_identifiers, popularity_rank,
   nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max,
   filament_diameter, last_updated)
VALUES
  ('PrintaLot', 'PLA',  'Natural', 14500, 1.24,
   ARRAY['printalot', 'pla printalot', 'printalot pla'], 1,
   195, 215, 50, 60, 1.75, CURRENT_DATE),
  ('PrintaLot', 'PETG', 'Natural', 17800, 1.27,
   ARRAY['printalot petg', 'petg printalot'], 5,
   230, 250, 70, 85, 1.75, CURRENT_DATE),
  ('Grilon3',   'PLA',  'Natural', 13900, 1.24,
   ARRAY['grilon3', 'grilon 3', 'grilon3 pla'], 2,
   195, 215, 50, 60, 1.75, CURRENT_DATE),
  ('Grilon3',   'PETG', 'Natural', 16500, 1.27,
   ARRAY['grilon3 petg', 'grilon 3 petg'], 6,
   230, 250, 70, 85, 1.75, CURRENT_DATE),
  ('Hellbot',   'PLA',  'Natural', 13500, 1.24,
   ARRAY['hellbot', 'hellbot pla'], 3,
   195, 215, 50, 60, 1.75, CURRENT_DATE),
  ('Hellbot',   'PETG', 'Natural', 16000, 1.27,
   ARRAY['hellbot petg'], 7,
   230, 250, 70, 85, 1.75, CURRENT_DATE),
  ('3N3',       'PLA',  'Natural', 13200, 1.24,
   ARRAY['3n3', '3n3 filaments', '3n3 pla'], 4,
   195, 215, 50, 60, 1.75, CURRENT_DATE),
  ('3N3',       'PETG', 'Natural', 15800, 1.27,
   ARRAY['3n3 petg', '3n3 filaments petg'], 8,
   230, 250, 70, 85, 1.75, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Verification: User A row preservation check
-- Run this SELECT after applying the migration to confirm the row is intact.
-- Expected: returns 1 row with onboarding_completed = true
--
-- SELECT id, email, onboarding_completed, labor_rate_hour, default_margin_percent,
--        default_labor_factor, plan
-- FROM users
-- WHERE onboarding_completed = true;
--
-- Expected output: ≥1 row, onboarding_completed = true,
--   labor_rate_hour = 1500 (default applied to existing row),
--   default_margin_percent = 100, default_labor_factor = 0.20, plan = 'free'
--
-- Also verify new columns on ref tables:
-- SELECT count(*) FROM ref_printer_models WHERE gcode_identifiers IS NOT NULL;
-- -- Expected: ≥ 6
--
-- SELECT count(*) FROM ref_filament_catalog WHERE gcode_identifiers IS NOT NULL;
-- -- Expected: ≥ 8
-- ---------------------------------------------------------------------------
