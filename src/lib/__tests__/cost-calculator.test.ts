import { describe, it, expect } from 'vitest'
import { calculateCosts } from '../cost-calculator'
import type { CalculatorParams, CostBreakdown, CalculatorError } from '@/types/calculator'

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makeParams(overrides: Partial<CalculatorParams> = {}): CalculatorParams {
  return {
    filamentGrams: 100,         // 100g filament
    printTimeMinutes: 120,      // 2 hours
    materialPricePerKg: 15000,  // $15,000/kg
    printerWatts: 200,          // 200W printer
    electricityRateKwh: 100,    // $100/kWh
    printerPrice: 200000,       // $200,000 printer
    printerLifeHours: 2000,     // 2000h life
    laborRateHour: 2000,        // $2,000/hr labor
    laborFactor: 0.2,           // 20% labor factor
    marginPercent: 30,          // 30% margin
    ...overrides,
  }
}

function isCostBreakdown(result: CostBreakdown | CalculatorError): result is CostBreakdown {
  return !('error' in result)
}

// ---------------------------------------------------------------------------
// Happy path with known inputs/outputs
// ---------------------------------------------------------------------------

describe('calculateCosts — happy path', () => {
  it('returns a CostBreakdown object (no error field) for valid inputs', () => {
    const result = calculateCosts(makeParams())
    expect(isCostBreakdown(result)).toBe(true)
  })

  it('materialCost = (filamentGrams / 1000) × materialPricePerKg', () => {
    // 100 / 1000 × 15000 = 1500
    const result = calculateCosts(makeParams()) as CostBreakdown
    expect(result.materialCost).toBeCloseTo(1500, 5)
  })

  it('electricityCost = (printerWatts / 1000) × (printTimeMinutes / 60) × electricityRateKwh', () => {
    // (200 / 1000) × (120 / 60) × 100 = 0.2 × 2 × 100 = 40
    const result = calculateCosts(makeParams()) as CostBreakdown
    expect(result.electricityCost).toBeCloseTo(40, 5)
  })

  it('depreciationCost = (printerPrice / printerLifeHours) × (printTimeMinutes / 60)', () => {
    // (200000 / 2000) × (120 / 60) = 100 × 2 = 200
    const result = calculateCosts(makeParams()) as CostBreakdown
    expect(result.depreciationCost).toBeCloseTo(200, 5)
  })

  it('laborCost = (printTimeMinutes / 60) × laborRateHour × laborFactor', () => {
    // (120 / 60) × 2000 × 0.2 = 2 × 2000 × 0.2 = 800
    const result = calculateCosts(makeParams()) as CostBreakdown
    expect(result.laborCost).toBeCloseTo(800, 5)
  })

  it('totalCost = materialCost + electricityCost + depreciationCost + laborCost', () => {
    // 1500 + 40 + 200 + 800 = 2540
    const result = calculateCosts(makeParams()) as CostBreakdown
    expect(result.totalCost).toBeCloseTo(2540, 5)
  })

  it('suggestedPrice = totalCost × (1 + marginPercent / 100)', () => {
    // 2540 × 1.30 = 3302
    const result = calculateCosts(makeParams()) as CostBreakdown
    expect(result.suggestedPrice).toBeCloseTo(3302, 5)
  })
})

// ---------------------------------------------------------------------------
// marginPercent = 0 (no markup)
// ---------------------------------------------------------------------------

describe('calculateCosts — marginPercent = 0', () => {
  it('suggestedPrice equals totalCost when marginPercent is 0', () => {
    const result = calculateCosts(makeParams({ marginPercent: 0 })) as CostBreakdown
    expect(result.suggestedPrice).toBeCloseTo(result.totalCost, 10)
  })
})

// ---------------------------------------------------------------------------
// printerLifeHours = 0 (no depreciation, graceful)
// ---------------------------------------------------------------------------

describe('calculateCosts — printerLifeHours = 0', () => {
  it('depreciationCost is 0 when printerLifeHours is 0 (no division by zero)', () => {
    const result = calculateCosts(makeParams({ printerLifeHours: 0 })) as CostBreakdown
    expect(result.depreciationCost).toBe(0)
  })

  it('still returns valid totalCost without depreciation component', () => {
    // 1500 + 40 + 0 + 800 = 2340
    const result = calculateCosts(makeParams({ printerLifeHours: 0 })) as CostBreakdown
    expect(result.totalCost).toBeCloseTo(2340, 5)
  })
})

// ---------------------------------------------------------------------------
// Error union: negative or NaN inputs
// ---------------------------------------------------------------------------

describe('calculateCosts — error union on invalid input', () => {
  it('returns { error: "NEGATIVE_INPUT" } for negative filamentGrams', () => {
    const result = calculateCosts(makeParams({ filamentGrams: -1 })) as CalculatorError
    expect('error' in result).toBe(true)
    expect(result.error).toBe('NEGATIVE_INPUT')
  })

  it('returns { error: "NEGATIVE_INPUT" } for negative printTimeMinutes', () => {
    const result = calculateCosts(makeParams({ printTimeMinutes: -10 })) as CalculatorError
    expect('error' in result).toBe(true)
    expect(result.error).toBe('NEGATIVE_INPUT')
  })

  it('returns { error: "NEGATIVE_INPUT" } for NaN materialPricePerKg', () => {
    const result = calculateCosts(makeParams({ materialPricePerKg: NaN })) as CalculatorError
    expect('error' in result).toBe(true)
    expect(result.error).toBe('NEGATIVE_INPUT')
  })

  it('does NOT throw — always returns a value (discriminated union, no exceptions)', () => {
    expect(() => calculateCosts(makeParams({ filamentGrams: -999 }))).not.toThrow()
    expect(() => calculateCosts(makeParams({ materialPricePerKg: NaN }))).not.toThrow()
  })
})
