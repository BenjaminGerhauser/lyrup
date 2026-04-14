/**
 * Accessibility audit tests
 *
 * Tests WaitlistForm and FAQ for zero critical axe violations.
 *
 * NOTE: Full page server component testing is not possible in jsdom.
 * We test the client components (WaitlistForm idle state, Faq) in isolation.
 *
 * NOTE on Faq: @base-ui/react Accordion renders semantic HTML. We render Faq
 * directly and check for critical a11y violations. Some non-critical violations
 * (e.g. landmark/color-contrast from missing Tailwind styles in jsdom) are
 * acceptable — we only assert no CRITICAL violations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import React from 'react'

// ---- Mocks --------------------------------------------------------------

vi.mock('@/app/actions/waitlist', () => ({
  joinWaitlist: vi.fn(),
}))

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>()
  return {
    ...actual,
    Loader2: () => React.createElement('span', { 'data-testid': 'loader' }),
  }
})

// Mock useActionState for WaitlistForm
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useActionState: (action: unknown) => {
      return [{ status: 'idle' }, vi.fn(), false] as const
    },
  }
})

// ---- Imports AFTER mocks ------------------------------------------------

import { WaitlistForm } from '@/components/landing/waitlist-form'
import { Faq } from '@/components/landing/faq'

// ---- Tests --------------------------------------------------------------

describe('Accessibility audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('WaitlistForm (idle) has no critical axe violations', async () => {
    const { container } = render(React.createElement(WaitlistForm))
    const results = await axe(container)

    // Filter to critical violations only
    const critical = results.violations.filter(
      (v) => v.impact === 'critical'
    )
    expect(critical).toHaveLength(0)
  })

  it('FAQ accordion has no critical axe violations', async () => {
    const { container } = render(React.createElement(Faq))
    const results = await axe(container)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical'
    )
    expect(critical).toHaveLength(0)
  })
})
