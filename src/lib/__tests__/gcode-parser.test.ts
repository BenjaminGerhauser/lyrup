import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseGcode } from '../gcode-parser'

// ---------------------------------------------------------------------------
// Fixture loader helper
// ---------------------------------------------------------------------------

function loadFixture(name: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf-8')
}

const DEFAULTS = { density: 1.24, diameter: 1.75 }

// ---------------------------------------------------------------------------
// Cura happy path (Scenario 1)
// ---------------------------------------------------------------------------

describe('parseGcode — Cura', () => {
  it('detects slicer as cura and slicerName starts with "Cura"', () => {
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)
    expect(result).not.toBeNull()
    expect(result!.slicerType).toBe('cura')
    expect(result!.slicerName).toMatch(/^Cura/)
  })

  it('extracts estimatedTimeMinutes ≈ 154 from TIME:9240 seconds', () => {
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)!
    // 9240 / 60 = 154
    expect(result.estimatedTimeMinutes).toBeCloseTo(154, 0)
  })

  it('extracts filamentUsedMm ≈ 4521', () => {
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.filamentUsedMm).toBeCloseTo(4521.23, 1)
  })

  it('calculates filamentUsedGrams ≈ 13.5 (spec formula)', () => {
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)!
    // 4521.23 × π × (0.875)² × 1.24 / 1000 ≈ 13.5
    expect(result.filamentUsedGrams).toBeCloseTo(13.5, 0)
  })

  it('extracts layerCount = 150', () => {
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.layerCount).toBe(150)
  })

  it('extracts nozzleTemp = 210 and bedTemp = 60', () => {
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.nozzleTemp).toBe(210)
    expect(result.bedTemp).toBe(60)
  })

  it('extracts printerIdentifier and filamentType', () => {
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.printerIdentifier).toBeTruthy()
    expect(result.filamentType).toBe('PLA')
  })
})

// ---------------------------------------------------------------------------
// PrusaSlicer vs OrcaSlicer disambiguation (Scenario 2)
// ---------------------------------------------------------------------------

describe('parseGcode — PrusaSlicer / OrcaSlicer disambiguation', () => {
  it('PrusaSlicer file → slicerType is "prusaslicer", NOT "orcaslicer"', () => {
    const content = loadFixture('prusaslicer.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result).not.toBeNull()
    expect(result.slicerType).toBe('prusaslicer')
    expect(result.slicerName).toContain('PrusaSlicer')
    expect(result.slicerName).not.toContain('OrcaSlicer')
  })

  it('OrcaSlicer file → slicerType is "orcaslicer", NOT "prusaslicer"', () => {
    const content = loadFixture('orcaslicer.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result).not.toBeNull()
    expect(result.slicerType).toBe('orcaslicer')
    expect(result.slicerName).toContain('OrcaSlicer')
  })

  it('PrusaSlicer extracts printing time correctly (1h 30m format)', () => {
    // fixture has "2h 34m 0s"
    const content = loadFixture('prusaslicer.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.estimatedTimeMinutes).toBeCloseTo(154, 0)
  })

  it('PrusaSlicer extracts filamentBrand from filament_vendor', () => {
    const content = loadFixture('prusaslicer.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.filamentBrand).toBe('Prusament')
  })
})

// ---------------------------------------------------------------------------
// BambuStudio detection (Scenario 3)
// ---------------------------------------------------------------------------

describe('parseGcode — BambuStudio', () => {
  it('detects BambuStudio slicer and slicerName contains "BambuStudio"', () => {
    const content = loadFixture('bambustudio.gcode')
    const result = parseGcode(content, DEFAULTS)
    expect(result).not.toBeNull()
    expect(result!.slicerType).toBe('bambustudio')
    expect(result!.slicerName).toContain('BambuStudio')
  })

  it('extracts printerIdentifier = "Bambu Lab P1S 0.4 nozzle"', () => {
    const content = loadFixture('bambustudio.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.printerIdentifier).toBe('Bambu Lab P1S 0.4 nozzle')
  })

  it('extracts filamentType = "PLA" and filamentBrand = "Bambu Lab"', () => {
    const content = loadFixture('bambustudio.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.filamentType).toBe('PLA')
    expect(result.filamentBrand).toBe('Bambu Lab')
  })

  it('extracts estimatedTimeMinutes from total estimated time (s)', () => {
    const content = loadFixture('bambustudio.gcode')
    const result = parseGcode(content, DEFAULTS)!
    // 5580 / 60 = 93
    expect(result.estimatedTimeMinutes).toBeCloseTo(93, 0)
  })
})

// ---------------------------------------------------------------------------
// Simplify3D detection (Scenario 4)
// ---------------------------------------------------------------------------

describe('parseGcode — Simplify3D', () => {
  it('detects Simplify3D and slicerName contains "Simplify3D"', () => {
    const content = loadFixture('simplify3d.gcode')
    const result = parseGcode(content, DEFAULTS)
    expect(result).not.toBeNull()
    expect(result!.slicerType).toBe('simplify3d')
    expect(result!.slicerName).toContain('Simplify3D')
  })

  it('extracts filamentType = "PLA" and printerIdentifier = "ender3"', () => {
    const content = loadFixture('simplify3d.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.filamentType).toBe('PLA')
    expect(result.printerIdentifier).toBe('ender3')
  })

  it('extracts estimatedTimeMinutes from "Build time: 2 hours 15 minutes"', () => {
    const content = loadFixture('simplify3d.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.estimatedTimeMinutes).toBeCloseTo(135, 0)
  })
})

// ---------------------------------------------------------------------------
// Malformed / edge cases (Scenario 5 + 6)
// ---------------------------------------------------------------------------

describe('parseGcode — edge cases', () => {
  it('empty string → null (Scenario 5)', () => {
    expect(parseGcode('')).toBeNull()
  })

  it('"hello world" non-gcode → null (Scenario 5)', () => {
    expect(parseGcode('hello world')).toBeNull()
  })

  it('valid Cura header with no time comment → estimatedTimeMinutes is null (Scenario 6)', () => {
    const noTime = `;Generated with Cura_SteamEngine 5.7.0\n;MACHINE_NAME:Ender 3 V3\n;Filament used: 1000mm\n;LAYER_COUNT:50\nM104 S210\nM140 S60`
    const result = parseGcode(noTime, DEFAULTS)!
    expect(result).not.toBeNull()
    expect(result.estimatedTimeMinutes).toBeNull()
  })

  it('missing field returns null, not 0 (type safety check)', () => {
    const noLayers = `;Generated with Cura_SteamEngine 5.7.0\n;MACHINE_NAME:Ender 3\n;TIME:600\nM104 S200\nM140 S60`
    const result = parseGcode(noLayers, DEFAULTS)!
    expect(result).not.toBeNull()
    expect(result.layerCount).toBeNull()
    expect(result.filamentUsedMm).toBeNull()
    expect(result.filamentUsedGrams).toBeNull()
  })

  it('gramage formula: 4521.23mm with density=1.24 diameter=1.75 ≈ 13.5g (Scenario 7)', () => {
    // Direct formula test — no fixture needed
    // 4521.23 × π × (0.875)² × 1.24 / 1000
    const expected = 4521.23 * Math.PI * 0.875 * 0.875 * 1.24 / 1000
    expect(expected).toBeCloseTo(13.5, 0)

    // Also verify via parser
    const content = loadFixture('cura.gcode')
    const result = parseGcode(content, DEFAULTS)!
    expect(result.filamentUsedGrams).toBeCloseTo(expected, 1)
  })
})
