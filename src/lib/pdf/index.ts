/**
 * src/lib/pdf/index.ts — public barrel export.
 *
 * IMPORTANT: This module imports @react-pdf/renderer at module load.
 * It MUST only be consumed from:
 *   - src/components/cotizaciones/quote-pdf-button.tsx (via dynamic import at click time)
 *   - src/lib/pdf/** internals
 *
 * Any other importer will bundle react-pdf into routes that don't need it.
 * The verify phase enforces this with a grep audit.
 */

export { generateQuotePdf } from './generate'
export type { GenerateQuotePdfOpts } from './generate'
export type { QuoteDocumentUser } from './document'
