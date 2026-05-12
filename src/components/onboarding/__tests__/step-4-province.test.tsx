/**
 * Step4Province component tests
 *
 * Strategy: mock Select UI + Supabase browser client (same pattern as Steps 2/3).
 * Additional concerns: auto-fill rate_kwh on province selection,
 * actionError prop display, isPending disables submit.
 *
 * Known limitation: the mock SelectValue renders null (ignoring the children
 * render-function used in production to display the label). Label display is
 * not covered by these tests — it is a runtime concern of @base-ui/react.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock @/components/ui/select → plain HTML select for testability
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/select', () => {
  const SelectItem = ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) => <option value={value}>{children}</option>

  const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const SelectLabel = () => null as unknown as React.ReactElement
  const SelectTrigger = ({ children }: { children: React.ReactNode; [k: string]: unknown }) => null as unknown as React.ReactElement
  const SelectValue = () => null as unknown as React.ReactElement
  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (val: string) => void
    children: React.ReactNode
  }) {
    return (
      <div data-testid="select-root" data-value={value}>
        <select
          data-testid="native-select"
          value={value ?? ''}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          <option value="">—</option>
          {children}
        </select>
      </div>
    )
  }

  return { Select, SelectTrigger, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectValue }
})

// ---------------------------------------------------------------------------
// Mock @/lib/supabase/client
// ---------------------------------------------------------------------------

const mockOrder = vi.fn()
const mockSelectQ = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// ---------------------------------------------------------------------------
// Mock @/components/ui/button
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    type,
    disabled,
  }: {
    children: React.ReactNode
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }) =>
    React.createElement('button', { type: type ?? 'button', disabled }, children),
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import Step4Province from '../step-4-province'
import type { OnboardingDraft } from '@/types/domain'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_RATES = [
  { id: 'rate-1', province: 'Buenos Aires', tier: 'R1', rate_kwh_ars: 75.5, last_updated: '2025-01-01' },
  { id: 'rate-2', province: 'Córdoba', tier: 'R1', rate_kwh_ars: 88.4, last_updated: '2025-01-01' },
  { id: 'rate-3', province: 'Santa Fe', tier: 'R1', rate_kwh_ars: 82.0, last_updated: '2025-01-01' },
]

const EMPTY_DRAFT: OnboardingDraft = {
  business_name: 'Mi Negocio',
  phone: '',
  printer_model_id: 'uuid-1',
  printer_name: 'Bambu Lab A1 Mini',
  filament_id: 'fil-1',
  filament_name: 'eSUN PLA',
  province: '',
  electricity_rate_kwh: 0,
}

function setupMockChain(data: typeof SAMPLE_RATES | null) {
  const queryObj: Record<string, unknown> = {}
  queryObj.then = vi.fn().mockImplementation((cb: (result: { data: typeof data }) => void) => {
    cb({ data })
  })
  queryObj.order = vi.fn().mockReturnValue(queryObj)

  mockSelectQ.mockReturnValue(queryObj)
  mockFrom.mockReturnValue({ select: mockSelectQ })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Step4Province', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading and "¡Listo!" submit button', async () => {
    setupMockChain(SAMPLE_RATES)
    render(<Step4Province draft={EMPTY_DRAFT} onSubmit={vi.fn()} isPending={false} />)

    expect(screen.getByText(/en qué provincia/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /listo/i })).toBeInTheDocument()
  })

  it('submit without selection → shows inline error, onSubmit NOT called', async () => {
    setupMockChain(SAMPLE_RATES)
    const onSubmit = vi.fn()

    render(<Step4Province draft={EMPTY_DRAFT} onSubmit={onSubmit} isPending={false} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /listo/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('selects a province and submits → calls onSubmit with province + rate', async () => {
    setupMockChain(SAMPLE_RATES)
    const onSubmit = vi.fn()

    render(<Step4Province draft={EMPTY_DRAFT} onSubmit={onSubmit} isPending={false} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.change(screen.getByTestId('native-select'), { target: { value: 'Córdoba' } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /listo/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /listo/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledWith({
      province: 'Córdoba',
      electricity_rate_kwh: 88.4,
    })
  })

  it('actionError prop is displayed as alert', async () => {
    setupMockChain(SAMPLE_RATES)

    render(
      <Step4Province
        draft={EMPTY_DRAFT}
        onSubmit={vi.fn()}
        isPending={false}
        error="Error al guardar"
      />
    )

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Error al guardar')
  })

  it('isPending=true → button shows "Guardando..." and is disabled', async () => {
    setupMockChain(SAMPLE_RATES)

    render(<Step4Province draft={EMPTY_DRAFT} onSubmit={vi.fn()} isPending={true} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /guardando/i })
    expect(button).toBeDisabled()
  })

  it('draft.province pre-selects the province', async () => {
    setupMockChain(SAMPLE_RATES)
    const draftWithProvince = { ...EMPTY_DRAFT, province: 'Santa Fe' }

    render(<Step4Province draft={draftWithProvince} onSubmit={vi.fn()} isPending={false} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    const root = screen.getByTestId('select-root')
    expect(root).toHaveAttribute('data-value', 'Santa Fe')
  })
})
