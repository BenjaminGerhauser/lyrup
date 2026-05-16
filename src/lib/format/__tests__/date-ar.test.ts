import { describe, it, expect } from 'vitest'
import { formatDateAR } from '../date-ar'

describe('formatDateAR', () => {
  it('formats a Date object as DD/MM/YYYY', () => {
    // Use UTC noon to avoid timezone-boundary issues in CI
    const date = new Date('2024-03-15T12:00:00Z')
    const result = formatDateAR(date)
    // Result should contain day, month, year in Argentine format
    expect(result).toContain('15')
    expect(result).toContain('03')
    expect(result).toContain('2024')
  })

  it('formats an ISO date string as DD/MM/YYYY', () => {
    const result = formatDateAR('2025-12-31T12:00:00Z')
    expect(result).toContain('31')
    expect(result).toContain('12')
    expect(result).toContain('2025')
  })

  it('produces a "/" separator (not "-" or ".")', () => {
    const result = formatDateAR(new Date('2024-06-01T12:00:00Z'))
    expect(result).toContain('/')
  })

  it('formats 2024-01-01 and contains year 2024', () => {
    const result = formatDateAR('2024-01-01T12:00:00Z')
    expect(result).toContain('2024')
  })
})
