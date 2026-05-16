import { describe, it, expect } from 'vitest'
import { formatARS, formatArsCompact } from '../currency-ars'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Intl.NumberFormat('es-AR') may emit a narrow non-breaking space (U+202F)
 * between the $ sign and the number in some environments (jsdom vs Node ICU).
 * Strip both narrow NBSP and regular NBSP before comparing.
 */
function normalise(s: string): string {
  return s.replace(/[  ]/g, '')
}

// ---------------------------------------------------------------------------
// formatARS
// ---------------------------------------------------------------------------

describe('formatARS', () => {
  it('formats zero', () => {
    expect(normalise(formatARS(0))).toBe('$0')
  })

  it('formats 1234 as "$1.234"', () => {
    expect(normalise(formatARS(1234))).toBe('$1.234')
  })

  it('formats 1_500_000 as "$1.500.000"', () => {
    expect(normalise(formatARS(1_500_000))).toBe('$1.500.000')
  })

  it('rounds 1234.7 up to "$1.235"', () => {
    expect(normalise(formatARS(1234.7))).toBe('$1.235')
  })

  it('rounds 1234.4 down to "$1.234"', () => {
    expect(normalise(formatARS(1234.4))).toBe('$1.234')
  })

  it('formats negative value', () => {
    // Negative ARS — locale may vary (e.g. "-$500" or "$-500"); just assert
    // the string contains "500" and a minus sign.
    const result = normalise(formatARS(-500))
    expect(result).toContain('500')
    expect(result).toContain('-')
  })

  it('formats non-integer (3.5) by rounding to nearest integer', () => {
    expect(normalise(formatARS(3.5))).toBe('$4')
  })
})

// ---------------------------------------------------------------------------
// formatArsCompact
// ---------------------------------------------------------------------------

describe('formatArsCompact', () => {
  it('values below 1M use standard ARS format', () => {
    expect(normalise(formatArsCompact(1234))).toBe('$1.234')
  })

  it('exactly 1,000,000 renders as "$1M"', () => {
    expect(formatArsCompact(1_000_000)).toBe('$1M')
  })

  it('1,200,000 renders as "$1,2M" (Argentine decimal comma)', () => {
    expect(formatArsCompact(1_200_000)).toBe('$1,2M')
  })

  it('large value 2,500,000 renders as "$2,5M"', () => {
    expect(formatArsCompact(2_500_000)).toBe('$2,5M')
  })
})
