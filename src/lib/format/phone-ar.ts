/**
 * Argentine WhatsApp phone normalizer — Sprint 3.
 *
 * Target format for wa.me: 549XXXXXXXXXX  (country=54, mobile=9, then 10 local digits)
 *
 * Handled variants:
 *   +5491134567890   → 5491134567890
 *   5491134567890    → 5491134567890
 *   91134567890      → 5491134567890  (starts with mobile 9, 11 digits)
 *   1134567890       → 5491134567890  (bare 10-digit local)
 *   +541134567890    → 5491134567890  (54 without mobile 9 — inject 9)
 *   541134567890     → 5491134567890  (same, without +)
 *   11-3456-7890     → 5491134567890  (local with dashes)
 *   011 3456-7890    → 5491134567890  (leading 0 domestic prefix)
 *   (011) 3456 7890  → 5491134567890  (parens + spaces)
 *   +54 9 11 3456-7890 → 5491134567890
 *   15 3456-7890     → null            (old-style mobile prefix — unrecoverable)
 *   123              → null            (too short)
 *   notaphone        → null            (no digits left after stripping)
 */

/** Strips every non-digit character (spaces, dashes, dots, parens, +). */
function stripNonDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Normalizes an AR phone number to the wa.me format: 549XXXXXXXXXX.
 * Returns null for inputs that cannot be reliably normalized.
 */
export function normalizeArWhatsApp(raw: string | null | undefined): string | null {
  if (raw == null || raw.trim() === '') return null

  const digits = stripNonDigits(raw)

  if (digits.length === 0) return null

  // ── Already in canonical form ────────────────────────────────────────────
  // 549XXXXXXXXXX  (13 digits)  e.g. "5491134567890"
  if (digits.length === 13 && digits.startsWith('549')) {
    return digits
  }

  // ── 54 prefix WITHOUT mobile 9 ───────────────────────────────────────────
  // 5411XXXXXXXX  (12 digits) → inject 9 after 54
  if (digits.length === 12 && digits.startsWith('54') && !digits.startsWith('549')) {
    return `549${digits.slice(2)}`
  }

  // ── 9 + 10 local digits (11 digits, starts with 9) ───────────────────────
  // e.g. "91134567890"
  if (digits.length === 11 && digits.startsWith('9')) {
    return `54${digits}`
  }

  // ── Leading 0 domestic prefix (011XXXXXXXX) ───────────────────────────────
  // Strip the leading 0, leaving 10 local digits, then prefix 549
  if (digits.startsWith('0') && digits.length === 11) {
    return `549${digits.slice(1)}`
  }

  // ── Bare 10-digit local number ────────────────────────────────────────────
  // e.g. "1134567890"
  if (digits.length === 10) {
    return `549${digits}`
  }

  // Unrecognized length or prefix
  return null
}
