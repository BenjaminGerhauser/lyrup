'use client'

/**
 * quote-pdf-button.tsx — Client leaf component for PDF download.
 *
 * BUNDLE ISOLATION RULE:
 *   This is the ONLY file outside src/lib/pdf/** that may import @/lib/pdf.
 *   It is itself loaded via next/dynamic({ ssr: false }) from quote-actions.tsx,
 *   so @react-pdf/renderer is never included in any SSR or non-quote-detail bundle.
 *
 * Import happens at module level (i.e. when this chunk loads in the browser)
 * — which only occurs after next/dynamic lazy-loads this component on demand.
 */

import { useState } from 'react'
import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateQuotePdf } from '@/lib/pdf'
import type { QuoteDocumentUser } from '@/lib/pdf/document'
import type { QuoteWithItems, Client } from '@/types/domain'
import { trackPdfGenerated, trackPdfError } from '@/lib/analytics/umami'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuotePdfButtonProps {
  quote: QuoteWithItems
  user: QuoteDocumentUser
  client: Client | null
}

// ---------------------------------------------------------------------------
// QuotePdfButton
// ---------------------------------------------------------------------------

export function QuotePdfButton({ quote, user, client }: QuotePdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasItems = quote.items.length > 0

  const handleDownload = async () => {
    if (isGenerating || !hasItems) return

    setIsGenerating(true)
    setError(null)

    try {
      const blob = await generateQuotePdf({ quote, user, client })
      const url = URL.createObjectURL(blob)

      // Trigger browser download
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `cotizacion-${quote.id.slice(0, 8)}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      // Revoke the object URL after a short delay to allow the download to start
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      trackPdfGenerated({ item_count: quote.items.length })
    } catch (err) {
      console.error('[QuotePdfButton] PDF generation failed:', err)
      setError('No pudimos generar el PDF. Intentá de nuevo.')
      trackPdfError()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={isGenerating || !hasItems}
        onClick={handleDownload}
        title={
          !hasItems
            ? 'Esta cotización no tiene piezas'
            : isGenerating
              ? 'Generando PDF…'
              : 'Descargar PDF'
        }
      >
        <DownloadIcon />
        {isGenerating ? 'Generando…' : 'Descargar PDF'}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
