# Lighthouse Audit Notes

## Automated Checks (verified programmatically)

| Check | Status | Notes |
|-------|--------|-------|
| `<html lang="es">` | PASS | Set in `app/layout.tsx` |
| `next/font` usage | PASS | Inter, Space Grotesk, JetBrains Mono via `next/font/google` in `app/layout.tsx` |
| Images with explicit dimensions | PASS | No raw `<img>` tags — project uses no images (hero is pure CSS/JSX) |
| `next/image` for external images | N/A | No external images used |
| Meta viewport | PASS | Next.js App Router injects this automatically |
| Render-blocking resources | PASS | Fonts use `next/font` (no @import of remote fonts); Umami loaded with `<Script async>` |
| `prefers-reduced-motion` — `.reveal` | PASS | Handled in `globals.css` |
| `prefers-reduced-motion` — hero animation | PASS | Added `@media (prefers-reduced-motion: reduce)` in `hero.tsx` inline style |

## Manual Checks (run in browser)

Run `npx lighthouse https://lyrup.com --view` or open Chrome DevTools → Lighthouse.

### Performance
- [ ] LCP < 2.5s (hero copy is text-only — should be fast)
- [ ] CLS < 0.1 (no layout shifts expected; verify font swap)
- [ ] FID / INP < 200ms
- [ ] Check network waterfall for any unexpected blocking resources

### Accessibility
- [ ] Color contrast on `text-lyrup-text-muted` (#6B7280 on #0B0F1A) — verify 4.5:1 ratio
- [ ] Keyboard navigation through accordion (FAQ section)
- [ ] Screen reader announces live regions (waitlist form feedback)

### SEO
- [ ] Meta description length (150-160 chars)
- [ ] Canonical URL resolves correctly
- [ ] JSON-LD validates at https://validator.schema.org

### Best Practices
- [ ] HTTPS enforced
- [ ] No console errors in production build
- [ ] OG image exists at `/og-image.png` (not yet created — needs actual asset)

## Known Gaps

- `/og-image.png` needs to be created (1200x630px recommended). Currently referenced in metadata but file may not exist.
