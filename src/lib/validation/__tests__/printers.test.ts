import { describe, it, expect } from 'vitest'
import { validateAddPrinter, validateEditPrinter } from '../printers'

// ---------------------------------------------------------------------------
// validateAddPrinter tests
// ---------------------------------------------------------------------------

describe('validateAddPrinter', () => {
  it('valid ref-model entry → { valid: true }', () => {
    const result = validateAddPrinter({
      ref_model_id: 'model-uuid-1',
      custom_name: 'Mi impresora',
      purchase_price: '150000',
      purchase_date: null,
      manual_name: null,
      power_w: null,
      life_hours_estimate: null,
    })

    expect(result).toEqual({ valid: true })
  })

  it('missing purchase_price → { error: "..." }', () => {
    const result = validateAddPrinter({
      ref_model_id: 'model-uuid-1',
      custom_name: null,
      purchase_price: null,
      purchase_date: null,
      manual_name: null,
      power_w: null,
      life_hours_estimate: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('precio de compra')
  })

  it('empty string purchase_price → { error: "..." }', () => {
    const result = validateAddPrinter({
      ref_model_id: 'model-uuid-1',
      custom_name: null,
      purchase_price: '',
      purchase_date: null,
      manual_name: null,
      power_w: null,
      life_hours_estimate: null,
    })

    expect(result).toHaveProperty('error')
  })

  it('purchase_price = 0 → { error: "..." }', () => {
    const result = validateAddPrinter({
      ref_model_id: 'model-uuid-1',
      custom_name: null,
      purchase_price: 0,
      purchase_date: null,
      manual_name: null,
      power_w: null,
      life_hours_estimate: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('mayor a cero')
  })

  it('negative purchase_price → { error: "..." }', () => {
    const result = validateAddPrinter({
      ref_model_id: 'model-uuid-1',
      custom_name: null,
      purchase_price: '-100',
      purchase_date: null,
      manual_name: null,
      power_w: null,
      life_hours_estimate: null,
    })

    expect(result).toHaveProperty('error')
  })

  it('manual entry with name and valid price → { valid: true }', () => {
    const result = validateAddPrinter({
      ref_model_id: null,
      custom_name: null,
      purchase_price: '50000',
      purchase_date: null,
      manual_name: 'Mi impresora custom',
      power_w: '200',
      life_hours_estimate: '3000',
    })

    expect(result).toEqual({ valid: true })
  })

  it('manual entry without name → { error: "..." }', () => {
    const result = validateAddPrinter({
      ref_model_id: null,
      custom_name: null,
      purchase_price: '50000',
      purchase_date: null,
      manual_name: null,
      power_w: '200',
      life_hours_estimate: '3000',
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('nombre')
  })

  it('manual entry with empty name → { error: "..." }', () => {
    const result = validateAddPrinter({
      ref_model_id: null,
      custom_name: null,
      purchase_price: '50000',
      purchase_date: null,
      manual_name: '   ',
      power_w: null,
      life_hours_estimate: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('nombre')
  })

  it('numeric purchase_price (not string) → { valid: true }', () => {
    const result = validateAddPrinter({
      ref_model_id: 'model-1',
      custom_name: null,
      purchase_price: 99999,
      purchase_date: null,
      manual_name: null,
      power_w: null,
      life_hours_estimate: null,
    })

    expect(result).toEqual({ valid: true })
  })
})

// ---------------------------------------------------------------------------
// validateEditPrinter tests
// ---------------------------------------------------------------------------

describe('validateEditPrinter', () => {
  it('valid purchase_price → { valid: true }', () => {
    const result = validateEditPrinter({
      purchase_price: '200000',
      custom_name: 'Nuevo nombre',
    })

    expect(result).toEqual({ valid: true })
  })

  it('null purchase_price (not provided) → { valid: true }', () => {
    const result = validateEditPrinter({
      purchase_price: null,
      custom_name: 'Solo cambio nombre',
    })

    expect(result).toEqual({ valid: true })
  })

  it('zero purchase_price → { error: "..." }', () => {
    const result = validateEditPrinter({
      purchase_price: '0',
      custom_name: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('mayor a cero')
  })

  it('negative purchase_price → { error: "..." }', () => {
    const result = validateEditPrinter({
      purchase_price: '-500',
      custom_name: null,
    })

    expect(result).toHaveProperty('error')
  })

  it('non-numeric string purchase_price → { error: "..." }', () => {
    const result = validateEditPrinter({
      purchase_price: 'no-es-un-numero',
      custom_name: null,
    })

    expect(result).toHaveProperty('error')
  })

  it('both fields null → { valid: true }', () => {
    const result = validateEditPrinter({
      purchase_price: null,
      custom_name: null,
    })

    expect(result).toEqual({ valid: true })
  })
})
