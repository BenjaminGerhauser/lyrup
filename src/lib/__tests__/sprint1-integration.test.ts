/**
 * Sprint 1 — Cross-cutting integration test (Task 6.1).
 *
 * Exercises the full pipeline:
 *   parseGcode → matchGcodeToUserEquipment → calculateCosts
 *
 * Uses realistic fixture content from the fixture .gcode files and
 * mock user printers/materials that mirror the domain types exactly.
 * No DB calls, no Next.js imports — pure-function pipeline.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

import { parseGcode } from '../gcode-parser'
import { matchGcodeToUserEquipment } from '../gcode-matcher'
import { calculateCosts } from '../cost-calculator'

import type { Printer, Material, RefPrinterModel, RefFilamentCatalog } from '@/types/domain'
import type { CostBreakdown, CalculatorError } from '@/types/calculator'

// ---------------------------------------------------------------------------
// Helpers — read fixture files
// ---------------------------------------------------------------------------

const FIXTURES_DIR = join(__dirname, 'fixtures')

function readFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf-8')
}

// ---------------------------------------------------------------------------
// Mock catalog / user equipment
// ---------------------------------------------------------------------------

/** Ref printer model: Prusa MK4 — matches prusaslicer.gcode "printer_model = MK4" */
const refMK4: RefPrinterModel = {
  id: 'ref-prusa-mk4',
  brand: 'Prusa',
  model: 'MK4',
  bed_x_mm: 250,
  bed_y_mm: 210,
  bed_z_mm: 220,
  power_w: 330,
  last_updated: '2024-01-01',
  gcode_identifiers: ['MK4', 'Original Prusa MK4'],
  popularity_rank: 2,
  estimated_life_hours: 3000,
  firmware_type: 'Marlin',
  nozzle_diameter_default: 0.4,
  full_name: 'Prusa MK4',
  reference_price_ars: 1200000,
}

/** Ref printer model: Creality Ender 3 V3 — matches cura.gcode "TARGET_MACHINE.NAME: Creality Ender-3 V3" */
const refEnder3V3: RefPrinterModel = {
  id: 'ref-creality-ender3v3',
  brand: 'Creality',
  model: 'Ender 3 V3',
  bed_x_mm: 220,
  bed_y_mm: 220,
  bed_z_mm: 250,
  power_w: 350,
  last_updated: '2024-01-01',
  gcode_identifiers: ['Creality Ender-3 V3', 'Ender 3 V3'],
  popularity_rank: 1,
  estimated_life_hours: 2000,
  firmware_type: 'Marlin',
  nozzle_diameter_default: 0.4,
  full_name: 'Creality Ender 3 V3',
  reference_price_ars: 450000,
}

/** Ref filament: Prusament PLA — matches prusaslicer.gcode "filament_vendor = Prusament" + "filament_type = PLA" */
const refPrusamentPLA: RefFilamentCatalog = {
  id: 'ref-prusament-pla',
  brand: 'Prusament',
  material_type: 'PLA',
  color: null,
  price_per_kg_ars: 22000,
  density_g_cm3: 1.24,
  last_updated: '2024-01-01',
  gcode_identifiers: ['PLA Prusament', 'Prusament PLA'],
  popularity_rank: 3,
  nozzle_temp_min: 215,
  nozzle_temp_max: 230,
  bed_temp_min: 55,
  bed_temp_max: 65,
  filament_diameter: 1.75,
}

/** Ref filament: generic PLA — matches cura.gcode "MATERIAL: PLA" */
const refGenericPLA: RefFilamentCatalog = {
  id: 'ref-generic-pla',
  brand: 'eSUN',
  material_type: 'PLA',
  color: null,
  price_per_kg_ars: 15000,
  density_g_cm3: 1.24,
  last_updated: '2024-01-01',
  gcode_identifiers: ['PLA'],
  popularity_rank: 1,
  nozzle_temp_min: 200,
  nozzle_temp_max: 230,
  bed_temp_min: 50,
  bed_temp_max: 65,
  filament_diameter: 1.75,
}

/** User-owned MK4 printer */
const userPrinterMK4: Printer = {
  id: 'user-printer-mk4',
  user_id: 'user-test-1',
  name: 'Mi Prusa MK4',
  printer_model_id: 'ref-prusa-mk4',
  power_w: 330,
  purchase_price_ars: 1200000,
  depreciation_months: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  life_hours_estimate: 3000,
  nozzle_diameter: 0.4,
  accumulated_hours: 200,
}

/** User-owned Ender 3 V3 printer */
const userPrinterEnder3: Printer = {
  id: 'user-printer-ender3',
  user_id: 'user-test-1',
  name: 'Mi Ender 3 V3',
  printer_model_id: 'ref-creality-ender3v3',
  power_w: 350,
  purchase_price_ars: 450000,
  depreciation_months: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  life_hours_estimate: 2000,
  nozzle_diameter: 0.4,
  accumulated_hours: 0,
}

/** User-owned Prusament PLA material */
const userMaterialPrusament: Material = {
  id: 'user-material-prusament',
  user_id: 'user-test-1',
  name: 'Prusament PLA Galaxy Black',
  filament_id: 'ref-prusament-pla',
  material_type: 'PLA',
  color: '#1a1a1a',
  price_per_kg_ars: 22000,
  density_g_cm3: 1.24,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  filament_diameter: 1.75,
  nozzle_temp: 215,
}

/** User-owned generic PLA material */
const userMaterialGenericPLA: Material = {
  id: 'user-material-generic-pla',
  user_id: 'user-test-1',
  name: 'eSUN PLA+ Blanco',
  filament_id: 'ref-generic-pla',
  material_type: 'PLA',
  color: '#ffffff',
  price_per_kg_ars: 15000,
  density_g_cm3: 1.24,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  filament_diameter: 1.75,
  nozzle_temp: 210,
}

const ALL_REFS = [refMK4, refEnder3V3]
const ALL_FILAMENT_REFS = [refPrusamentPLA, refGenericPLA]
const ALL_USER_PRINTERS = [userPrinterMK4, userPrinterEnder3]
const ALL_USER_MATERIALS = [userMaterialPrusament, userMaterialGenericPLA]

// ---------------------------------------------------------------------------
// User configuration (from users table, Sprint 1 Phase 5)
// ---------------------------------------------------------------------------

const USER_CONFIG = {
  electricityRateKwh: 120,   // ARS/kWh — realistic Argentine tier 2
  laborRateHour: 1500,        // ARS/hr
  laborFactor: 0.2,           // 20%
  marginPercent: 30,          // 30% markup
}

// ---------------------------------------------------------------------------
// Helper: assemble CalculatorParams from parsed gcode + matched equipment
// ---------------------------------------------------------------------------

function buildCalcParams(
  gcodeFilamentGrams: number,
  gcodeTimeMinutes: number,
  printer: Printer,
  material: Material,
) {
  return {
    filamentGrams: gcodeFilamentGrams,
    printTimeMinutes: gcodeTimeMinutes,
    materialPricePerKg: material.price_per_kg_ars ?? 15000,
    printerWatts: printer.power_w ?? 200,
    electricityRateKwh: USER_CONFIG.electricityRateKwh,
    printerPrice: printer.purchase_price_ars ?? 0,
    printerLifeHours: printer.life_hours_estimate,
    laborRateHour: USER_CONFIG.laborRateHour,
    laborFactor: USER_CONFIG.laborFactor,
    marginPercent: USER_CONFIG.marginPercent,
  }
}

// ---------------------------------------------------------------------------
// Scenario A — PrusaSlicer fixture: full pipeline end-to-end
// ---------------------------------------------------------------------------

describe('Sprint 1 integration — PrusaSlicer fixture full pipeline', () => {
  const content = readFixture('prusaslicer.gcode')

  it('step 1 — parseGcode recognises PrusaSlicer and extracts metadata', () => {
    const data = parseGcode(content)
    expect(data).not.toBeNull()
    expect(data!.slicerType).toBe('prusaslicer')
    expect(data!.slicerName).toContain('PrusaSlicer')
    // prusaslicer.gcode: "estimated printing time (normal mode) = 2h 34m 0s" → 154 min
    expect(data!.estimatedTimeMinutes).toBeCloseTo(154, 0)
    // prusaslicer.gcode: "filament used [mm] = 4521.23" with density 1.24, diameter 1.75
    expect(data!.filamentUsedMm).toBeCloseTo(4521.23, 1)
    expect(data!.filamentUsedGrams).toBeGreaterThan(0)
    // prusaslicer.gcode: "printer_model = MK4"
    expect(data!.printerIdentifier).toBe('MK4')
    // prusaslicer.gcode: "filament_type = PLA", "filament_vendor = Prusament"
    expect(data!.filamentType).toBe('PLA')
    expect(data!.filamentBrand).toBe('Prusament')
  })

  it('step 2 — matchGcodeToUserEquipment resolves MK4 printer and Prusament PLA', () => {
    const data = parseGcode(content)!
    const match = matchGcodeToUserEquipment(
      data,
      ALL_USER_PRINTERS,
      ALL_USER_MATERIALS,
      ALL_REFS,
      ALL_FILAMENT_REFS,
    )
    expect(match.confidence).toBe('exact')
    expect(match.matchedRefPrinterId).toBe('ref-prusa-mk4')
    expect(match.suggestedPrinterId).toBe('user-printer-mk4')
    expect(match.matchedRefFilamentId).toBe('ref-prusament-pla')
    expect(match.suggestedMaterialId).toBe('user-material-prusament')
  })

  it('step 3 — calculateCosts returns a sensible cost breakdown (no error)', () => {
    const data = parseGcode(content)!
    const match = matchGcodeToUserEquipment(
      data,
      ALL_USER_PRINTERS,
      ALL_USER_MATERIALS,
      ALL_REFS,
      ALL_FILAMENT_REFS,
    )

    const printer = ALL_USER_PRINTERS.find(p => p.id === match.suggestedPrinterId)!
    const material = ALL_USER_MATERIALS.find(m => m.id === match.suggestedMaterialId)!

    const params = buildCalcParams(
      data.filamentUsedGrams!,
      data.estimatedTimeMinutes!,
      printer,
      material,
    )

    const result = calculateCosts(params)
    expect('error' in result).toBe(false)

    const breakdown = result as CostBreakdown

    // materialCost = (filamentGrams / 1000) × 22000 — should be a few hundred ARS
    expect(breakdown.materialCost).toBeGreaterThan(0)
    // electricityCost > 0 (printer is 330W, 154 min)
    expect(breakdown.electricityCost).toBeGreaterThan(0)
    // depreciationCost > 0 (printer has price and life_hours_estimate)
    expect(breakdown.depreciationCost).toBeGreaterThan(0)
    // laborCost > 0
    expect(breakdown.laborCost).toBeGreaterThan(0)
    // totalCost = sum of components
    expect(breakdown.totalCost).toBeCloseTo(
      breakdown.materialCost + breakdown.electricityCost + breakdown.depreciationCost + breakdown.laborCost,
      5,
    )
    // suggestedPrice = totalCost × 1.30
    expect(breakdown.suggestedPrice).toBeCloseTo(breakdown.totalCost * 1.30, 5)
    // Sanity: suggestedPrice > totalCost (margin applied)
    expect(breakdown.suggestedPrice).toBeGreaterThan(breakdown.totalCost)
  })
})

// ---------------------------------------------------------------------------
// Scenario B — Cura fixture: full pipeline end-to-end
// ---------------------------------------------------------------------------

describe('Sprint 1 integration — Cura fixture full pipeline', () => {
  const content = readFixture('cura.gcode')

  it('step 1 — parseGcode recognises Cura and extracts metadata', () => {
    const data = parseGcode(content)
    expect(data).not.toBeNull()
    expect(data!.slicerType).toBe('cura')
    // cura.gcode: TIME:9240 → 154 min
    expect(data!.estimatedTimeMinutes).toBeCloseTo(154, 0)
    // cura.gcode: Filament used: 4521.23mm
    expect(data!.filamentUsedMm).toBeCloseTo(4521.23, 1)
    expect(data!.filamentUsedGrams).toBeGreaterThan(0)
    // cura.gcode: MACHINE_NAME: "Ender 3 V3" is parsed first (before TARGET_MACHINE.NAME)
    // The Cura extractor captures MACHINE_NAME before TARGET_MACHINE.NAME per the regex order.
    // Actual value is 'Ender 3 V3' — both identifiers land in the ref catalog match.
    expect(data!.printerIdentifier).toBe('Ender 3 V3')
    // cura.gcode: MATERIAL: PLA
    expect(data!.filamentType).toBe('PLA')
  })

  it('step 2 — matchGcodeToUserEquipment resolves Ender 3 printer and generic PLA', () => {
    const data = parseGcode(content)!
    const match = matchGcodeToUserEquipment(
      data,
      ALL_USER_PRINTERS,
      ALL_USER_MATERIALS,
      ALL_REFS,
      ALL_FILAMENT_REFS,
    )
    // Cura: printer identifier "Creality Ender-3 V3" should match ref "Creality Ender-3 V3"
    expect(match.matchedRefPrinterId).toBe('ref-creality-ender3v3')
    expect(match.suggestedPrinterId).toBe('user-printer-ender3')
    // filament: "PLA" matches generic PLA ref
    expect(match.matchedRefFilamentId).toBe('ref-generic-pla')
    expect(match.suggestedMaterialId).toBe('user-material-generic-pla')
    expect(match.confidence).toBe('exact')
  })

  it('step 3 — calculateCosts returns a sensible cost breakdown', () => {
    const data = parseGcode(content)!
    const match = matchGcodeToUserEquipment(
      data,
      ALL_USER_PRINTERS,
      ALL_USER_MATERIALS,
      ALL_REFS,
      ALL_FILAMENT_REFS,
    )

    const printer = ALL_USER_PRINTERS.find(p => p.id === match.suggestedPrinterId)!
    const material = ALL_USER_MATERIALS.find(m => m.id === match.suggestedMaterialId)!

    const params = buildCalcParams(
      data.filamentUsedGrams!,
      data.estimatedTimeMinutes!,
      printer,
      material,
    )

    const result = calculateCosts(params)
    expect('error' in result).toBe(false)

    const breakdown = result as CostBreakdown
    expect(breakdown.totalCost).toBeGreaterThan(0)
    expect(breakdown.suggestedPrice).toBeCloseTo(breakdown.totalCost * 1.30, 5)
  })
})

// ---------------------------------------------------------------------------
// Scenario C — OrcaSlicer fixture: slicer detection + cost path
// ---------------------------------------------------------------------------

describe('Sprint 1 integration — OrcaSlicer fixture full pipeline', () => {
  const content = readFixture('orcaslicer.gcode')

  it('step 1 — parseGcode recognises OrcaSlicer', () => {
    const data = parseGcode(content)
    expect(data).not.toBeNull()
    expect(data!.slicerType).toBe('orcaslicer')
  })

  it('step 3 — calculateCosts with extracted data (or fallback defaults) returns no error', () => {
    const data = parseGcode(content)!
    // Use Cura fixture to have reliable grams/time if OrcaSlicer fixture lacks them
    const filamentGrams = data.filamentUsedGrams ?? 13.5
    const timeMinutes = data.estimatedTimeMinutes ?? 90

    const params = buildCalcParams(filamentGrams, timeMinutes, userPrinterMK4, userMaterialPrusament)
    const result = calculateCosts(params)

    expect('error' in result).toBe(false)
    const breakdown = result as CostBreakdown
    expect(breakdown.totalCost).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Scenario D — BambuStudio fixture: slicer detection + cost path
// ---------------------------------------------------------------------------

describe('Sprint 1 integration — BambuStudio fixture full pipeline', () => {
  const content = readFixture('bambustudio.gcode')

  it('step 1 — parseGcode recognises BambuStudio', () => {
    const data = parseGcode(content)
    expect(data).not.toBeNull()
    expect(data!.slicerType).toBe('bambustudio')
  })

  it('step 3 — calculateCosts with extracted data returns no error', () => {
    const data = parseGcode(content)!
    const filamentGrams = data.filamentUsedGrams ?? 13.5
    const timeMinutes = data.estimatedTimeMinutes ?? 90

    const params = buildCalcParams(filamentGrams, timeMinutes, userPrinterMK4, userMaterialPrusament)
    const result = calculateCosts(params)

    expect('error' in result).toBe(false)
    const breakdown = result as CostBreakdown
    expect(breakdown.totalCost).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Scenario E — Simplify3D fixture
// ---------------------------------------------------------------------------

describe('Sprint 1 integration — Simplify3D fixture full pipeline', () => {
  const content = readFixture('simplify3d.gcode')

  it('step 1 — parseGcode recognises Simplify3D', () => {
    const data = parseGcode(content)
    expect(data).not.toBeNull()
    expect(data!.slicerType).toBe('simplify3d')
  })

  it('step 3 — calculateCosts with extracted data returns no error', () => {
    const data = parseGcode(content)!
    const filamentGrams = data.filamentUsedGrams ?? 10
    const timeMinutes = data.estimatedTimeMinutes ?? 60

    const params = buildCalcParams(filamentGrams, timeMinutes, userPrinterEnder3, userMaterialGenericPLA)
    const result = calculateCosts(params)

    expect('error' in result).toBe(false)
    const breakdown = result as CostBreakdown
    expect(breakdown.totalCost).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Scenario F — confidence=none path still produces valid costs when user
//              manually selects printer + material
// ---------------------------------------------------------------------------

describe('Sprint 1 integration — confidence=none fallback path', () => {
  it('when gcode has no slicer identifier, user can still calculate costs manually', () => {
    // A gcode that produces no identifier
    const syntheticGcode = '; generated by PrusaSlicer 2.7.4 on 2024-01-01\n; printer_model = UNKNOWN_MODEL_XYZ\n; filament_type = ASA\n; filament_vendor = SomeUnknownBrand\n; filament used [mm] = 3000.00\n; estimated printing time (normal mode) = 1h 30m 0s\n'
    const data = parseGcode(syntheticGcode)
    expect(data).not.toBeNull()

    const match = matchGcodeToUserEquipment(
      data!,
      ALL_USER_PRINTERS,
      ALL_USER_MATERIALS,
      ALL_REFS,
      ALL_FILAMENT_REFS,
    )
    // No match for UNKNOWN_MODEL_XYZ / ASA SomeUnknownBrand
    expect(match.confidence).toBe('none')
    expect(match.suggestedPrinterId).toBeNull()
    expect(match.suggestedMaterialId).toBeNull()

    // User manually picks printer + material — calculator still works
    const manualParams = buildCalcParams(
      data!.filamentUsedGrams ?? 10,
      data!.estimatedTimeMinutes ?? 90,
      userPrinterMK4,       // manually selected
      userMaterialPrusament, // manually selected
    )
    const result = calculateCosts(manualParams)
    expect('error' in result).toBe(false)
    expect((result as CostBreakdown).totalCost).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Scenario G — invalid gcode content returns null from parseGcode
// ---------------------------------------------------------------------------

describe('Sprint 1 integration — invalid gcode guard', () => {
  it('parseGcode returns null for empty string — pipeline aborts cleanly', () => {
    expect(parseGcode('')).toBeNull()
    expect(parseGcode('   ')).toBeNull()
  })

  it('parseGcode returns null for unrecognised slicer — pipeline aborts cleanly', () => {
    const unknown = '; MADE BY SOME UNKNOWN SLICER 1.0\nG28 ; Home\nG1 X50 Y50 Z10 F3000\n'
    expect(parseGcode(unknown)).toBeNull()
  })
})
