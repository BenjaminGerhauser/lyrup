/**
 * ARS currency formatter — Sprint 3 refactor.
 * Canonical export: formatARS (uppercase). The old formatArs alias is kept in
 * index.ts for back-compatibility with all existing call sites.
 *
 * Uses Intl.NumberFormat — safe for server-side RSC use (Node 18+ ICU).
 */

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

/**
 * Format a number as Argentine Peso with thousands dots and no decimals.
 *
 * Examples:
 *   formatARS(1234)      → "$1.234"
 *   formatARS(0)         → "$0"
 *   formatARS(1500000)   → "$1.500.000"
 *   formatARS(1234.7)    → "$1.235"   (rounds up)
 *   formatARS(-500)      → "-$500"
 */
export function formatARS(value: number): string {
  return arsFormatter.format(value)
}

/**
 * Compact ARS format for large values on cards (optional, Sprint 1 polish).
 *
 * Examples:
 *   formatArsCompact(1234)       → "$1.234"
 *   formatArsCompact(1200000)    → "$1,2M"
 */
export function formatArsCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000
    // One decimal place, Argentine locale decimal separator is ','
    const formatted = millions.toLocaleString('es-AR', { maximumFractionDigits: 1 })
    return `$${formatted}M`
  }
  return arsFormatter.format(value)
}
