/**
 * WhatsApp share URL builder — Sprint 3.
 *
 * All wa.me URLs use the format:
 *   https://wa.me/{normalized_phone}?text={url_encoded_message}
 *
 * The helper re-normalizes the phone defensively so it's safe to pass raw
 * client.whatsapp strings directly.
 */

import { normalizeArWhatsApp } from './phone-ar'
import { formatARS } from './currency-ars'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WhatsAppShareOpts {
  /** Raw or pre-normalized phone. The helper re-normalizes defensively. */
  phone: string | null | undefined
  message: string
}

export interface QuoteWhatsAppTemplateOpts {
  clientName: string
  businessName: string
  itemCount: number
  totalArs: number
  validityDays: number
}

// ---------------------------------------------------------------------------
// buildWhatsAppUrl
// ---------------------------------------------------------------------------

/**
 * Build a wa.me share URL.
 * Returns null when the phone cannot be normalized to a valid AR number.
 */
export function buildWhatsAppUrl(opts: WhatsAppShareOpts): string | null {
  const normalized = normalizeArWhatsApp(opts.phone)
  if (normalized === null) return null

  const encoded = encodeURIComponent(opts.message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

// ---------------------------------------------------------------------------
// buildQuoteWhatsAppMessage
// ---------------------------------------------------------------------------

/**
 * Builds the locked WhatsApp message template for a quote share.
 * Newlines are literal \n so they appear as line breaks in the WhatsApp chat.
 *
 * Template (FR-17):
 *   Hola {clientName}, te paso el presupuesto desde {businessName}.
 *
 *   Resumen: {n} item(s), total ARS {formatARS(totalArs)}.
 *   Válido por {validityDays} días.
 *
 *   Detalle adjunto en PDF.
 *
 *   Cualquier duda avisame, estamos en contacto.
 */
export function buildQuoteWhatsAppMessage(opts: QuoteWhatsAppTemplateOpts): string {
  const { clientName, businessName, itemCount, totalArs, validityDays } = opts
  const itemLabel = itemCount === 1 ? 'item' : 'items'
  const totalFormatted = formatARS(totalArs)

  return [
    `Hola ${clientName}, te paso el presupuesto desde ${businessName}.`,
    '',
    `Resumen: ${itemCount} ${itemLabel}, total ARS ${totalFormatted}.`,
    `Válido por ${validityDays} días.`,
    '',
    'Detalle adjunto en PDF.',
    '',
    'Cualquier duda avisame, estamos en contacto.',
  ].join('\n')
}
