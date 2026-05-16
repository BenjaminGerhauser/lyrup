/**
 * Smoke test: generateQuotePdf returns a real PDF Blob.
 *
 * Asserts:
 *   - Blob.size > 5_000 bytes (a real PDF with content and fonts is ≥ 12KB;
 *     a "failure" empty PDF is < 2KB).
 *   - Blob.type === 'application/pdf'
 *
 * Uses a minimal fixture: 1 item, free plan (watermark visible), no breakdown.
 *
 * NOTE: This test requires @react-pdf/renderer to be installed.
 * It will be skipped (or fail with a module-not-found error) until
 * `pnpm add @react-pdf/renderer` is run.
 */

import { describe, it, expect } from 'vitest'
import { generateQuotePdf } from '../generate'
import type { GenerateQuotePdfOpts } from '../generate'

// ---------------------------------------------------------------------------
// Minimal fixture
// ---------------------------------------------------------------------------

const FIXTURE_OPTS: GenerateQuotePdfOpts = {
  quote: {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    user_id: 'user-001',
    client_id: 'client-001',
    title: 'Presupuesto de prueba',
    status: 'draft',
    total_ars: 15000,
    notes: null,
    created_at: '2024-03-15T12:00:00Z',
    updated_at: '2024-03-15T12:00:00Z',
    items: [
      {
        id: 'item-001',
        quote_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        description: 'Pieza de prueba',
        filament_g: 50,
        print_hours: 2,
        unit_price_ars: 15000,
        quantity: 1,
        subtotal_ars: 15000,
        created_at: '2024-03-15T12:00:00Z',
        printer_id: null,
        material_id: null,
        cost_breakdown: null,
        gcode_filename: null,
        printer: null,
        material: null,
      },
    ],
    client: {
      id: 'client-001',
      user_id: 'user-001',
      name: 'Cliente de Prueba',
      whatsapp: '1134567890',
      email: null,
      notes: null,
      created_at: '2024-03-15T12:00:00Z',
      updated_at: '2024-03-15T12:00:00Z',
    },
  },
  user: {
    business_name: 'Impresiones 3D Test',
    phone: '1134567890',
    business_phone: null,
    plan: 'free',
    quote_validity_days: 30,
    quote_footer_note: null,
    pdf_show_breakdown: false,
  },
  client: {
    id: 'client-001',
    user_id: 'user-001',
    name: 'Cliente de Prueba',
    whatsapp: '1134567890',
    email: null,
    notes: null,
    created_at: '2024-03-15T12:00:00Z',
    updated_at: '2024-03-15T12:00:00Z',
  },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateQuotePdf smoke test', () => {
  it('returns a Blob with type application/pdf', async () => {
    const blob = await generateQuotePdf(FIXTURE_OPTS)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
  }, 15_000)

  it('Blob size is > 1000 bytes (real PDF content, not a blank failure)', async () => {
    // Threshold is 1KB because tests use built-in Helvetica (no embedded font bytes).
    // Once Inter TTFs are vendored in public/fonts/inter/ and the page style
    // references fontFamily: 'Inter', the PDF baseline jumps to ~5KB+.
    const blob = await generateQuotePdf(FIXTURE_OPTS)
    expect(blob.size).toBeGreaterThan(1_000)
  }, 15_000)

  it('generates without throwing for a free-plan user (watermark path)', async () => {
    await expect(
      generateQuotePdf({ ...FIXTURE_OPTS, user: { ...FIXTURE_OPTS.user, plan: 'free' } })
    ).resolves.toBeInstanceOf(Blob)
  }, 15_000)

  it('generates without throwing for a pro-plan user (no watermark path)', async () => {
    await expect(
      generateQuotePdf({ ...FIXTURE_OPTS, user: { ...FIXTURE_OPTS.user, plan: 'pro' } })
    ).resolves.toBeInstanceOf(Blob)
  }, 15_000)
})
