import { describe, it, expect } from 'vitest'
import { validateAddMaterial, validateEditMaterial } from '../materials'

// ---------------------------------------------------------------------------
// validateAddMaterial tests
// ---------------------------------------------------------------------------

describe('validateAddMaterial', () => {
  it('valid ref-catalog entry → { valid: true }', () => {
    const result = validateAddMaterial({
      ref_filament_id: 'filament-uuid-1',
      custom_name: 'Mi PLA rojo',
      material_type: 'PLA',
      price_per_kg: '8500',
      color_hex: '#FF0000',
      manual_name: null,
      brand: 'PrintaLot',
      density_g_cm3: '1.24',
    })

    expect(result).toEqual({ valid: true })
  })

  it('missing material_type → { error: "..." }', () => {
    const result = validateAddMaterial({
      ref_filament_id: 'filament-uuid-1',
      custom_name: null,
      material_type: null,
      price_per_kg: '8500',
      color_hex: null,
      manual_name: null,
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('tipo de material')
  })

  it('invalid material_type → { error: "..." }', () => {
    const result = validateAddMaterial({
      ref_filament_id: null,
      custom_name: null,
      material_type: 'INVALID_TYPE',
      price_per_kg: '8500',
      color_hex: null,
      manual_name: 'Custom filament',
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('Tipo de material inválido')
  })

  it('all valid material types pass', () => {
    const validTypes = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon']
    for (const type of validTypes) {
      const result = validateAddMaterial({
        ref_filament_id: null,
        custom_name: null,
        material_type: type,
        price_per_kg: '8500',
        color_hex: null,
        manual_name: 'Mi filamento',
        brand: null,
        density_g_cm3: null,
      })
      expect(result).toEqual({ valid: true })
    }
  })

  it('missing price_per_kg → { error: "..." }', () => {
    const result = validateAddMaterial({
      ref_filament_id: 'filament-uuid-1',
      custom_name: null,
      material_type: 'PLA',
      price_per_kg: null,
      color_hex: null,
      manual_name: null,
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('precio')
  })

  it('price_per_kg = 0 → { error: "..." }', () => {
    const result = validateAddMaterial({
      ref_filament_id: 'filament-uuid-1',
      custom_name: null,
      material_type: 'PLA',
      price_per_kg: 0,
      color_hex: null,
      manual_name: null,
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('mayor a cero')
  })

  it('negative price_per_kg → { error: "..." }', () => {
    const result = validateAddMaterial({
      ref_filament_id: 'filament-uuid-1',
      custom_name: null,
      material_type: 'PETG',
      price_per_kg: '-100',
      color_hex: null,
      manual_name: null,
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toHaveProperty('error')
  })

  it('manual entry with name → { valid: true }', () => {
    const result = validateAddMaterial({
      ref_filament_id: null,
      custom_name: null,
      material_type: 'ABS',
      price_per_kg: '9000',
      color_hex: '#000000',
      manual_name: 'Filamento genérico ABS',
      brand: null,
      density_g_cm3: '1.05',
    })

    expect(result).toEqual({ valid: true })
  })

  it('manual entry without name → { error: "..." }', () => {
    const result = validateAddMaterial({
      ref_filament_id: null,
      custom_name: null,
      material_type: 'TPU',
      price_per_kg: '12000',
      color_hex: null,
      manual_name: null,
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('nombre')
  })

  it('manual entry with whitespace-only name → { error: "..." }', () => {
    const result = validateAddMaterial({
      ref_filament_id: null,
      custom_name: null,
      material_type: 'Nylon',
      price_per_kg: '15000',
      color_hex: null,
      manual_name: '   ',
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('nombre')
  })

  it('numeric price_per_kg (not string) → { valid: true }', () => {
    const result = validateAddMaterial({
      ref_filament_id: 'filament-uuid-1',
      custom_name: null,
      material_type: 'PLA',
      price_per_kg: 8500,
      color_hex: null,
      manual_name: null,
      brand: null,
      density_g_cm3: null,
    })

    expect(result).toEqual({ valid: true })
  })
})

// ---------------------------------------------------------------------------
// validateEditMaterial tests
// ---------------------------------------------------------------------------

describe('validateEditMaterial', () => {
  it('valid price and name → { valid: true }', () => {
    const result = validateEditMaterial({
      price_per_kg: '9000',
      custom_name: 'Nuevo nombre',
      color_hex: '#00FF00',
    })

    expect(result).toEqual({ valid: true })
  })

  it('null price (not provided) → { valid: true }', () => {
    const result = validateEditMaterial({
      price_per_kg: null,
      custom_name: 'Solo nombre',
      color_hex: null,
    })

    expect(result).toEqual({ valid: true })
  })

  it('zero price → { error: "..." }', () => {
    const result = validateEditMaterial({
      price_per_kg: '0',
      custom_name: null,
      color_hex: null,
    })

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('mayor a cero')
  })

  it('negative price → { error: "..." }', () => {
    const result = validateEditMaterial({
      price_per_kg: '-500',
      custom_name: null,
      color_hex: null,
    })

    expect(result).toHaveProperty('error')
  })

  it('non-numeric string price → { error: "..." }', () => {
    const result = validateEditMaterial({
      price_per_kg: 'no-es-numero',
      custom_name: null,
      color_hex: null,
    })

    expect(result).toHaveProperty('error')
  })

  it('all fields null → { valid: true }', () => {
    const result = validateEditMaterial({
      price_per_kg: null,
      custom_name: null,
      color_hex: null,
    })

    expect(result).toEqual({ valid: true })
  })
})
