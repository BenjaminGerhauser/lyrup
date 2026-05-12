/**
 * Step3Material component tests
 *
 * Strategy: same as step-2 — mock the Select UI and Supabase browser client.
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

import Step3Material from '../step-3-material'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_FILAMENTS = [
  {
    id: 'fil-1',
    brand: 'eSUN',
    material_type: 'PLA',
    color: 'Natural',
    price_per_kg_ars: 15000,
    density_g_cm3: 1.24,
    last_updated: '2025-01-01',
  },
  {
    id: 'fil-2',
    brand: 'eSUN',
    material_type: 'PETG',
    color: null,
    price_per_kg_ars: 18000,
    density_g_cm3: 1.27,
    last_updated: '2025-01-01',
  },
  {
    id: 'fil-3',
    brand: 'Bambu Lab',
    material_type: 'PLA',
    color: 'Black',
    price_per_kg_ars: 22000,
    density_g_cm3: 1.24,
    last_updated: '2025-01-01',
  },
]

function setupMockChain(data: typeof SAMPLE_FILAMENTS | null) {
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

describe('Step3Material', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading and submit button', async () => {
    setupMockChain(SAMPLE_FILAMENTS)
    render(<Step3Material onNext={vi.fn()} />)

    expect(screen.getByRole('heading', { name: /filamento/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
  })

  it('submit without selection → shows inline error, onNext NOT called', async () => {
    setupMockChain(SAMPLE_FILAMENTS)
    const onNext = vi.fn()

    render(<Step3Material onNext={onNext} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('selects a filament with color and submits → calls onNext with composed name', async () => {
    setupMockChain(SAMPLE_FILAMENTS)
    const onNext = vi.fn()

    render(<Step3Material onNext={onNext} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.change(screen.getByTestId('native-select'), { target: { value: 'fil-1' } })
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(onNext).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledWith({
      filament_id: 'fil-1',
      filament_name: 'eSUN PLA – Natural',
    })
  })

  it('selects a filament without color → name excludes dash separator', async () => {
    setupMockChain(SAMPLE_FILAMENTS)
    const onNext = vi.fn()

    render(<Step3Material onNext={onNext} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.change(screen.getByTestId('native-select'), { target: { value: 'fil-2' } })
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(onNext).toHaveBeenCalledWith({
      filament_id: 'fil-2',
      filament_name: 'eSUN PETG',
    })
  })

  it('initialValue pre-selects the correct filament', async () => {
    setupMockChain(SAMPLE_FILAMENTS)

    render(<Step3Material initialValue="fil-3" onNext={vi.fn()} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    const root = screen.getByTestId('select-root')
    expect(root).toHaveAttribute('data-value', 'fil-3')
  })

  it('null data from Supabase → no crash, submit shows error', async () => {
    setupMockChain(null)
    const onNext = vi.fn()

    render(<Step3Material onNext={onNext} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })
})
