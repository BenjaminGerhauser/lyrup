-- =============================================================================
-- 010_seed_printer_models_expansion.sql
-- Sprint 2 follow-up: expand ref_printer_models to cover modern AR/LATAM stock.
-- Original seed (migration 002 + 007) only had ~10 models. Real users own
-- Ender 3 V3 Plus / K1 family, Bambu A1/P1 family, Sovol SV0X, Anycubic Kobra
-- 2/3, Elegoo Neptune 4, Prusa MK4S, etc.
--
-- All INSERTs use ON CONFLICT DO NOTHING so this migration is idempotent and
-- safe to re-run.
-- =============================================================================

INSERT INTO ref_printer_models
  (brand, model, bed_x_mm, bed_y_mm, bed_z_mm, power_w, gcode_identifiers,
   popularity_rank, estimated_life_hours, firmware_type, nozzle_diameter_default,
   full_name, reference_price_ars, last_updated)
VALUES
  -- Creality — Ender 3 family
  ('Creality', 'Ender 3 V3', 220, 220, 250, 300,
   ARRAY['ender-3 v3', 'ender 3 v3', 'creality ender-3 v3', 'creality_ender_3_v3'],
   7, 5000, 'Klipper', 0.4, 'Creality Ender 3 V3', 380000, CURRENT_DATE),
  ('Creality', 'Ender 3 V3 Plus', 300, 300, 330, 350,
   ARRAY['ender-3 v3 plus', 'ender 3 v3 plus', 'ender3v3plus',
         'creality ender-3 v3 plus', 'creality_ender_3_v3_plus'],
   8, 5000, 'Klipper', 0.4, 'Creality Ender 3 V3 Plus', 520000, CURRENT_DATE),
  ('Creality', 'Ender 3 V3 KE', 220, 220, 240, 350,
   ARRAY['ender-3 v3 ke', 'ender 3 v3 ke', 'ender3v3ke',
         'creality ender-3 v3 ke', 'creality_ender_3_v3_ke'],
   9, 5000, 'Klipper', 0.4, 'Creality Ender 3 V3 KE', 460000, CURRENT_DATE),
  ('Creality', 'K1 Max', 300, 300, 300, 500,
   ARRAY['k1 max', 'k1max', 'creality k1 max', 'creality_k1_max'],
   10, 5000, 'Klipper', 0.4, 'Creality K1 Max', 760000, CURRENT_DATE),
  ('Creality', 'K1C', 220, 220, 250, 350,
   ARRAY['k1c', 'creality k1c', 'creality_k1c'],
   11, 5000, 'Klipper', 0.4, 'Creality K1C', 580000, CURRENT_DATE),
  ('Creality', 'CR-10 SE', 220, 220, 265, 350,
   ARRAY['cr-10 se', 'cr10 se', 'creality cr-10 se', 'cr_10_se'],
   12, 5000, 'Klipper', 0.4, 'Creality CR-10 SE', 460000, CURRENT_DATE),

  -- Bambu Lab
  ('Bambu Lab', 'A1', 256, 256, 256, 350,
   ARRAY['bambu lab a1', 'bambu_a1', 'a1', 'bambu lab_a1'],
   13, 6000, 'Bambu', 0.4, 'Bambu Lab A1', 780000, CURRENT_DATE),
  ('Bambu Lab', 'P1S', 256, 256, 256, 350,
   ARRAY['bambu lab p1s', 'p1s', 'bambu_p1s', 'bambu lab_p1s'],
   14, 6000, 'Bambu', 0.4, 'Bambu Lab P1S', 870000, CURRENT_DATE),
  ('Bambu Lab', 'P1P', 256, 256, 256, 350,
   ARRAY['bambu lab p1p', 'p1p', 'bambu_p1p'],
   15, 6000, 'Bambu', 0.4, 'Bambu Lab P1P', 700000, CURRENT_DATE),

  -- Anycubic
  ('Anycubic', 'Kobra 3', 250, 250, 260, 300,
   ARRAY['kobra 3', 'kobra3', 'anycubic kobra 3', 'anycubic_kobra_3'],
   16, 5000, 'Klipper', 0.4, 'Anycubic Kobra 3', 380000, CURRENT_DATE),
  ('Anycubic', 'Kobra 2 Max', 420, 420, 500, 400,
   ARRAY['kobra 2 max', 'kobra2max', 'anycubic kobra 2 max'],
   17, 4000, 'Marlin', 0.4, 'Anycubic Kobra 2 Max', 600000, CURRENT_DATE),
  ('Anycubic', 'Kobra S1', 250, 250, 250, 350,
   ARRAY['kobra s1', 'anycubic kobra s1', 'kobra_s1'],
   18, 5000, 'Klipper', 0.4, 'Anycubic Kobra S1', 720000, CURRENT_DATE),

  -- Prusa
  ('Prusa', 'MK4S', 250, 210, 220, 200,
   ARRAY['mk4s', 'original prusa mk4s', 'prusa mk4s', 'prusa_mk4s'],
   19, 8000, 'Marlin', 0.4, 'Prusa MK4S', 880000, CURRENT_DATE),
  ('Prusa', 'Core One', 250, 220, 270, 230,
   ARRAY['core one', 'prusa core one', 'core_one', 'prusa_core_one'],
   20, 8000, 'Marlin', 0.4, 'Prusa Core One', 1200000, CURRENT_DATE),

  -- Sovol (popular en AR por precio/calidad)
  ('Sovol', 'SV06', 220, 220, 250, 250,
   ARRAY['sv06', 'sovol sv06', 'sovol_sv06'],
   21, 5000, 'Marlin', 0.4, 'Sovol SV06', 350000, CURRENT_DATE),
  ('Sovol', 'SV06 Plus', 300, 300, 340, 300,
   ARRAY['sv06 plus', 'sv06plus', 'sovol sv06 plus', 'sovol_sv06_plus'],
   22, 5000, 'Marlin', 0.4, 'Sovol SV06 Plus', 480000, CURRENT_DATE),
  ('Sovol', 'SV07', 220, 220, 250, 350,
   ARRAY['sv07', 'sovol sv07', 'sovol_sv07'],
   23, 5000, 'Klipper', 0.4, 'Sovol SV07', 430000, CURRENT_DATE),
  ('Sovol', 'SV07 Plus', 300, 300, 340, 400,
   ARRAY['sv07 plus', 'sv07plus', 'sovol sv07 plus'],
   24, 5000, 'Klipper', 0.4, 'Sovol SV07 Plus', 560000, CURRENT_DATE),

  -- Elegoo
  ('Elegoo', 'Neptune 4', 225, 225, 265, 300,
   ARRAY['neptune 4', 'neptune4', 'elegoo neptune 4'],
   25, 5000, 'Klipper', 0.4, 'Elegoo Neptune 4', 380000, CURRENT_DATE),
  ('Elegoo', 'Neptune 4 Pro', 225, 225, 265, 350,
   ARRAY['neptune 4 pro', 'neptune4pro', 'elegoo neptune 4 pro'],
   26, 5000, 'Klipper', 0.4, 'Elegoo Neptune 4 Pro', 460000, CURRENT_DATE),
  ('Elegoo', 'Neptune 4 Plus', 320, 320, 385, 400,
   ARRAY['neptune 4 plus', 'neptune4plus', 'elegoo neptune 4 plus'],
   27, 5000, 'Klipper', 0.4, 'Elegoo Neptune 4 Plus', 560000, CURRENT_DATE),
  ('Elegoo', 'Centauri Carbon', 256, 256, 256, 350,
   ARRAY['centauri carbon', 'elegoo centauri carbon', 'centauri_carbon'],
   28, 6000, 'Klipper', 0.4, 'Elegoo Centauri Carbon', 780000, CURRENT_DATE),

  -- FlashForge
  ('FlashForge', 'Adventurer 5M', 220, 220, 220, 300,
   ARRAY['adventurer 5m', 'adventurer5m', 'flashforge adventurer 5m'],
   29, 5000, 'Klipper', 0.4, 'FlashForge Adventurer 5M', 520000, CURRENT_DATE),
  ('FlashForge', 'Adventurer 5M Pro', 220, 220, 220, 350,
   ARRAY['adventurer 5m pro', 'adventurer5mpro', 'flashforge adventurer 5m pro'],
   30, 5000, 'Klipper', 0.4, 'FlashForge Adventurer 5M Pro', 680000, CURRENT_DATE),

  -- Voxelab (entry-level, popular AR)
  ('Voxelab', 'Aquila X2', 220, 220, 250, 250,
   ARRAY['aquila x2', 'aquila_x2', 'voxelab aquila x2', 'voxelab_aquila'],
   31, 4000, 'Marlin', 0.4, 'Voxelab Aquila X2', 280000, CURRENT_DATE)

ON CONFLICT DO NOTHING;
