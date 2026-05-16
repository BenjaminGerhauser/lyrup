/**
 * src/lib/pdf/generate.ts
 * Public API: generateQuotePdf — creates a PDF Blob from quote data.
 *
 * Uses react-pdf's pdf().toBlob() API. This function is client-only
 * (called from quote-pdf-button.tsx via dynamic import at click time).
 */

import { pdf } from '@react-pdf/renderer'
import { QuoteDocument } from './document'
import type { QuoteDocumentUser } from './document'
import type { QuoteWithItems, Client } from '@/types/domain'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateQuotePdfOpts {
  quote: QuoteWithItems
  user: QuoteDocumentUser
  client: Client | null
}

// ---------------------------------------------------------------------------
// generateQuotePdf
// ---------------------------------------------------------------------------

/**
 * Generate a PDF Blob for the given quote.
 *
 * Returns a Promise<Blob> with MIME type application/pdf.
 * Throws on generation failure — callers should wrap in try/catch.
 *
 * Smoke-tested in __tests__/generate.test.ts: assert Blob.size > 5000 bytes
 * and type === 'application/pdf'.
 */
export async function generateQuotePdf(opts: GenerateQuotePdfOpts): Promise<Blob> {
  const element = QuoteDocument(opts)
  const blob = await pdf(element).toBlob()
  return blob
}
