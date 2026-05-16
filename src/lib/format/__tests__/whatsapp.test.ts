import { describe, it, expect } from 'vitest'
import { buildWhatsAppUrl, buildQuoteWhatsAppMessage } from '../whatsapp'

// ---------------------------------------------------------------------------
// buildWhatsAppUrl
// ---------------------------------------------------------------------------

describe('buildWhatsAppUrl', () => {
  it('valid phone → URL starting with https://wa.me/5491134567890', () => {
    const url = buildWhatsAppUrl({
      phone: '+5491134567890',
      message: 'Hola',
    })
    expect(url).not.toBeNull()
    expect(url!.startsWith('https://wa.me/5491134567890?text=')).toBe(true)
  })

  it('URL-encodes the message (newlines become %0A)', () => {
    const url = buildWhatsAppUrl({
      phone: '5491134567890',
      message: 'Línea 1\nLínea 2',
    })
    expect(url).not.toBeNull()
    expect(url!).toContain('%0A')
  })

  it('null phone → returns null', () => {
    expect(buildWhatsAppUrl({ phone: null, message: 'test' })).toBeNull()
  })

  it('undefined phone → returns null', () => {
    expect(buildWhatsAppUrl({ phone: undefined, message: 'test' })).toBeNull()
  })

  it('invalid phone → returns null', () => {
    expect(buildWhatsAppUrl({ phone: '123', message: 'test' })).toBeNull()
  })

  it('spaces in phone are handled (normalized then used)', () => {
    // "+54 9 11 3456-7890" normalizes to "5491134567890"
    const url = buildWhatsAppUrl({
      phone: '+54 9 11 3456-7890',
      message: 'Hola',
    })
    expect(url).not.toBeNull()
    expect(url!).toContain('wa.me/5491134567890')
  })
})

// ---------------------------------------------------------------------------
// buildQuoteWhatsAppMessage
// ---------------------------------------------------------------------------

describe('buildQuoteWhatsAppMessage', () => {
  const BASE_OPTS = {
    clientName: 'Juan Pérez',
    businessName: 'Impresiones 3D Sur',
    itemCount: 2,
    totalArs: 15000,
    validityDays: 30,
  }

  it('contains the client name greeting', () => {
    const msg = buildQuoteWhatsAppMessage(BASE_OPTS)
    expect(msg).toContain('Juan Pérez')
  })

  it('contains the business name', () => {
    const msg = buildQuoteWhatsAppMessage(BASE_OPTS)
    expect(msg).toContain('Impresiones 3D Sur')
  })

  it('contains the item count', () => {
    const msg = buildQuoteWhatsAppMessage(BASE_OPTS)
    expect(msg).toContain('2 items')
  })

  it('uses "item" (singular) for itemCount = 1', () => {
    const msg = buildQuoteWhatsAppMessage({ ...BASE_OPTS, itemCount: 1 })
    expect(msg).toContain('1 item,')
  })

  it('contains the validity days', () => {
    const msg = buildQuoteWhatsAppMessage(BASE_OPTS)
    expect(msg).toContain('30 días')
  })

  it('contains the formatted total (contains "15")', () => {
    const msg = buildQuoteWhatsAppMessage(BASE_OPTS)
    expect(msg).toContain('15')
  })

  it('contains literal newlines for WhatsApp line breaks', () => {
    const msg = buildQuoteWhatsAppMessage(BASE_OPTS)
    expect(msg).toContain('\n')
  })

  it('contains the "Detalle adjunto en PDF" line', () => {
    const msg = buildQuoteWhatsAppMessage(BASE_OPTS)
    expect(msg).toContain('Detalle adjunto en PDF')
  })
})
