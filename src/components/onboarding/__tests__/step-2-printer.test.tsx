/**
 * Step2Printer component tests
 *
 * Strategy: mock @/lib/supabase/client so the browser Supabase client
 * never fires real network requests. Control the resolved data inline.
 * Mock @/components/ui/select with simple native <select> so @base-ui/react
 * portal/floating logic doesn't interfere with jsdom.
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

/**
 * Minimal Select mock — renders a native <select> that contains all options
 * passed via SelectItem children so that React controlled state works correctly
 * (jsdom only updates controlled value when the selected option exists).
 *
 * Layout:
 *   <Select value onValueChange>
 *     <SelectTrigger><SelectValue /></SelectTrigger>
 *     <SelectContent>
 *       <SelectGroup>
 *         <SelectLabel />
 *         <SelectItem value="x">label</SelectItem>
 *       </SelectGroup>
 *     </SelectContent>
 *   </Select>
 *
 * We flatten the entire subtree into a single <select> with <option> children.
 */
vi.mock('@/components/ui/select', () => {
  // SelectItem → <option>
  const SelectItem = ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) => <option value={value}>{children}</option>

  // Pass-through containers
  const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const SelectLabel = ({ children }: { children: React.ReactNode }) => null as unknown as React.ReactElement
  const SelectTrigger = ({ children }: { children: React.ReactNode; id?: string; [k: string]: unknown }) => null as unknown as React.ReactElement
  const SelectValue = () => null as unknown as React.ReactElement

  // SelectContent wraps the options subtree but renders nothing visible
  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

  // Select = root; renders a native <select> that nests all children (which are <option> elements after SelectItem flattening)
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
const mockSelect = vi.fn()
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
    className,
  }: {
    children: React.ReactNode
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    className?: string
  }) =>
    React.createElement('button', { type: type ?? 'button', disabled, className }, children),
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import Step2Printer from '../step-2-printer'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_MODELS = [
  { id: 'uuid-1', brand: 'Bambu Lab', model: 'A1 Mini', bed_x_mm: 180, bed_y_mm: 180, bed_z_mm: 180, power_w: 350, last_updated: '2025-01-01' },
  { id: 'uuid-2', brand: 'Bambu Lab', model: 'X1C', bed_x_mm: 256, bed_y_mm: 256, bed_z_mm: 256, power_w: 1000, last_updated: '2025-01-01' },
  { id: 'uuid-3', brand: 'Creality', model: 'Ender-3 V3', bed_x_mm: 220, bed_y_mm: 220, bed_z_mm: 250, power_w: 350, last_updated: '2025-01-01' },
]

function setupMockChain(data: typeof SAMPLE_MODELS | null) {
  // The component does: .select('*').order(...).order(...).then(cb)
  // We need to make every call in the chain chainable and the last .then() run cb
  const queryObj: Record<string, unknown> = {}
  const thenFn = vi.fn().mockImplementation((cb: (result: { data: typeof data }) => void) => {
    cb({ data })
  })
  queryObj.then = thenFn
  queryObj.order = vi.fn().mockReturnValue(queryObj)

  mockSelect.mockReturnValue(queryObj)
  mockFrom.mockReturnValue({ select: mockSelect })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Step2Printer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading and submit button', async () => {
    setupMockChain(SAMPLE_MODELS)
    render(<Step2Printer onNext={vi.fn()} />)

    expect(screen.getByText(/qué impresora/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument()
  })

  it('shows loading skeleton while data loads, then shows select', async () => {
    // Control when the promise resolves
    let resolve!: (val: { data: typeof SAMPLE_MODELS }) => void
    const queryObj: Record<string, unknown> = {}
    queryObj.then = vi.fn().mockImplementation((cb: (r: { data: typeof SAMPLE_MODELS }) => void) => {
      resolve = cb
    })
    queryObj.order = vi.fn().mockReturnValue(queryObj)
    mockSelect.mockReturnValue(queryObj)
    mockFrom.mockReturnValue({ select: mockSelect })

    render(<Step2Printer onNext={vi.fn()} />)

    // Loading skeleton present
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()

    // Resolve the data
    resolve({ data: SAMPLE_MODELS })

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })
  })

  it('submit without selection → shows inline error, onNext NOT called', async () => {
    setupMockChain(SAMPLE_MODELS)
    const onNext = vi.fn()

    render(<Step2Printer onNext={onNext} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('selects a printer and submits → calls onNext with correct values', async () => {
    setupMockChain(SAMPLE_MODELS)
    const onNext = vi.fn()

    render(<Step2Printer onNext={onNext} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    // Simulate selection via native select
    const nativeSelect = screen.getByTestId('native-select')
    fireEvent.change(nativeSelect, { target: { value: 'uuid-1' } })

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(onNext).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledWith({
      printer_model_id: 'uuid-1',
      printer_name: 'Bambu Lab A1 Mini',
    })
  })

  it('initialValue pre-selects the correct model', async () => {
    setupMockChain(SAMPLE_MODELS)

    render(<Step2Printer initialValue="uuid-3" onNext={vi.fn()} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    const root = screen.getByTestId('select-root')
    expect(root).toHaveAttribute('data-value', 'uuid-3')
  })

  it('null data from Supabase → no crash, submit shows error', async () => {
    setupMockChain(null)
    const onNext = vi.fn()

    render(<Step2Printer onNext={onNext} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })
})
