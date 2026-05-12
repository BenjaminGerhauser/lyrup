/**
 * G-code matcher — Sprint 1, Phase 2.
 * Pure function — zero DB calls, zero Next.js imports.
 *
 * Algorithm:
 * 1. Case-insensitive substring matching against ref gcode_identifiers arrays.
 * 2. Longest-matched-substring wins when multiple refs match.
 * 3. Ties broken by popularity_rank ASC (lower number = more popular).
 * 4. User-owned items are cross-referenced by ref FK.
 */

import type { GcodeData, GcodeMatch } from '@/types/gcode'
import type { Printer, Material, RefPrinterModel, RefFilamentCatalog } from '@/types/domain'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface RefMatchResult {
  refId: string
  matchLength: number
  popularityRank: number
}

/**
 * Find the best matching ref entry for a raw identifier string.
 * Returns the ref row's ID plus match metadata, or null if nothing matches.
 */
function findBestRefMatch<T extends { id: string; gcode_identifiers: string[] | null; popularity_rank: number }>(
  rawIdentifier: string | null,
  refEntries: T[]
): RefMatchResult | null {
  if (!rawIdentifier || rawIdentifier.trim().length === 0) return null

  const normalised = rawIdentifier.toLowerCase()
  let best: RefMatchResult | null = null

  for (const ref of refEntries) {
    const ids = ref.gcode_identifiers
    if (!ids || ids.length === 0) continue

    for (const id of ids) {
      const normId = id.toLowerCase()
      // substring match: either the ref id is a substring of the gcode field, or vice-versa
      const isMatch = normalised.includes(normId) || normId.includes(normalised)
      if (!isMatch) continue

      const matchLength = Math.min(normId.length, normalised.length)

      if (
        best === null ||
        matchLength > best.matchLength ||
        (matchLength === best.matchLength && ref.popularity_rank < best.popularityRank)
      ) {
        best = { refId: ref.id, matchLength, popularityRank: ref.popularity_rank }
      }
    }
  }

  return best
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Match parsed G-code metadata against the user's registered equipment
 * and the shared reference catalog.
 *
 * @param gcodeData          Output from parseGcode()
 * @param userPrinters       The authenticated user's printer rows
 * @param userMaterials      The authenticated user's material rows
 * @param refPrinterModels   Full ref_printer_models catalog
 * @param refFilamentCatalog Full ref_filament_catalog
 * @returns GcodeMatch with confidence + suggested IDs
 */
export function matchGcodeToUserEquipment(
  gcodeData: GcodeData,
  userPrinters: Printer[],
  userMaterials: Material[],
  refPrinterModels: RefPrinterModel[],
  refFilamentCatalog: RefFilamentCatalog[]
): GcodeMatch {
  // ── Printer matching ──────────────────────────────────────────────────────

  const printerRefMatch = findBestRefMatch(gcodeData.printerIdentifier, refPrinterModels)
  let suggestedPrinterId: string | null = null
  const matchedRefPrinterId: string | null = printerRefMatch?.refId ?? null

  if (matchedRefPrinterId) {
    // Find the user's printer that references this model
    const userPrinter = userPrinters.find(
      (p) => p.printer_model_id === matchedRefPrinterId
    )
    suggestedPrinterId = userPrinter?.id ?? null
  }

  // ── Filament matching ─────────────────────────────────────────────────────

  // Combine type + brand into a single identifier string for matching
  // e.g. "PLA PrintaLot" — more specific = better match
  const filamentIdentifier = [gcodeData.filamentType, gcodeData.filamentBrand]
    .filter(Boolean)
    .join(' ') || null

  const filamentRefMatch = findBestRefMatch(filamentIdentifier, refFilamentCatalog)
  let suggestedMaterialId: string | null = null
  const matchedRefFilamentId: string | null = filamentRefMatch?.refId ?? null

  if (matchedRefFilamentId) {
    // Find the user's material that references this catalog entry
    const userMaterial = userMaterials.find(
      (m) => m.filament_id === matchedRefFilamentId
    )
    suggestedMaterialId = userMaterial?.id ?? null
  }

  // ── Confidence calculation ────────────────────────────────────────────────

  const printerMatched = suggestedPrinterId !== null
  const filamentMatched = suggestedMaterialId !== null

  let confidence: 'exact' | 'partial' | 'none'
  if (printerMatched && filamentMatched) {
    confidence = 'exact'
  } else if (printerMatched || filamentMatched) {
    confidence = 'partial'
  } else {
    confidence = 'none'
  }

  return {
    confidence,
    suggestedPrinterId,
    suggestedMaterialId,
    matchedRefPrinterId,
    matchedRefFilamentId,
  }
}
