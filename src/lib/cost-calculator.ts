/**
 * Cost calculator — Sprint 1, Phase 2.
 * Pure function — no side effects, no imports from Next.js or DB.
 *
 * Design note: spec says return { error } on negative input (not throw).
 * Design doc says throw RangeError — spec wins per SDD rules.
 */

import type { CalculatorParams, CostBreakdown, CalculatorError } from '@/types/calculator'

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const NUMERIC_PARAM_KEYS: (keyof CalculatorParams)[] = [
  'filamentGrams',
  'printTimeMinutes',
  'materialPricePerKg',
  'printerWatts',
  'electricityRateKwh',
  'printerPrice',
  'printerLifeHours',
  'laborRateHour',
  'laborFactor',
  'marginPercent',
]

function hasNegativeOrNaN(params: CalculatorParams): boolean {
  return NUMERIC_PARAM_KEYS.some((key) => {
    const val = params[key] as number
    return isNaN(val) || val < 0
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate print cost breakdown from the given parameters.
 *
 * Returns `{ error: 'NEGATIVE_INPUT' }` if any numeric param is negative or NaN.
 * When `printerLifeHours === 0`, depreciationCost is 0 (no division by zero).
 * All values are full-precision ARS — round only at display time.
 *
 * @param params  CalculatorParams
 * @returns       CostBreakdown on success, CalculatorError on invalid input
 */
export function calculateCosts(params: CalculatorParams): CostBreakdown | CalculatorError {
  if (hasNegativeOrNaN(params)) {
    return { error: 'NEGATIVE_INPUT' }
  }

  const {
    filamentGrams,
    printTimeMinutes,
    materialPricePerKg,
    printerWatts,
    electricityRateKwh,
    printerPrice,
    printerLifeHours,
    laborRateHour,
    laborFactor,
    marginPercent,
  } = params

  // materialCost = (filamentGrams / 1000) × materialPricePerKg
  const materialCost = (filamentGrams / 1000) * materialPricePerKg

  // electricityCost = (printerWatts / 1000) × (printTimeMinutes / 60) × electricityRateKwh
  const electricityCost = (printerWatts / 1000) * (printTimeMinutes / 60) * electricityRateKwh

  // depreciationCost = (printerPrice / printerLifeHours) × (printTimeMinutes / 60)
  // printerLifeHours === 0 → 0 (graceful, no division by zero)
  const depreciationCost =
    printerLifeHours === 0
      ? 0
      : (printerPrice / printerLifeHours) * (printTimeMinutes / 60)

  // laborCost = (printTimeMinutes / 60) × laborRateHour × laborFactor
  const laborCost = (printTimeMinutes / 60) * laborRateHour * laborFactor

  // totalCost = sum of all components
  const totalCost = materialCost + electricityCost + depreciationCost + laborCost

  // suggestedPrice = totalCost × (1 + marginPercent / 100)
  const suggestedPrice = totalCost * (1 + marginPercent / 100)

  return {
    materialCost,
    electricityCost,
    depreciationCost,
    laborCost,
    totalCost,
    suggestedPrice,
  }
}
