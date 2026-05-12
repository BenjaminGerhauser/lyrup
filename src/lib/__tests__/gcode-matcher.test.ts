import { describe, it, expect } from 'vitest'
import { matchGcodeToUserEquipment } from '../gcode-matcher'
import type { GcodeData } from '@/types/gcode'
import type { Printer, Material, RefPrinterModel, RefFilamentCatalog } from '@/types/domain'

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

function makeGcodeData(overrides: Partial<GcodeData> = {}): GcodeData {
  return {
    slicerName: 'Cura 5.7.0',
    slicerType: 'cura',
    estimatedTimeMinutes: 60,
    filamentUsedMm: 2000,
    filamentUsedGrams: 6,
    layerCount: 100,
    nozzleTemp: 210,
    bedTemp: 60,
    printerIdentifier: null,
    filamentType: null,
    filamentBrand: null,
    ...overrides,
  }
}

function makeRefPrinter(overrides: Partial<RefPrinterModel> = {}): RefPrinterModel {
  return {
    id: 'ref-printer-1',
    brand: 'Creality',
    model: 'Ender 3 V3',
    bed_x_mm: null,
    bed_y_mm: null,
    bed_z_mm: null,
    power_w: null,
    last_updated: '2024-01-01',
    gcode_identifiers: ['Creality Ender-3 V3'],
    popularity_rank: 1,
    estimated_life_hours: 2000,
    firmware_type: null,
    nozzle_diameter_default: null,
    full_name: 'Creality Ender 3 V3',
    reference_price_ars: null,
    ...overrides,
  }
}

function makeRefFilament(overrides: Partial<RefFilamentCatalog> = {}): RefFilamentCatalog {
  return {
    id: 'ref-filament-1',
    brand: 'eSUN',
    material_type: 'PLA',
    color: null,
    price_per_kg_ars: 15000,
    density_g_cm3: 1.24,
    last_updated: '2024-01-01',
    gcode_identifiers: ['PLA'],
    popularity_rank: 1,
    nozzle_temp_min: null,
    nozzle_temp_max: null,
    bed_temp_min: null,
    bed_temp_max: null,
    filament_diameter: 1.75,
    ...overrides,
  }
}

function makeUserPrinter(overrides: Partial<Printer> = {}): Printer {
  return {
    id: 'user-printer-1',
    user_id: 'user-1',
    name: 'My Ender 3',
    printer_model_id: 'ref-printer-1',
    power_w: null,
    purchase_price_ars: null,
    depreciation_months: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    life_hours_estimate: 2000,
    nozzle_diameter: 0.4,
    accumulated_hours: 0,
    ...overrides,
  }
}

function makeUserMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: 'user-material-1',
    user_id: 'user-1',
    name: 'My eSUN PLA',
    filament_id: 'ref-filament-1',
    material_type: 'PLA',
    color: null,
    price_per_kg_ars: null,
    density_g_cm3: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    filament_diameter: 1.75,
    nozzle_temp: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Scenario: exact match (printer + filament both matched)
// ---------------------------------------------------------------------------

describe('matchGcodeToUserEquipment — exact match', () => {
  it('returns confidence=exact when both printer and filament match', () => {
    const gcodeData = makeGcodeData({
      printerIdentifier: 'Creality Ender-3 V3 SE',
      filamentType: 'PLA',
    })
    const result = matchGcodeToUserEquipment(
      gcodeData,
      [makeUserPrinter()],
      [makeUserMaterial()],
      [makeRefPrinter()],
      [makeRefFilament()],
    )
    expect(result.confidence).toBe('exact')
    expect(result.suggestedPrinterId).toBe('user-printer-1')
    expect(result.suggestedMaterialId).toBe('user-material-1')
    expect(result.matchedRefPrinterId).toBe('ref-printer-1')
    expect(result.matchedRefFilamentId).toBe('ref-filament-1')
  })
})

// ---------------------------------------------------------------------------
// Scenario: partial match (only printer, or only filament)
// ---------------------------------------------------------------------------

describe('matchGcodeToUserEquipment — partial match', () => {
  it('returns confidence=partial when only printer matches', () => {
    const gcodeData = makeGcodeData({
      printerIdentifier: 'Creality Ender-3 V3',
      filamentType: 'PETG', // no matching ref for PETG
    })
    const result = matchGcodeToUserEquipment(
      gcodeData,
      [makeUserPrinter()],
      [makeUserMaterial()],
      [makeRefPrinter()],
      [makeRefFilament({ gcode_identifiers: ['PLA'] })], // only PLA ref
    )
    expect(result.confidence).toBe('partial')
    expect(result.suggestedPrinterId).toBe('user-printer-1')
    expect(result.suggestedMaterialId).toBeNull()
  })

  it('returns confidence=partial when only filament matches', () => {
    const gcodeData = makeGcodeData({
      printerIdentifier: 'UnknownPrinterXYZ',
      filamentType: 'PLA',
    })
    const result = matchGcodeToUserEquipment(
      gcodeData,
      [makeUserPrinter()],
      [makeUserMaterial()],
      [makeRefPrinter()],
      [makeRefFilament()],
    )
    expect(result.confidence).toBe('partial')
    expect(result.suggestedPrinterId).toBeNull()
    expect(result.suggestedMaterialId).toBe('user-material-1')
  })
})

// ---------------------------------------------------------------------------
// Scenario: no match
// ---------------------------------------------------------------------------

describe('matchGcodeToUserEquipment — no match', () => {
  it('returns confidence=none when neither printer nor filament matches', () => {
    const gcodeData = makeGcodeData({
      printerIdentifier: 'Prusa MK4',
      filamentType: 'TPU',
    })
    const result = matchGcodeToUserEquipment(
      gcodeData,
      [makeUserPrinter()],
      [makeUserMaterial()],
      [makeRefPrinter()],
      [makeRefFilament()],
    )
    expect(result.confidence).toBe('none')
    expect(result.suggestedPrinterId).toBeNull()
    expect(result.suggestedMaterialId).toBeNull()
    expect(result.matchedRefPrinterId).toBeNull()
    expect(result.matchedRefFilamentId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Scenario: empty inputs
// ---------------------------------------------------------------------------

describe('matchGcodeToUserEquipment — empty inputs', () => {
  it('returns confidence=none when printerIdentifier and filamentType are null', () => {
    const gcodeData = makeGcodeData({ printerIdentifier: null, filamentType: null })
    const result = matchGcodeToUserEquipment(
      gcodeData,
      [makeUserPrinter()],
      [makeUserMaterial()],
      [makeRefPrinter()],
      [makeRefFilament()],
    )
    expect(result.confidence).toBe('none')
  })

  it('returns confidence=none when ref catalogs are empty arrays', () => {
    const gcodeData = makeGcodeData({
      printerIdentifier: 'Creality Ender-3',
      filamentType: 'PLA',
    })
    const result = matchGcodeToUserEquipment(gcodeData, [], [], [], [])
    expect(result.confidence).toBe('none')
    expect(result.suggestedPrinterId).toBeNull()
    expect(result.suggestedMaterialId).toBeNull()
  })

  it('ref matched but no user equipment linked → suggestedPrinterId null', () => {
    const gcodeData = makeGcodeData({ printerIdentifier: 'Creality Ender-3 V3' })
    // No user printers
    const result = matchGcodeToUserEquipment(
      gcodeData,
      [], // no user printers
      [],
      [makeRefPrinter()],
      [],
    )
    expect(result.matchedRefPrinterId).toBe('ref-printer-1')
    expect(result.suggestedPrinterId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Scenario: popularity_rank tiebreak (lower rank wins)
// ---------------------------------------------------------------------------

describe('matchGcodeToUserEquipment — popularity_rank tiebreak', () => {
  it('prefers the ref entry with lower popularity_rank on equal match length', () => {
    const gcodeData = makeGcodeData({ printerIdentifier: 'Ender 3' })

    const refA = makeRefPrinter({
      id: 'ref-a',
      gcode_identifiers: ['Ender 3'],
      popularity_rank: 5,
    })
    const refB = makeRefPrinter({
      id: 'ref-b',
      gcode_identifiers: ['Ender 3'],
      popularity_rank: 2,
    })

    const userPrinterA = makeUserPrinter({ id: 'user-a', printer_model_id: 'ref-a' })
    const userPrinterB = makeUserPrinter({ id: 'user-b', printer_model_id: 'ref-b' })

    const result = matchGcodeToUserEquipment(
      gcodeData,
      [userPrinterA, userPrinterB],
      [],
      [refA, refB],
      [],
    )
    expect(result.matchedRefPrinterId).toBe('ref-b')
    expect(result.suggestedPrinterId).toBe('user-b')
  })
})

// ---------------------------------------------------------------------------
// Scenario: longest-match wins
// ---------------------------------------------------------------------------

describe('matchGcodeToUserEquipment — longest match wins', () => {
  it('prefers the longer identifier match over a shorter one', () => {
    const gcodeData = makeGcodeData({ printerIdentifier: 'Bambu Lab P1S 0.4 nozzle' })

    const refGeneric = makeRefPrinter({
      id: 'ref-generic',
      gcode_identifiers: ['Bambu Lab'],
      popularity_rank: 1,
    })
    const refSpecific = makeRefPrinter({
      id: 'ref-specific',
      gcode_identifiers: ['Bambu Lab P1S'],
      popularity_rank: 10, // higher rank (worse), but longer match should win
    })

    const userGeneric = makeUserPrinter({ id: 'user-generic', printer_model_id: 'ref-generic' })
    const userSpecific = makeUserPrinter({ id: 'user-specific', printer_model_id: 'ref-specific' })

    const result = matchGcodeToUserEquipment(
      gcodeData,
      [userGeneric, userSpecific],
      [],
      [refGeneric, refSpecific],
      [],
    )
    expect(result.matchedRefPrinterId).toBe('ref-specific')
    expect(result.suggestedPrinterId).toBe('user-specific')
  })
})

// ---------------------------------------------------------------------------
// Scenario: filament brand + type combined identifier
// ---------------------------------------------------------------------------

describe('matchGcodeToUserEquipment — filament combined identifier', () => {
  it('matches using combined "type brand" string against gcode_identifiers', () => {
    const gcodeData = makeGcodeData({
      filamentType: 'PLA',
      filamentBrand: 'eSUN',
    })

    const refFilament = makeRefFilament({
      id: 'ref-esun-pla',
      gcode_identifiers: ['PLA eSUN'],
    })
    const userMaterial = makeUserMaterial({ filament_id: 'ref-esun-pla' })

    const result = matchGcodeToUserEquipment(
      gcodeData,
      [],
      [userMaterial],
      [],
      [refFilament],
    )
    expect(result.matchedRefFilamentId).toBe('ref-esun-pla')
    expect(result.suggestedMaterialId).toBe('user-material-1')
  })
})
