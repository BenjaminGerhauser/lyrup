# Sprint 3 — PDF + WhatsApp + Analytics + Sentry + PWA · Acceptance Runbook

This runbook validates the four Sprint 3 changes end-to-end on **staging**
before any prod write. The migration to prod is the LAST step, and only after
every check below is green.

## Pre-flight

- [ ] `npx vitest run` → all tests green (≥ 464 expected).
- [ ] `npx tsc --noEmit` → 0 errors.
- [ ] `.env.local` points at staging (`wxlgbcakgzqntvuyerij.supabase.co`).
- [ ] `.env.local` has `NEXT_PUBLIC_UMAMI_URL` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
      pointing at your Umami instance (otherwise tracking is no-op — fine for
      local smoke, but you can't verify Step 7).
- [ ] `npm run dev` starts and `/login` loads.

## Migrations checklist

Sprint 3 ships **one** migration:

- `011_quote_config_fields.sql` — adds `users.quote_validity_days`,
  `quote_footer_note`, `pdf_show_breakdown`.

Apply order: **staging first, then prod**. Already applied to staging via MCP
during the last session.

| Env     | project_id              | 011 status               |
| ------- | ----------------------- | ------------------------ |
| Staging | `wxlgbcakgzqntvuyerij`  | ✅ applied (manual MCP) |
| Prod    | `wcyzknrhsdqkqmqheged`  | ⬜ pending (last step)  |

Verify staging columns:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('quote_validity_days','quote_footer_note','pdf_show_breakdown');
```

Expected: 3 rows, defaults `30`, `null`, `true`.

## User account setup

You need TWO staging users for the watermark check:
- One on `plan = 'free'`
- One on `plan = 'pro'` (or `'farm'`)

You can flip a user's plan from the Supabase dashboard:

```sql
UPDATE users SET plan = 'pro' WHERE id = '<your-uuid>';
```

## Step 1 — `/configuracion` new fields

1. Login as the free user.
2. Open `/configuracion`. Scroll to the new "Configuración de cotización"
   section (3 fields appear after Sprint 2's labor/electric blocks).
3. Verify defaults: validity = 30, footer note empty, "Mostrar desglose en PDF"
   checked.
4. Set validity = 0 → save → expect error (CHECK constraint, 1–365).
5. Set validity = 400 → expect error.
6. Set validity = 45, footer note = "Precios sujetos a modificación.", uncheck
   the breakdown toggle. Save.
7. Refresh the page → values persist.
8. Re-check the breakdown toggle, save again (need it ON for Step 3).

## Step 2 — PDF download (Free tier, with watermark)

1. Make sure user is `plan = 'free'`.
2. Open any existing quote at `/cotizaciones/[id]` (or create one first via
   `/cotizar`).
3. Bottom of the page: there's a new actions row with "Descargar PDF" and
   "Compartir por WhatsApp".
4. Click "Descargar PDF" → button shows loading state → browser downloads
   `cotizacion-<id>.pdf`.
5. Open the PDF and verify:
   - Header banner with the business name (text only — no logo image yet)
   - Business contact block (phone + WhatsApp from `/configuracion`)
   - Client block (if the quote has a client)
   - Items table (description, qty, material, printer, time, filament)
   - Breakdown sub-table per item (because `pdf_show_breakdown` = true)
   - Total in ARS, validity = 45 days, footer note "Precios sujetos a modificación."
   - **Watermark "Generado con Lyrup"** in the bottom-right corner.

## Step 3 — PDF download (Pro tier, no watermark, breakdown OFF)

1. In `/configuracion`, uncheck "Mostrar desglose en PDF". Save.
2. Flip user to pro via SQL.
3. Refresh `/cotizaciones/[id]`. Click "Descargar PDF" again.
4. Verify:
   - **No watermark.**
   - **No breakdown sub-table** (items show only the summary row).
   - Everything else identical to Step 2.

## Step 4 — WhatsApp share (with valid AR phone)

1. Open a quote whose client has a valid AR WhatsApp number.
2. Click "Compartir por WhatsApp" → opens `wa.me/549XXXXXXXX?text=...` in a
   new tab (web WhatsApp or the desktop app).
3. The pre-filled message reads:

   ```
   Hola <client.name>, te paso el presupuesto desde <business_name>.

   Resumen: N item(s), total ARS X.XXX,XX.
   Válido por 45 días.

   Detalle adjunto en PDF.

   Cualquier duda avisame, estamos en contacto.
   ```

4. Note: the PDF is NOT auto-attached — that's intentional. User downloads it
   in Step 2/3 and attaches manually in WhatsApp.

## Step 5 — WhatsApp share (no client or no phone)

1. Quote with no client OR client without `whatsapp` → the "Compartir por
   WhatsApp" button is **disabled**.
2. Hover → tooltip explains why ("Cliente sin WhatsApp válido" or similar).

## Step 6 — AR phone normalization sanity check

Try a client with these phone variants (one at a time, save, open the quote,
inspect the `wa.me` URL):

- `+5491134567890` → URL contains `549/1134567890`
- `541134567890` → URL contains `54/9/1134567890` (the 9 gets injected)
- `1134567890` (10 digits local) → adds `549` prefix
- `+541134567890` (missing the 9 after 54) → URL contains `549/1134567890`
- `11-3456-7890` (with dashes) → strips, normalizes
- Invalid input (`abc`) → button disabled

## Step 7 — Umami events fire

Requires `NEXT_PUBLIC_UMAMI_URL` + `NEXT_PUBLIC_UMAMI_WEBSITE_ID` set in your
`.env.local` (and Umami dashboard reachable). Open the Umami dashboard in
another tab and watch events live.

Smoke list (do them in order, confirm each in Umami):

- [ ] Login as fresh user → register → `signup_complete`
- [ ] Finish 4-step onboarding → `onboarding_complete`
- [ ] Open `/cotizar`, upload a `.gcode` → `gcode_parsed` with
      `{ printer_matched, material_matched }`
- [ ] Save the quote → `quote_saved` with `{ item_count }`
- [ ] On detail page, download PDF → `pdf_generated` with `{ item_count }`
- [ ] On detail page, click WhatsApp → `whatsapp_clicked` with `{ has_phone }`
- [ ] Add a printer → `printer_added`
- [ ] Add a material → `material_added`
- [ ] (Hard to force) Trigger a PDF error (e.g. throw inside `quote-pdf-button.tsx`
      catch) → `pdf_error`

Convention check (locally):
```
rg "window\.umami" src/
```
Should only show matches in `src/lib/analytics/` and the 3 grandfathered
landing files (`faq.tsx`, `pricing-tracker.tsx`, `waitlist-form.tsx`).

## Step 8 — Sentry capture

Requires `NEXT_PUBLIC_SENTRY_DSN` set + Sentry project created. If not done
yet, mark this step as **deferred until env vars are configured** — the code
is shipping-safe (no-op).

If env vars are set:

1. Force a PDF generation failure (temporarily throw in
   `quote-pdf-button.tsx` catch block, or break the document temporarily).
2. Click "Descargar PDF" → expect inline error banner in the UI.
3. Check Sentry "Issues" — the error appears with tag `feature: pdf-export`.
4. The user context should show `id: <uuid>` (no email, no business_name, no
   PII).

Verify source maps work: the stack should show real file names, not
`chunk.xxx.js:1`. If minified gibberish appears, `SENTRY_AUTH_TOKEN` +
`SENTRY_ORG` + `SENTRY_PROJECT` are missing from Vercel CI env.

## Step 9 — PWA install (Android Chrome)

1. Open the deployed staging URL on an Android device in Chrome.
2. Browser shows an "Install app" prompt (or via three-dot menu → "Install app").
3. Install. Verify:
   - App opens standalone (no browser chrome).
   - Icon on home screen matches the Lyrup logo.
   - Theme color in status bar matches `#06B6D4`.
   - Splash uses background `#0B0F1A`.
4. Lighthouse PWA audit (DevTools → Lighthouse → PWA): manifest detected,
   icons valid, SW registered. Score should be 90+ (some criteria like
   maskable icon padding may need Sprint 4 polish).

## Step 10 — PWA install (iOS Safari)

iOS has its own install flow:

1. Open the deployed staging URL on iPhone in Safari.
2. Share menu → "Add to Home Screen".
3. Verify:
   - Icon uses `apple-touch-icon.png`.
   - App opens in standalone mode (per `apple-mobile-web-app-capable`).
   - Status bar style matches `black-translucent`.

## Step 11 — Offline fallback

1. Open the installed PWA (or just any tab on staging).
2. Cut your internet (DevTools → Network → Offline, or actual airplane mode
   on mobile).
3. Try to navigate to a page you haven't visited yet → browser hits the SW →
   SW returns `/~offline` page.
4. Page shows "Sin conexión" + a link back to `/`.

(Pages you've already visited may serve from cache — that's expected.)

## Step 12 — Apply migration to prod

ONLY after all 11 steps above are green:

1. Use MCP `apply_migration` with `project_id: wcyzknrhsdqkqmqheged`, name
   `011_quote_config_fields`, and the SQL from
   `supabase/migrations/011_quote_config_fields.sql`.
2. Verify columns appear in prod via the same `information_schema.columns`
   query as the pre-flight section.
3. If the prod app was already deployed via Vercel develop → main promotion,
   verify `/configuracion` works for a prod user.

## Post-acceptance cleanup notes (Sprint 4 backlog)

These are intentional Sprint 3 → Sprint 4 hand-offs, NOT bugs:

- Vendor `Inter-Regular.ttf` + `Inter-Bold.ttf` in `public/fonts/inter/`, then
  add `fontFamily: 'Inter'` back to `src/lib/pdf/styles.ts:page` style.
- Delete dead `src/app/manifest.ts` (replaced by `public/manifest.json`).
- Regenerate `src/lib/supabase/types.ts` with `supabase gen types`. Kills the
  `as unknown as QuoteItem[]` cast in `src/app/actions/quotes.ts:355`.
- Logo upload UI to Supabase Storage (PDF stays text-only until then).
- CRUD clientes completo, UI polish, user dropdown, landing SEO — all in the
  Sprint 4 backlog memory (`sprints/sprint-4-backlog`).
- CLI migration history mismatch: 10 entries from Sprint 0 + 011 from MCP.
  Use `supabase migration repair --status applied <our_local_versions>` to
  reconcile, or accept the drift and apply future migrations via MCP.

## Done criteria

Sprint 3 is **DONE** when:

- [ ] Steps 1–11 all green on staging
- [ ] Migration 011 applied to prod (Step 12)
- [ ] Vercel env vars set for Umami + Sentry (otherwise tracking + error
      reporting are no-op)
- [ ] At least one beta tester can sign up → cotizar → download PDF → share
      via WhatsApp on a real Android phone
