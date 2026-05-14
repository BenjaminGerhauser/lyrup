# Sprint 2 — Cotizaciones Flow · Acceptance Runbook

This runbook walks the full flow end-to-end on **staging** before any prod
write. The migration to prod is the LAST step, and only after every check
below is green.

## Pre-flight

- [ ] `pnpm vitest run` → all tests green (≥ 378 expected).
- [ ] `.env.local` points at staging (`wxlgbcakgzqntvuyerij.supabase.co`).
- [ ] `pnpm dev` starts and `/login` loads.

## Migrations checklist

The two Sprint-2 migrations live in `supabase/migrations/`:

- `008_sprint2_quotes.sql` — creates `clients`, extends `quotes` +
  `quote_items`, adds the `recompute_quote_total` trigger.
- `009_printers_purchase_date.sql` — adds `printers.purchase_date` (Sprint 1
  carry-over).

Apply order: **staging first, then prod**. Use MCP
`apply_migration` with the appropriate `project_id`:

| Env     | project_id              |
| ------- | ----------------------- |
| Staging | `wxlgbcakgzqntvuyerij`  |
| Prod    | `wcyzknrhsdqkqmqheged`  |

Staging state at acceptance time:

- [ ] `008_sprint2_quotes` applied ✅ (applied during Sprint 2 dev).
- [ ] `009_printers_purchase_date` applied — verify with
      `SELECT column_name FROM information_schema.columns WHERE table_name='printers' AND column_name='purchase_date';`

## Step 1 — Signup + onboarding (or reuse existing user)

If your staging account exists, skip to Step 2. Otherwise:

1. Go to `/signup`, create a fresh account.
2. Complete the 4-step onboarding wizard with any printer + any filament.
3. Land on `/dashboard` (still the empty stub from Sprint 1 — that is fine).

## Step 2 — Trigger smoke test (mandatory, manual)

We could not run this automatically during dev because the trigger needs a
real authenticated user. Now we have one — do this once.

1. Open `/cotizar`.
2. Create a tiny quote with one item: description "Trigger test", quantity 2,
   unit price (set whatever the calculator produces — even a small G-code).
3. Save the quote.
4. Open the quote detail page. The header total should equal the line item
   subtotal **exactly** (the trigger ran on INSERT).
5. Click "Editar" → change the title → save. Total should NOT change (only
   metadata was updated; trigger fires only on item changes).
6. (Cannot test UPDATE/DELETE of items via the UI in Sprint 2 — the only way
   to edit items is to delete the whole quote and re-create. Note this as
   Sprint 3 follow-up: an item edit UI.)
7. Delete the quote — total disappears with the row.

Expected: total recomputation works on INSERT. **If the displayed total does
not match the per-item subtotal at any point**, the trigger is broken — stop
and investigate before moving on.

## Step 3 — Clients CRUD

1. From `/cotizar`, open the "Nuevo cliente" dialog.
2. Try to save with no name → friendly validation error.
3. Try to save with no WhatsApp → friendly validation error.
4. Try invalid WhatsApp characters (`+54 ABC`) → error.
5. Try invalid email (`not-an-email`) → error.
6. Save a valid client: name "Test Client", WhatsApp "+54 9 11 1234-5678",
   email optional.
7. The client appears immediately in the Select dropdown.

## Step 4 — /cotizar wizard end-to-end (single item)

Use any real `.gcode` file you have lying around (Cura/PrusaSlicer/Orca/Bambu/
Simplify3D all supported).

1. Drag a G-code file onto the upload area.
2. Expect: parsed filename + slicer summary appears.
3. Expect: filament grams + print hours auto-filled.
4. Expect: printer + material auto-selected if the matcher recognised them.
   Otherwise: defaulted to the first option — adjust manually.
5. Edit description / margin / quantity.
6. The cost breakdown card appears under "Detalle de la pieza activa".
7. The right-side summary updates in real time.
8. Select a client from the dropdown.
9. Fill in the title and notes.
10. Click "Guardar cotización" → redirected to `/cotizaciones/[id]`.

## Step 5 — /cotizar wizard multi-item

1. Back on `/cotizar`, click "Agregar pieza".
2. Pieza 2 appears with default margin/labor copied from pieza 1.
3. Switch between piezas via the click-targets in the "Piezas" card — active
   item highlights with primary border + tinted background.
4. Upload a different G-code for pieza 2.
5. Right-side summary now shows two line items + a combined total.
6. Remove pieza 2 with its trash icon → state collapses to one pieza.
7. Add it back and submit → multi-item quote saved.

## Step 6 — /cotizaciones list + filters

1. Open `/cotizaciones`.
2. The two quotes from Step 4 + Step 5 are listed.
3. Each row shows: title, client name (or "Sin cliente"), creation date,
   status badge, total.
4. Search by partial title → only matching quotes remain.
5. Filter by status "Borrador" → only drafts remain.
6. Filter by client → only that client's quotes remain.
7. "Limpiar" wipes all filters.

## Step 7 — /cotizaciones/[id] detail

1. Open the multi-item quote.
2. The Items section lists both piezas with their breakdowns expandable.
3. The Total card shows the sum (= header total).
4. "Editar" opens a dialog to change title / client / notes. Save → reloads
   in place with the new values.
5. The status dropdown lets you flip to "Enviada" / "Aceptada" / "Rechazada"
   without leaving the page.
6. "Eliminar" opens a confirm dialog. Confirm → redirected to
   `/cotizaciones` and the row is gone.

## Step 8 — RLS smoke test (second account)

1. Sign out.
2. Create a second account (`u2@test.dev`) and complete its onboarding.
3. Visit `/cotizaciones` — empty.
4. Try to navigate manually to the FIRST user's quote URL
   (`/cotizaciones/<id>` you noted earlier) → expect "not found" (RLS hides
   the row).
5. Try to fetch the same URL via DevTools / curl with the second user's
   cookie → still 404.

## Step 9 — Edge cases

- [ ] G-code with no time / filament metadata: parser returns null fields,
      wizard falls back to manual entry, calculator only fires once both are
      typed.
- [ ] Unrecognised slicer: parse error banner shows; user can still type the
      values manually.
- [ ] Empty quote items in DB (shouldn't happen, but if it does): the trigger
      sets `total_ars = 0`.
- [ ] Delete a printer that's referenced by a historical quote_item: the FK
      is ON DELETE SET NULL — quote remains, item's `printer_id` becomes
      NULL. **Test this manually** by deleting the printer used in Step 4's
      quote and verifying the quote detail still renders.
- [ ] Delete a client that's referenced by a quote: FK ON DELETE SET NULL —
      quote remains, client_id becomes NULL. Verify "Sin cliente" appears.

## Step 10 — Promote to prod

ONLY after every check above is green:

1. Apply migration 008 to prod via MCP `apply_migration` with
   `project_id=wcyzknrhsdqkqmqheged`.
2. Apply migration 009 to prod the same way.
3. Run `get_advisors` for prod → confirm only the known `waitlist`
   false-positive remains.
4. Confirm `list_tables` on prod includes `clients` and the new columns on
   `quotes` / `quote_items` / `printers`.

## Step 11 — Cleanup

- [ ] Delete the two orphan files (Sprint 2 refactor of DeleteConfirmDialog):
  - `src/components/impresoras/delete-printer-dialog.tsx`
  - `src/components/materiales/delete-material-dialog.tsx`
- [ ] Update `.env.example` with the publishable keys + project URLs for
      staging (done by hand if `.env*` is permission-gated).
- [ ] Configure Vercel env vars (`docs/STAGING.md` section "Vercel
      configuration").

## Sign-off

When every box is checked, commit the Sprint 2 work in conventional commits
(one per logical chunk; never with `Co-Authored-By` per project convention).
Push to `origin/develop`. Master stays on the landing/waitlist until beta
launch.
