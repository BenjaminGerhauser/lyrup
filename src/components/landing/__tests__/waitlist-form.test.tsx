/**
 * WaitlistForm tests
 *
 * React 19's useActionState + form actions don't fire via requestSubmit() in jsdom
 * because the React fiber never gets to call dispatch — only the DOM form submission
 * path is triggered, which React intercepts with a JS error guard.
 *
 * Strategy:
 * - Tests (c), (d): mock useActionState to return the desired state directly.
 * - Tests (a), (e), (f): same mocking approach.
 * - Test (b): mock useActionState to return isPending=true.
 * - For the validation path (a), we also test the formAction logic in isolation
 *   since the local setLocalError path won't render via mocked state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// ---- Module mocks -------------------------------------------------------

vi.mock('@/app/actions/waitlist', () => ({
  joinWaitlist: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  Loader2: () => React.createElement('span', { 'data-testid': 'loader' }),
}))

// We will override useActionState per test via this mock factory
let mockState: { status: string } = { status: 'idle' }
let mockIsPending = false
// Capture the last action so we can call it manually
let capturedAction: ((prev: unknown, fd: FormData) => Promise<unknown>) | null = null

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useActionState: (action: (prev: unknown, fd: FormData) => Promise<unknown>) => {
      capturedAction = action
      const dispatch = vi.fn()
      return [mockState, dispatch, mockIsPending] as const
    },
  }
})

// ---- Import AFTER mocks -------------------------------------------------

import { WaitlistForm } from '../waitlist-form'
import { joinWaitlist } from '@/app/actions/waitlist'

const mockJoinWaitlist = vi.mocked(joinWaitlist)

// ---- Helpers ------------------------------------------------------------

function makeFormData(email: string) {
  const fd = new FormData()
  fd.set('email', email)
  return fd
}

// ---- Tests --------------------------------------------------------------

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockState = { status: 'idle' }
    mockIsPending = false
    capturedAction = null
  })

  it('(a) invalid email: formAction returns invalid_email and does not call server action', async () => {
    render(React.createElement(WaitlistForm))

    // Verify the component rendered (action was captured)
    expect(capturedAction).not.toBeNull()

    // Call the inner formAction directly with invalid email
    const result = await capturedAction!({ status: 'idle' }, makeFormData('not-an-email'))

    expect(result).toEqual({ status: 'invalid_email' })
    expect(mockJoinWaitlist).not.toHaveBeenCalled()
  })

  it('(b) isPending=true disables the submit button', () => {
    mockIsPending = true
    render(React.createElement(WaitlistForm))

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('(c) success state renders confirmation message', () => {
    mockState = { status: 'success' }
    render(React.createElement(WaitlistForm))

    expect(
      screen.getByText('¡Listo! Te avisamos cuando abramos.')
    ).toBeInTheDocument()
  })

  it('(d) duplicate state renders "Ya estás en la lista"', () => {
    mockState = { status: 'duplicate' }
    render(React.createElement(WaitlistForm))

    expect(screen.getByText(/ya estás en la lista/i)).toBeInTheDocument()
  })

  it('(e) error state: form stays visible and shows error message', () => {
    mockState = { status: 'error' }
    render(React.createElement(WaitlistForm))

    expect(screen.getByText(/algo falló/i)).toBeInTheDocument()
    // Form still present
    expect(
      screen.getByRole('textbox', { name: /tu dirección de email/i })
    ).toBeInTheDocument()
  })

  it('(f) aria-live="polite" region is present on success', () => {
    mockState = { status: 'success' }
    render(React.createElement(WaitlistForm))

    const liveRegions = document.querySelectorAll('[aria-live="polite"]')
    expect(liveRegions.length).toBeGreaterThan(0)
  })
})
