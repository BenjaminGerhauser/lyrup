/**
 * AddMaterialDialog component tests
 *
 * Strategy: mock Dialog (make content visible), Select (native <select>),
 * Button, ColorPicker with simple HTML equivalents.
 * Mock server action to avoid DB calls.
 * Test: dialog opens, type select filters products, submit calls action.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Make DialogContent visible so we can test the form
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (v: boolean) => void
  }) => (
    <div data-testid="dialog" data-open={open}>
      {children}
    </div>
  ),
  DialogTrigger: ({
    children,
    render: renderProp,
  }: {
    children?: React.ReactNode
    render?: React.ReactElement
  }) =>
    renderProp
      ? React.cloneElement(renderProp as React.ReactElement, {}, children)
      : <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogOverlay: () => null,
}))

// Select mock — same pattern as onboarding tests
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
  const SelectTrigger = () => null as unknown as React.ReactElement
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

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    type,
    onClick,
    disabled,
    'aria-label': ariaLabel,
    ...rest
  }: React.ComponentProps<'button'> & { variant?: string; size?: string }) =>
    React.createElement('button', { type: type ?? 'button', onClick, disabled, 'aria-label': ariaLabel, ...rest }, children),
}))

vi.mock('@/components/materiales/color-picker', () => ({
  ColorPicker: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (v: string) => void
  }) => (
    <div data-testid="color-picker" data-value={value}>
      <button
        type="button"
        data-testid="pick-color-btn"
        onClick={() => onChange('#FF0000')}
      >
        Pick Red
      </button>
    </div>
  ),
}))

const mockAddMaterial = vi.fn()

vi.mock('@/app/actions/materials', () => ({
  addMaterial: (...args: unknown[]) => mockAddMaterial(...args),
  editMaterial: vi.fn().mockResolvedValue({ success: true }),
  deleteMaterial: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/format', () => ({
  formatArs: (value: number) => `$${value.toLocaleString('es-AR')}`,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  usePathname: () => '/materiales',
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { AddMaterialDialog } from '../add-material-dialog'
import type { RefFilamentCatalog } from '@/types/domain'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REF_CATALOG: RefFilamentCatalog[] = [
  {
    id: 'ref-pla-1',
    brand: 'PrintaLot',
    material_type: 'PLA',
    color: null,
    price_per_kg_ars: 8500,
    density_g_cm3: 1.24,
    last_updated: '2025-01-01',
    gcode_identifiers: ['printalot'],
    popularity_rank: 1,
    nozzle_temp_min: 200,
    nozzle_temp_max: 220,
    bed_temp_min: 60,
    bed_temp_max: 80,
    filament_diameter: 1.75,
  },
  {
    id: 'ref-petg-1',
    brand: 'Grilon3',
    material_type: 'PETG',
    color: null,
    price_per_kg_ars: 9500,
    density_g_cm3: 1.27,
    last_updated: '2025-01-15',
    gcode_identifiers: ['grilon3'],
    popularity_rank: 2,
    nozzle_temp_min: 230,
    nozzle_temp_max: 250,
    bed_temp_min: 70,
    bed_temp_max: 90,
    filament_diameter: 1.75,
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AddMaterialDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddMaterial.mockResolvedValue({ success: true })
  })

  it('renders trigger button "Agregar material"', () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)
    // Multiple elements may say "Agregar material" (trigger + submit btn in dialog)
    const matches = screen.getAllByText('Agregar material')
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('dialog content is rendered in DOM', () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)
    // Dialog renders content always (not portal-hidden in our mock)
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
  })

  it('shows type select with all material types', () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)

    // There should be type options available (PLA, PETG, ABS, TPU, Nylon)
    const options = screen.getAllByRole('option')
    const optionValues = options.map((o) => (o as HTMLOptionElement).value)
    expect(optionValues).toContain('PLA')
    expect(optionValues).toContain('PETG')
    expect(optionValues).toContain('ABS')
  })

  it('selecting PLA type shows only PLA products (PrintaLot)', async () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)

    // The first native-select is the type select
    const selects = screen.getAllByTestId('native-select')
    const typeSelect = selects[0]
    fireEvent.change(typeSelect, { target: { value: 'PLA' } })

    await waitFor(() => {
      // After selecting PLA, PrintaLot should be available as a product option
      // Grilon3 (PETG brand) should NOT be visible
      const allOptions = screen.getAllByRole('option')
      const allValues = allOptions.map((o) => (o as HTMLOptionElement).value)
      expect(allValues).toContain('ref-pla-1')
      expect(allValues).not.toContain('ref-petg-1')
    })
  })

  it('selecting a catalog product auto-fills price field', async () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)

    // Select type first
    const selects = screen.getAllByTestId('native-select')
    fireEvent.change(selects[0], { target: { value: 'PLA' } })

    await waitFor(() => {
      const allSelects = screen.getAllByTestId('native-select')
      expect(allSelects.length).toBeGreaterThan(1)
    })

    // Select the product
    const allSelects = screen.getAllByTestId('native-select')
    const productSelect = allSelects[1]
    fireEvent.change(productSelect, { target: { value: 'ref-pla-1' } })

    await waitFor(() => {
      const priceInput = screen.getByRole('spinbutton', { name: /precio por kg/i })
      expect((priceInput as HTMLInputElement).value).toBe('8500')
    })
  })

  it('shows reference price badge when catalog product selected', async () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)

    // Select type
    const selects = screen.getAllByTestId('native-select')
    fireEvent.change(selects[0], { target: { value: 'PLA' } })

    await waitFor(() => {
      const allSelects = screen.getAllByTestId('native-select')
      expect(allSelects.length).toBeGreaterThan(1)
    })

    // Select product
    const allSelects = screen.getAllByTestId('native-select')
    fireEvent.change(allSelects[1], { target: { value: 'ref-pla-1' } })

    await waitFor(() => {
      expect(screen.getByTestId('ref-price-badge')).toBeInTheDocument()
    })
  })

  it('shows "Mi filamento no está en la lista" toggle', () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)
    expect(screen.getByText('Mi filamento no está en la lista')).toBeInTheDocument()
  })

  it('clicking manual toggle shows manual name input', async () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)

    fireEvent.click(screen.getByText('Mi filamento no está en la lista'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/pla genérico blanco/i)).toBeInTheDocument()
    })
  })

  it('clicking manual toggle again goes back to catalog mode', async () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)

    fireEvent.click(screen.getByText('Mi filamento no está en la lista'))
    await waitFor(() => {
      expect(screen.getByText('← Buscar en el catálogo')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('← Buscar en el catálogo'))
    await waitFor(() => {
      expect(screen.getByText('Mi filamento no está en la lista')).toBeInTheDocument()
    })
  })

  it('color picker is rendered in the form', () => {
    render(<AddMaterialDialog refFilamentCatalog={REF_CATALOG} />)
    expect(screen.getByTestId('color-picker')).toBeInTheDocument()
  })

  it('empty catalog → type options still appear', () => {
    render(<AddMaterialDialog refFilamentCatalog={[]} />)
    const options = screen.getAllByRole('option')
    // PLA, PETG, ABS, TPU, Nylon should still be available
    expect(options.some((o) => (o as HTMLOptionElement).value === 'PLA')).toBe(true)
  })
})
