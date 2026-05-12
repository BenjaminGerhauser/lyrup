import { describe, it, expect } from 'vitest'
import { formatArs, formatArsCompact } from '../format'

// ---------------------------------------------------------------------------
// formatArs — Argentine peso, no decimals, thousands separator = dot
//
// Note: Intl.NumberFormat('es-AR') in jsdom may output a narrow non-breaking
// space (U+202F) between the $ sign and the number. We strip that character
// before comparing so tests pass across environments (jsdom vs. Node ICU).
// ---------------------------------------------------------------------------

function normalise(s: string): string {
  // Remove narrow no-break space (U+202F) and regular non-breaking space (U+00A0)
  return s.replace(/[  ]/g, '')
}

describe('formatArs', () => {
  it('formats zero — contains "$" and "0"', () => {
    expect(normalise(formatArs(0))).toBe('$0')
  })

  it('formats 1234 as "$1.234"', () => {
    expect(normalise(formatArs(1234))).toBe('$1.234')
  })

  it('formats 1500000 as "$1.500.000"', () => {
    expect(normalise(formatArs(1500000))).toBe('$1.500.000')
  })

  it('rounds 1234.7 up to "$1.235"', () => {
    expect(normalise(formatArs(1234.7))).toBe('$1.235')
  })

  it('rounds 1234.4 down to "$1.234"', () => {
    expect(normalise(formatArs(1234.4))).toBe('$1.234')
  })
})

// ---------------------------------------------------------------------------
// formatArsCompact — compact M suffix for values >= 1,000,000
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
