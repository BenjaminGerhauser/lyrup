/**
 * Argentine date formatter — Sprint 3.
 * Produces DD/MM/YYYY strings using es-AR locale conventions.
 */

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/**
 * Format a Date object or ISO string as DD/MM/YYYY.
 *
 * Examples:
 *   formatDateAR(new Date('2024-03-15'))   → "15/03/2024"
 *   formatDateAR('2024-03-15T00:00:00Z')  → "15/03/2024"
 */
export function formatDateAR(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return dateFormatter.format(date)
}
