/**
 * G-code parser types — Sprint 1, Phase 1.
 * All GcodeData fields except slicerName are nullable to represent fields
 * that may be absent from a given slicer's header output.
 */

/** Union of all supported slicer identifiers. */
export type SlicerType =
  | 'cura'
  | 'prusaslicer'
  | 'orcaslicer'
  | 'bambustudio'
  | 'simplify3d'

/**
 * Parsed data extracted from a G-code file header.
 * Absence of a field in the source file is represented as `null`,
 * never as `0` or `""`.
 */
export interface GcodeData {
  /** Detected slicer name and version (e.g. "Cura 5.7.0"). Null on detection failure. */
  slicerName: string | null
  /** Detected slicer type enum value. Null if slicer cannot be identified. */
  slicerType: SlicerType | null
  /** Estimated print time in minutes. Null if not present in header. */
  estimatedTimeMinutes: number | null
  /** Filament used in millimetres (linear extrusion length). Null if not present. */
  filamentUsedMm: number | null
  /** Filament weight in grams, calculated from mm × π × (diameter/2)² × density / 1000. Null if mm unavailable. */
  filamentUsedGrams: number | null
  /** Total layer count. Null if not present. */
  layerCount: number | null
  /** First nozzle temperature (°C) found in the file. Null if not present. */
  nozzleTemp: number | null
  /** First bed temperature (°C) found in the file. Null if not present. */
  bedTemp: number | null
  /**
   * Raw printer identifier string extracted from the header
   * (e.g. "Creality Ender-3 V3 SE", "Bambu Lab P1S").
   * Used by the matcher — not normalised.
   */
  printerIdentifier: string | null
  /**
   * Raw filament type string (e.g. "PLA", "PETG").
   * Used by the matcher — not normalised.
   */
  filamentType: string | null
  /**
   * Raw filament brand/vendor string (e.g. "eSUN", "PrintaLot").
   * Used by the matcher — not normalised.
   */
  filamentBrand: string | null
}

/**
 * Result of matching G-code data against the user's registered equipment
 * and the shared reference catalog.
 */
export interface GcodeMatch {
  /**
   * Match confidence level:
   * - `exact`   — printer AND filament matched to user-owned items
   * - `partial` — at least one of printer/filament matched
   * - `none`    — no match found
   */
  confidence: 'exact' | 'partial' | 'none'
  /**
   * UUID of the user's `printers` row that best matches.
   * Null when no printer match was found.
   */
  suggestedPrinterId: string | null
  /**
   * UUID of the user's `materials` row that best matches.
   * Null when no material match was found.
   */
  suggestedMaterialId: string | null
  /**
   * UUID of the `ref_printer_models` row that the parser string matched.
   * Null when no ref match was found.
   */
  matchedRefPrinterId: string | null
  /**
   * UUID of the `ref_filament_catalog` row that the parser string matched.
   * Null when no ref match was found.
   */
  matchedRefFilamentId: string | null
}
