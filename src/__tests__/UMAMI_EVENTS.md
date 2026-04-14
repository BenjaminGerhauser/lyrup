# Umami Analytics Events

All events use `window.umami?.track(eventName, properties)` — optional chaining prevents errors when Umami is not loaded (dev, blockers).

## Tracked Events

| Event Name | File | Trigger | Properties |
|------------|------|---------|------------|
| `waitlist_submit` | `src/components/landing/waitlist-form.tsx` | On successful form submission (server action returns `success`) | `{ source: utmSource ?? 'landing' }` |
| `faq_click` | `src/components/landing/faq.tsx` | When an accordion item is opened (`onOpenChange(true)`) | `{ question: item.question }` |
| `pricing_view` | `src/components/landing/pricing-tracker.tsx` | When the `#precios` section is 30% visible (IntersectionObserver) | none |

## Implementation Notes

- `waitlist_submit` fires only on success — duplicates and errors are NOT tracked (intentional: avoids noisy data)
- `faq_click` fires only on open, not on close — tracks engagement, not toggle count
- `pricing_view` uses a `tracked` ref to ensure it fires exactly once per page load, even if the user scrolls up and down
- All 3 events guard with `typeof window !== 'undefined'` or optional chaining (`window.umami?.track`) — safe for SSR

## Umami Setup

Umami script is loaded in `app/layout.tsx` via `<Script async>` with:
- `src`: `process.env.NEXT_PUBLIC_UMAMI_URL`
- `data-website-id`: `process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID`

Required env vars: `NEXT_PUBLIC_UMAMI_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID`
