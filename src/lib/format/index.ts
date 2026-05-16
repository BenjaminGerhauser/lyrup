/**
 * src/lib/format — barrel index.
 *
 * Back-compat: existing code importing from '@/lib/format' continues to work
 * because Next.js / TypeScript resolve `@/lib/format` to this index.ts when
 * the directory exists (folder index resolution).
 *
 * The old single-file exported `formatArs` (lowercase a). We re-export it as
 * an alias alongside the new canonical `formatARS` (uppercase) so all existing
 * call sites remain green without a mechanical rename.
 */

// ── Currency ─────────────────────────────────────────────────────────────────
export { formatARS, formatArsCompact } from './currency-ars'

/** Back-compat alias: `formatArs` (lowercase) === `formatARS` (canonical). */
export { formatARS as formatArs } from './currency-ars'

// ── Date ─────────────────────────────────────────────────────────────────────
export { formatDateAR } from './date-ar'

// ── Phone ─────────────────────────────────────────────────────────────────────
export { normalizeArWhatsApp } from './phone-ar'

// ── WhatsApp ─────────────────────────────────────────────────────────────────
export { buildWhatsAppUrl, buildQuoteWhatsAppMessage } from './whatsapp'
export type { WhatsAppShareOpts, QuoteWhatsAppTemplateOpts } from './whatsapp'
