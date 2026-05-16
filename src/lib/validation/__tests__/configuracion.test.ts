import { describe, it, expect } from 'vitest'
import { validateConfig } from '../configuracion'
import type { ConfigData } from '../configuracion'

const VALID_DATA: ConfigData = {
  business_name: 'Mi Negocio 3D',
  phone: '+54 9 351 000 0000',
  business_phone: '+54 9 351 000 0001',
  logo_url: null,
  labor_rate_hour: 800,
  default_margin_percent: 100,
  default_labor_factor: 0.20,
  province: 'Córdoba',
  electricity_rate_kwh: 88.4,
  // Sprint 3 — PDF config (all optional, null = not submitted)
  quote_validity_days: 30,
  quote_footer_note: null,
  pdf_show_breakdown: true,
}

describe('validateConfig', () => {
  it('valid data → { valid: true }', () => {
    expect(validateConfig(VALID_DATA)).toEqual({ valid: true })
  })

  // business_name
  it('missing business_name → error', () => {
    const result = validateConfig({ ...VALID_DATA, business_name: '' })
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('nombre del negocio')
  })

  it('null business_name → error', () => {
    const result = validateConfig({ ...VALID_DATA, business_name: null })
    expect(result).toHaveProperty('error')
  })

  it('whitespace-only business_name → error', () => {
    const result = validateConfig({ ...VALID_DATA, business_name: '   ' })
    expect(result).toHaveProperty('error')
  })

  // labor_rate_hour
  it('labor_rate_hour = 0 → error', () => {
    const result = validateConfig({ ...VALID_DATA, labor_rate_hour: 0 })
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('mano de obra')
  })

  it('labor_rate_hour < 0 → error', () => {
    const result = validateConfig({ ...VALID_DATA, labor_rate_hour: -100 })
    expect(result).toHaveProperty('error')
  })

  it('labor_rate_hour as string "500" → valid', () => {
    expect(validateConfig({ ...VALID_DATA, labor_rate_hour: '500' })).toEqual({ valid: true })
  })

  // default_margin_percent
  it('default_margin_percent = 0 → valid (zero margin is allowed)', () => {
    expect(validateConfig({ ...VALID_DATA, default_margin_percent: 0 })).toEqual({ valid: true })
  })

  it('default_margin_percent < 0 → error', () => {
    const result = validateConfig({ ...VALID_DATA, default_margin_percent: -1 })
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('margen')
  })

  it('default_margin_percent = 500 → valid (large margin allowed)', () => {
    expect(validateConfig({ ...VALID_DATA, default_margin_percent: 500 })).toEqual({ valid: true })
  })

  // default_labor_factor
  it('default_labor_factor = 0.05 → valid (lower bound)', () => {
    expect(validateConfig({ ...VALID_DATA, default_labor_factor: 0.05 })).toEqual({ valid: true })
  })

  it('default_labor_factor = 0.40 → valid (upper bound)', () => {
    expect(validateConfig({ ...VALID_DATA, default_labor_factor: 0.40 })).toEqual({ valid: true })
  })

  it('default_labor_factor = 0.04 → error (below lower bound)', () => {
    const result = validateConfig({ ...VALID_DATA, default_labor_factor: 0.04 })
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('factor de mano de obra')
  })

  it('default_labor_factor = 0.41 → error (above upper bound)', () => {
    const result = validateConfig({ ...VALID_DATA, default_labor_factor: 0.41 })
    expect(result).toHaveProperty('error')
  })

  // electricity_rate_kwh — optional
  it('null electricity_rate_kwh → valid (optional field)', () => {
    expect(validateConfig({ ...VALID_DATA, electricity_rate_kwh: null })).toEqual({ valid: true })
  })

  it('electricity_rate_kwh = 0 → error (must be > 0 if provided)', () => {
    const result = validateConfig({ ...VALID_DATA, electricity_rate_kwh: 0 })
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('tarifa eléctrica')
  })

  it('electricity_rate_kwh as string "88.4" → valid', () => {
    expect(validateConfig({ ...VALID_DATA, electricity_rate_kwh: '88.4' })).toEqual({ valid: true })
  })

  // phone / whatsapp — optional
  it('null phone and business_phone → valid', () => {
    expect(validateConfig({ ...VALID_DATA, phone: null, business_phone: null })).toEqual({ valid: true })
  })

  // Sprint 3 — quote_validity_days
  it('quote_validity_days = null → valid (optional field)', () => {
    expect(validateConfig({ ...VALID_DATA, quote_validity_days: null })).toEqual({ valid: true })
  })

  it('quote_validity_days = 1 → valid (lower bound)', () => {
    expect(validateConfig({ ...VALID_DATA, quote_validity_days: 1 })).toEqual({ valid: true })
  })

  it('quote_validity_days = 365 → valid (upper bound)', () => {
    expect(validateConfig({ ...VALID_DATA, quote_validity_days: 365 })).toEqual({ valid: true })
  })

  it('quote_validity_days = 0 → error (below lower bound)', () => {
    const result = validateConfig({ ...VALID_DATA, quote_validity_days: 0 })
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('validez del presupuesto')
  })

  it('quote_validity_days = 366 → error (above upper bound)', () => {
    const result = validateConfig({ ...VALID_DATA, quote_validity_days: 366 })
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('validez del presupuesto')
  })

  it('quote_validity_days as string "30" → valid', () => {
    expect(validateConfig({ ...VALID_DATA, quote_validity_days: '30' })).toEqual({ valid: true })
  })

  it('quote_validity_days as string "0" → error', () => {
    const result = validateConfig({ ...VALID_DATA, quote_validity_days: '0' })
    expect(result).toHaveProperty('error')
  })
})
