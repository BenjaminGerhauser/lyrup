# Lyrup -- Sprint 1 Manual Acceptance Walkthrough

This runbook verifies that Sprint 1 (Cotizador Engine) is working correctly in
a local development environment. Execute all steps in order, using a single
authenticated user account, after applying all migrations up to and including
`007_sprint1_schema.sql`.

**Time required**: approximately 25 minutes.

---

## Table of Contents

1. [Pre-requisites](#1-pre-requisites)
2. [Step 1 -- Printers: add via catalog](#2-step-1----printers-add-via-catalog)
3. [Step 2 -- Printers: manual entry](#3-step-2----printers-manual-entry)
4. [Step 3 -- Printers: edit and persist](#4-step-3----printers-edit-and-persist)
5. [Step 4 -- Printers: delete with confirmation](#5-step-4----printers-delete-with-confirmation)
6. [Step 5 -- Materials: full CRUD](#6-step-5----materials-full-crud)
7. [Step 6 -- Configuracion: province, rates, business data](#7-step-6----configuracion-province-rates-business-data)
8. [Step 7 -- Pure-function tests (automated)](#8-step-7----pure-function-tests-automated)
9. [Step 8 -- Seed data validation in Supabase Dashboard](#9-step-8----seed-data-validation-in-supabase-dashboard)
10. [Expected Results Summary](#10-expected-results-summary)
11. [Known Debt -- not blocking acceptance](#11-known-debt----not-blocking-acceptance)

---

## 1. Pre-requisites

- Node.js 20+ and pnpm installed locally.
- Supabase project with all migrations applied (`001` through `007`):

  ```sql
  -- Verify via Supabase SQL Editor
  SELECT name FROM supabase_migrations.schema_migrations ORDER BY name;
  ```

  Expected: 7 rows ending in `007_sprint1_schema`.

- Environment variables configured in `lyrup/.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

- App running locally:

  ```bash
  cd lyrup
  pnpm dev
  # open http://localhost:3000
  ```

- A registered and logged-in user (complete onboarding if prompted).

---

## 2. Step 1 -- Printers: add via catalog

**Goal**: verify brand/model selectors auto-fill technical fields and the printer
appears in the list with the "Origen: catálogo" badge.

1. Navigate to `http://localhost:3000/impresoras`.
2. Click **Agregar impresora**.
3. In the **Marca** dropdown, select any brand (e.g. "Bambu Lab").
4. In the **Modelo** dropdown, select a model (e.g. "P1S").
5. Verify that the following fields auto-fill from the catalog:
   - Potencia (W) -- should match `ref_printer_models.power_w`
   - Volumen de impresión -- bed X / Y / Z from the catalog row
   - Horas de vida estimadas -- from `estimated_life_hours`
6. Optionally set **Precio de compra** and **Nombre personalizado**.
7. Click **Guardar**.
8. Verify the printer card appears in the list with a badge reading **"Origen: catálogo"**.
9. Verify the card shows the printer model name and auto-filled wattage.

**Expected**: printer saved, badge visible, no 500 error.

---

## 3. Step 2 -- Printers: manual entry

**Goal**: verify the "Mi impresora no está en la lista" path and the
"Origen: manual" badge.

1. On `/impresoras`, click **Agregar impresora**.
2. Click the link or button labelled **"Mi impresora no está en la lista"**
   (or equivalent label that bypasses the catalog selectors).
3. Fill in all required fields manually:
   - Nombre: `Printer Test Manual`
   - Potencia (W): `350`
   - Horas de vida: `2000`
   - (Precio de compra and other optional fields can be left blank)
4. Click **Guardar**.
5. Verify the new printer card appears in the list with a badge reading **"Origen: manual"**.
6. Verify `printer_model_id` is `NULL` for this row (check via Supabase SQL Editor):

   ```sql
   SELECT id, name, printer_model_id FROM public.printers
   WHERE name = 'Printer Test Manual';
   ```

   Expected: `printer_model_id` is `NULL`.

**Expected**: printer saved with manual badge, no catalog FK.

---

## 4. Step 3 -- Printers: edit and persist

**Goal**: verify that editing a printer's price and name persists across a full
page reload.

1. On `/impresoras`, find the catalog-sourced printer from Step 1.
2. Click its **Editar** (or pencil icon) button.
3. Change the **Precio de compra** field to `850000`.
4. Change the **Nombre personalizado** field to `Mi Prusa Editada`.
5. Click **Guardar**.
6. Reload the page (F5 or Cmd+R).
7. Verify the printer card still shows:
   - Name: `Mi Prusa Editada`
   - Purchase price: `$850.000` (or equivalent formatted value)

**Expected**: changes persisted in `printers` table, not reset on reload.

> **Known debt**: the `purchase_date` column is not present in the `printers`
> schema. If the edit form shows a "Fecha de compra" date picker, its value is
> silently dropped. This is tracked debt — see Section 11.

---

## 5. Step 4 -- Printers: delete with confirmation

**Goal**: verify the confirmation modal appears before deletion and the row is
actually removed.

1. On `/impresoras`, find the manual printer from Step 2.
2. Click its **Eliminar** (or trash icon) button.
3. Verify a confirmation dialog appears asking you to confirm the deletion.
   The dialog must show the printer name and require an explicit confirm action.
4. Click **Confirmar** (or equivalent).
5. Verify the printer card disappears from the list.
6. Verify the row is deleted in Supabase:

   ```sql
   SELECT COUNT(*) FROM public.printers WHERE name = 'Printer Test Manual';
   ```

   Expected: `0`.

**Expected**: modal displayed, row deleted after confirmation, no rows orphaned.

---

## 6. Step 5 -- Materials: full CRUD

**Goal**: repeat the same four operations (add via catalog, manual entry, edit,
delete) for the `/materiales` route.

### 5.1 -- Add via catalog

1. Navigate to `http://localhost:3000/materiales`.
2. Click **Agregar material**.
3. Select a filament from the catalog (e.g. "Prusament PLA").
4. Verify the **Precio de referencia** field auto-fills from the catalog (`price_per_kg_ars`).
5. Verify a badge reads **"Precio de referencia: $XX.XXX/kg"** (or equivalent).
6. Click **Guardar**.
7. Verify the material card appears in the list with a reference-price badge.

### 5.2 -- Manual entry

1. Click **Agregar material**.
2. Click **"Mi filamento no está en la lista"** (bypass catalog).
3. Fill in:
   - Nombre: `Filamento Test Manual`
   - Tipo: `PLA`
   - Color: pick any color via the color picker
   - Precio/kg: `12000`
4. Click **Guardar**.
5. Verify the material card shows the color swatch and **"Origen: manual"** badge.
6. Verify `filament_id` is `NULL` in Supabase:

   ```sql
   SELECT id, name, filament_id, color FROM public.materials
   WHERE name = 'Filamento Test Manual';
   ```

### 5.3 -- Edit price override

1. Find the catalog-sourced material from 5.1.
2. Click **Editar**.
3. Change **Precio/kg** to `25000` (override above catalog price).
4. Click **Guardar**.
5. Reload the page.
6. Verify the material card shows `$25.000/kg` (custom price, not catalog default).

### 5.4 -- Delete

1. Find the manual material from 5.2.
2. Click **Eliminar**.
3. Confirm the deletion in the modal.
4. Verify the card disappears and the row is gone from Supabase:

   ```sql
   SELECT COUNT(*) FROM public.materials WHERE name = 'Filamento Test Manual';
   ```

   Expected: `0`.

**Expected**: all four material operations work identically to printers.

---

## 7. Step 6 -- Configuracion: province, rates, business data

**Goal**: verify that the configuration page auto-fills electricity rate from
the province reference catalog and that all saved values persist.

1. Navigate to `http://localhost:3000/configuracion`.
2. In the **Provincia** selector, pick any province (e.g. "Buenos Aires").
3. Verify the **Tarifa eléctrica ($/kWh)** field auto-fills to the catalog value
   for that province (from `ref_electricity_rates`).
4. Manually override the electricity rate to `135`.
5. Set the following fields:
   - Tarifa de mano de obra ($/hr): `2000`
   - Factor de mano de obra: `0.2`
   - Margen por defecto: `30`
6. In the **Datos del negocio** section, fill in:
   - Nombre del negocio: `Imprenta 3D Test`
   - Teléfono (optional): `+54 9 11 1234-5678`
7. Click **Guardar** (or **Actualizar configuración**).
8. Verify a success indicator appears (toast, banner, or inline confirmation).
9. Reload the page (F5).
10. Verify all values persist:
    - Province: "Buenos Aires"
    - Electricity rate: `135` (user override retained over catalog default)
    - Labor rate: `2000`
    - Labor factor: `0.2`
    - Margin: `30`
    - Business name: `Imprenta 3D Test`

**Expected**: all settings saved to `public.users` row, reload confirms persistence.

---

## 8. Step 7 -- Pure-function tests (automated)

Run the full Vitest suite to validate `parseGcode`, `matchGcodeToUserEquipment`,
and `calculateCosts` in one command:

```bash
cd lyrup
pnpm test
# or: npx vitest run
```

**Expected output (approximate)**:

```
Test Files  30 passed (30)
     Tests  346 passed (346)
  Duration  ~10s
```

All 346 tests must pass, including the cross-cutting integration suite in
`src/lib/__tests__/sprint1-integration.test.ts` (15 tests, 7 scenarios).

> **Note**: A `node -e "require('./src/lib/cost-calculator.ts')"` terminal check
> is NOT feasible for TypeScript source — rely on the Vitest suite above.

---

## 9. Step 8 -- Seed data validation in Supabase Dashboard

**Goal**: confirm that the Sprint 1 migrations seeded reference data correctly.

Open the **Supabase SQL Editor** and run:

```sql
-- Verify ref_printer_models has gcode_identifiers populated
SELECT brand, model, gcode_identifiers, popularity_rank
FROM public.ref_printer_models
WHERE gcode_identifiers IS NOT NULL
  AND array_length(gcode_identifiers, 1) > 0
LIMIT 5;
```

Expected: at least 1 row returned with a non-empty `gcode_identifiers` array,
e.g. `{MK4, "Original Prusa MK4"}`.

```sql
-- Verify ref_filament_catalog has gcode_identifiers populated
SELECT brand, material_type, gcode_identifiers
FROM public.ref_filament_catalog
WHERE gcode_identifiers IS NOT NULL
LIMIT 5;
```

Expected: at least 1 row with entries like `{PLA}` or `{"PLA Prusament"}`.

```sql
-- Verify ref_electricity_rates has province data
SELECT province, tier, rate_kwh_ars
FROM public.ref_electricity_rates
LIMIT 5;
```

Expected: rows for Argentine provinces with non-zero `rate_kwh_ars` values.

```sql
-- Verify users table has Sprint 1 columns
SELECT id, labor_rate_hour, default_margin_percent, default_labor_factor,
       plan, business_phone
FROM public.users
LIMIT 1;
```

Expected: columns exist (no "column does not exist" error). `business_phone`
was added by the Phase 1 sub-agent and confirmed present in the remote DB.

---

## 10. Expected Results Summary

| Check | Expected result | Pass indicator |
|---|---|---|
| Printer via catalog (Step 1) | Card with "Origen: catálogo" badge, auto-filled fields | Badge visible, no error |
| Printer manual (Step 2) | Card with "Origen: manual" badge, `printer_model_id = NULL` | Badge visible, SQL confirms NULL |
| Printer edit persists (Step 3) | Updated name/price survive reload | Values match after F5 |
| Printer delete (Step 4) | Confirmation modal + row removed | 0 rows in SQL after delete |
| Material via catalog (Step 5.1) | Reference-price badge, catalog FK set | Badge visible |
| Material manual (Step 5.2) | Color swatch, "Origen: manual" badge | Swatch + badge visible |
| Material price override (Step 5.3) | Custom price survives reload | Price shows $25.000/kg after F5 |
| Material delete (Step 5.4) | Row removed after modal confirm | 0 rows in SQL |
| Configuracion province auto-fill (Step 6) | Electricity rate auto-fills on province select | Field updates without manual entry |
| Configuracion saves + persists (Step 6) | All fields survive reload | Values match after F5 |
| Vitest suite (Step 7) | 346/346 tests pass | Exit code 0, no failures |
| Seed data (Step 8) | `gcode_identifiers[]` populated in ref tables | Non-empty arrays in SQL results |

If ALL checks pass: Sprint 1 is accepted. Proceed to Sprint 2.

---

## 11. Known Debt -- not blocking acceptance

These items were discovered during Sprint 1 implementation and are tracked for
future sprints. They do NOT block acceptance of Sprint 1.

| # | Debt | Impact | Future action |
|---|---|---|---|
| 1 | `purchase_date` column absent from `printers` table | Date picker value is silently dropped from FormData; no data loss otherwise | Add column in a future migration |
| 2 | `DeleteConfirmDialog` component duplicated in phases 3, 4, and 5 | Minor maintenance overhead | Refactor to `components/ui/delete-confirm-dialog.tsx` in a future cleanup sprint |
| 3 | `business_phone` added to `users` by Phase 1 sub-agent (not in original spec) | Column exists in DB, works correctly, causes no harm | Document in Sprint 2 spec as an accepted addition |
| 4 | No staging Supabase project | Preview deployments point to production project | Create staging project before Sprint 1 beta |
