/**
 * Cost calculator types — Sprint 1, Phase 1.
 * Field names mirror the formulas in the spec exactly.
 */

/**
 * Input parameters for the cost calculator.
 * All numeric values must be ≥ 0. Pass `printerLifeHours = 0` to skip
 * depreciation (e.g. fully-depreciated printer or printer type unknown).
 */
export interface CalculatorParams {
  /** Filament consumed in grams. */
  filamentGrams: number
  /** Total estimated print time in minutes. */
  printTimeMinutes: number
  /** Filament price in ARS per kilogram. */
  materialPricePerKg: number
  /** Printer power consumption in watts. */
  printerWatts: number
  /** Electricity rate in ARS per kWh (from ref_electricity_rates or user override). */
  electricityRateKwh: number
  /** Printer purchase price in ARS. */
  printerPrice: number
  /**
   * Estimated printer lifetime in hours (for depreciation calculation).
   * Pass 0 to skip depreciation — no division-by-zero error will occur.
   */
  printerLifeHours: number
  /** Labor rate in ARS per hour (from users.labor_rate_hour). */
  laborRateHour: number
  /**
   * Labor factor — fraction of print time counted as labor time.
   * Default: 0.20 (20%). Valid range: 0.0–1.0.
   */
  laborFactor: number
  /**
   * Desired profit margin as a percentage.
   * 0 = no markup (suggestedPrice = totalCost).
   * 100 = 100% markup (suggestedPrice = 2 × totalCost).
   */
  marginPercent: number
}

/**
 * Itemised cost breakdown produced by the calculator.
 * All values are in ARS, full precision (round only at display time).
 */
export interface CostBreakdown {
  /** (filamentGrams / 1000) × materialPricePerKg */
  materialCost: number
  /** (printerWatts / 1000) × (printTimeMinutes / 60) × electricityRateKwh */
  electricityCost: number
  /** (printerPrice / printerLifeHours) × (printTimeMinutes / 60) — 0 when printerLifeHours = 0 */
  depreciationCost: number
  /** (printTimeMinutes / 60) × laborRateHour × laborFactor */
  laborCost: number
  /** materialCost + electricityCost + depreciationCost + laborCost */
  totalCost: number
  /** totalCost × (1 + marginPercent / 100) */
  suggestedPrice: number
}

/**
 * Returned instead of CostBreakdown when inputs are invalid.
 * The `error` field contains a machine-readable error code.
 */
export interface CalculatorError {
  /** Machine-readable error code (e.g. 'NEGATIVE_INPUT'). */
  error: string
}
