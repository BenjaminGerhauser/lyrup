'use client'

/**
 * quote-actions.tsx — Client bridge component for the quote detail page.
 *
 * Renders two actions:
 *   1. PDF download button — lazy-loaded via next/dynamic({ ssr: false })
 *      to ensure @react-pdf/renderer (~400 KB) never ships in non-quote-detail
 *      bundles, and never runs in SSR.
 *   2. WhatsApp share button — inline, no PDF dependency.
 *
 * BUNDLE ISOLATION:
 *   This file does NOT import @/lib/pdf at module level.
 *   Only quote-pdf-button.tsx (loaded lazily) does that.
 */

import dynamic from 'next/dynamic'
import { MessageCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { buildWhatsAppUrl, buildQuoteWhatsAppMessage } from '@/lib/format'
import type { QuoteDocumentUser } from '@/lib/pdf/document'
import type { QuoteWithItems, Client } from '@/types/domain'
import { trackWhatsappClicked } from '@/lib/analytics/umami'

// ---------------------------------------------------------------------------
// Lazy-load the PDF button — SSR disabled so react-pdf never runs on the server.
// The loading state shows a disabled placeholder while the chunk is fetched.
// ---------------------------------------------------------------------------

const QuotePdfButton = dynamic(
  () => import('./quote-pdf-button').then((m) => m.QuotePdfButton),
  {
    ssr: false,
    loading: () => (
      <Button type="button" variant="outline" disabled>
        Cargando…
      </Button>
    ),
  }
)

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuoteActionsProps {
  quote: QuoteWithItems
  user: QuoteDocumentUser
  client: Client | null
}

// ---------------------------------------------------------------------------
// QuoteActions
// ---------------------------------------------------------------------------

export function QuoteActions({ quote, user, client }: QuoteActionsProps) {
  // Build WhatsApp URL — null when phone is missing or invalid
  const whatsAppUrl = buildWhatsAppUrl({
    phone: client?.whatsapp,
    message: buildQuoteWhatsAppMessage({
      clientName: client?.name ?? 'Cliente',
      businessName: user.business_name ?? 'el negocio',
      itemCount: quote.items.length,
      totalArs: quote.total_ars ?? 0,
      validityDays: user.quote_validity_days,
    }),
  })

  const whatsAppDisabled = whatsAppUrl === null

  // Reason for WhatsApp being disabled — used as native tooltip
  const whatsAppTitle = !client
    ? 'Falta WhatsApp del cliente'
    : !client.whatsapp
      ? 'Cliente sin WhatsApp válido'
      : whatsAppDisabled
        ? 'Número de WhatsApp inválido'
        : 'Compartir por WhatsApp'

  const handleWhatsApp = () => {
    // Fire before opening the URL — fires regardless of has_phone value.
    trackWhatsappClicked({ has_phone: whatsAppUrl !== null })
    if (!whatsAppUrl) return
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Compartir cotización</p>
          <p className="text-xs text-muted-foreground">
            Descargá el PDF o compartí por WhatsApp directamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* PDF download — dynamically imported, SSR-free */}
          <QuotePdfButton quote={quote} user={user} client={client} />

          {/* WhatsApp share — inline, no PDF dependency */}
          <Button
            type="button"
            variant="outline"
            disabled={whatsAppDisabled}
            title={whatsAppTitle}
            onClick={handleWhatsApp}
          >
            <MessageCircleIcon />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
