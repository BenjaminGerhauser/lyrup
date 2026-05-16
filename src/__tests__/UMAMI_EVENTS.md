# Umami Analytics Events

All events in `src/lib/analytics/umami.ts` use the typed wrapper — call the named export (e.g. `trackSignupComplete()`) rather than `window.umami.track` directly. The 3 landing events are grandfathered inline calls (pre-wrapper) and will NOT be migrated.

## Tracked Events

### Landing (grandfathered — inline `window.umami?.track` calls, pre-wrapper)

| Event Name | File | Trigger | Properties | Notes |
|------------|------|---------|------------|-------|
| `waitlist_form_view` | `src/components/landing/waitlist-form.tsx` | When the waitlist form enters 50% viewport (IntersectionObserver, once per session per section) | `{ section: utmSource ?? 'landing' }` | Fires once per `sessionStorage` key; both hero and CTA sections tracked separately |
| `waitlist_submit` | `src/components/landing/waitlist-form.tsx` | On successful form submission (server action returns `success`) | `{ source: utmSource ?? 'landing' }` | Fires only on success — duplicates and errors are NOT tracked (intentional: avoids noisy data) |
| `faq_click` | `src/components/landing/faq.tsx` | When an accordion item is opened (`onOpenChange(true)`) | `{ question: item.question }` | Fires only on open, not on close — tracks engagement, not toggle count |
| `pricing_view` | `src/components/landing/pricing-tracker.tsx` | When the `#precios` section is 30% visible (IntersectionObserver) | none | Uses a `tracked` ref to ensure it fires exactly once per page load |

### Beta funnel (Sprint 3 — typed wrapper via `src/lib/analytics/umami.ts`)

| Event Name | File | Trigger | Properties | Design Notes |
|------------|------|---------|------------|--------------|
| `signup_complete` | `src/app/(auth)/register/page.tsx` | Inside `useActionState` handler, after `result.success === true` | `{}` | **IMPORTANT**: fires on form-submit success, NOT on Supabase email-confirmation click. Intentional design: measures top-of-funnel form completion. `onboarding_complete` is the activation signal. |
| `onboarding_complete` | `src/app/(dashboard)/onboarding/page.tsx` | Client-side, inside `startTransition` catch block when `isRedirectError(err)` is true — i.e. the server action called `redirect()` on success, BEFORE Next.js completes the navigation | `{}` | Must fire client-side before navigation. The server action throws `NEXT_REDIRECT` on success; we detect it via `isRedirectError` from `next/dist/client/components/redirect-error`. |
| `gcode_parsed` | `src/components/cotizar/item-editor.tsx` | Immediately after `matchGcodeToUserEquipment` returns — fires regardless of match outcome | `{ printer_matched: boolean, material_matched: boolean }` | Fires even when neither printer nor material matched (`false, false`) — both outcomes are valid funnel signals. Fires in `item-editor.tsx` (where parse/match actually happens), not in `cotizar-wizard.tsx`. |
| `quote_saved` | `src/components/cotizar/cotizar-wizard.tsx` | After `createQuote` server action returns success, before `router.push` | `{ item_count: number }` | Does NOT fire when server action returns error. `item_count` = actual number of line items in the saved quote. |
| `pdf_generated` | `src/components/cotizaciones/quote-pdf-button.tsx` | After `URL.createObjectURL` succeeds and download is triggered (inside `try` block, after the anchor click) | `{ item_count: number }` | Does NOT fire inside the `catch` block. `item_count` = `quote.items.length`. |
| `pdf_error` | `src/components/cotizaciones/quote-pdf-button.tsx` | Inside the `catch` block when PDF generation throws | `{}` | Does NOT include error message or stack trace — privacy-safe. When this fires, `pdf_generated` does NOT fire for the same attempt. |
| `whatsapp_clicked` | `src/components/cotizaciones/quote-actions.tsx` | In `handleWhatsApp` onClick, BEFORE `window.open` is called | `{ has_phone: boolean }` | `has_phone: true` when `buildWhatsAppUrl` returned a valid URL; `false` when no valid client phone. Fires regardless of `has_phone` value — both are valid funnel signals. |
| `printer_added` | `src/components/impresoras/add-printer-dialog.tsx` | After `addPrinter` server action returns `result.success === true` | `{}` | ADD only — does NOT fire on edit/update paths (those go through `edit-printer-dialog.tsx`). |
| `material_added` | `src/components/materiales/add-material-dialog.tsx` | After `addMaterial` server action returns `result.success === true` | `{}` | ADD only — does NOT fire on edit/update paths (those go through `edit-material-dialog.tsx`). |

## Implementation Notes

### Landing events (grandfathered)
- All 3 (now 4 with `waitlist_form_view`) use inline `window.umami?.track` — marked with `// grandfathered: pre-wrapper inline umami call` comment.
- These will NOT be migrated to the wrapper in this change (out of scope per spec section 4).

### Beta funnel events (Sprint 3)
- All 9 go through `src/lib/analytics/umami.ts` — the ONLY place in `src/` (outside grandfathered landing files) that may reference `window.umami`.
- `isEnabled` is `false` in dev/preview/test — zero dashboard pollution during development.
- SSR-safe: the wrapper guards with `typeof window !== 'undefined'`.
- No PII in any event payload — no names, emails, phone numbers, ARS totals, filenames, or error messages.

### Convention audit
Running `rg "window\.umami" src/` should return ZERO matches outside:
1. `src/lib/analytics/umami.ts`
2. `src/components/landing/faq.tsx` (grandfathered)
3. `src/components/landing/pricing-tracker.tsx` (grandfathered)
4. `src/components/landing/waitlist-form.tsx` (grandfathered)

## Umami Setup

Umami script is loaded in `app/layout.tsx` via `<Script async>` with:
- `src`: `process.env.NEXT_PUBLIC_UMAMI_URL`
- `data-website-id`: `process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID`

Required env vars: `NEXT_PUBLIC_UMAMI_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`

Wrapper module: `src/lib/analytics/umami.ts` — exports `isEnabled`, `UmamiEventName`, `UmamiEventProperties`, and 9 named `track*` functions.
