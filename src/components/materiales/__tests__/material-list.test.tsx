/**
 * MaterialList component tests
 *
 * Strategy: mock Dialog, Select, Button, Card, ColorPicker with simple HTML
 * equivalents so @base-ui/react portal logic doesn't interfere with jsdom.
 * Mock server actions to avoid DB calls.
 * Mock @/lib/format to avoid Intl.NumberFormat locale issues.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog">{children}</div>,
  DialogTrigger: ({ children, render: renderProp }: { children?: React.ReactNode; render?: React.ReactElement }) =>
    renderProp ? React.cloneElement(renderProp as React.ReactElement, {}, children) : <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => null as unknown as React.ReactElement,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogOverlay: () => null,
}))

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

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <h3 className={className}>{children}</h3>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardAction: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/materiales/color-picker', () => ({
  ColorPicker: ({ value }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="color-picker" data-value={value} />
  ),
}))

vi.mock('@/app/actions/materials', () => ({
  addMaterial: vi.fn().mockResolvedValue({ success: true }),
  editMaterial: vi.fn().mockResolvedValue({ success: true }),
  deleteMaterial: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/format', () => ({
  formatArs: (value: number) => `$${value.toLocaleString('es-AR')}`,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  usePathname: () => '/materiales',
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { MaterialList, type MaterialWithRef } from '../material-list'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REF_FILAMENT = {
  id: 'ref-1',
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
}

function makeMaterial(overrides: Partial<MaterialWithRef> = {}): MaterialWithRef {
  return {
    id: 'material-1',
    user_id: 'user-1',
    name: 'Mi PLA rojo',
    filament_id: 'ref-1',
    material_type: 'PLA',
    color: '#FF0000',
    price_per_kg_ars: 8500,
    density_g_cm3: 1.24,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    filament_diameter: 1.75,
    nozzle_temp: 210,
    ref_filament_catalog: REF_FILAMENT,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MaterialList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when materials array is empty', () => {
    const { container } = render(<MaterialList materials={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a card for each material', () => {
    const materials = [
      makeMaterial({ id: 'm1', name: 'PLA Rojo' }),
      makeMaterial({ id: 'm2', name: 'PETG Azul', filament_id: null, ref_filament_catalog: null }),
    ]

    render(<MaterialList materials={materials} />)

    const cards = screen.getAllByTestId('card')
    expect(cards).toHaveLength(2)
  })

  it('shows material name', () => {
    render(<MaterialList materials={[makeMaterial({ name: 'Mi PLA rojo' })]} />)
    expect(screen.getByText('Mi PLA rojo')).toBeInTheDocument()
  })

  it('renders color swatch when color_hex is set', () => {
    render(<MaterialList materials={[makeMaterial({ color: '#FF0000' })]} />)
    const swatch = screen.getByTestId('color-swatch')
    expect(swatch).toBeInTheDocument()
    expect(swatch).toHaveStyle({ background: '#FF0000' })
  })

  it('does NOT render color swatch when color is null', () => {
    render(<MaterialList materials={[makeMaterial({ color: null })]} />)
    expect(screen.queryByTestId('color-swatch')).not.toBeInTheDocument()
  })

  it('shows "catálogo" badge when filament_id is set', () => {
    render(<MaterialList materials={[makeMaterial({ filament_id: 'ref-1' })]} />)
    expect(screen.getByText('catálogo')).toBeInTheDocument()
  })

  it('shows "manual" badge when filament_id is null', () => {
    render(<MaterialList materials={[makeMaterial({ filament_id: null, ref_filament_catalog: null })]} />)
    expect(screen.getByText('manual')).toBeInTheDocument()
  })

  it('shows price per kg formatted with ARS', () => {
    render(<MaterialList materials={[makeMaterial({ price_per_kg_ars: 8500 })]} />)
    // Our mock formatArs returns $8.500 using es-AR locale
    expect(screen.getByText(/8.500|8500/)).toBeInTheDocument()
  })

  it('renders the material list container with data-testid', () => {
    render(<MaterialList materials={[makeMaterial()]} />)
    expect(screen.getByTestId('material-list')).toBeInTheDocument()
  })

  it('renders Edit and Delete action buttons for each material', () => {
    render(<MaterialList materials={[makeMaterial({ name: 'PLA Rojo' })]} />)
    expect(screen.getByRole('button', { name: /editar pla rojo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eliminar pla rojo/i })).toBeInTheDocument()
  })

  it('falls back to ref brand+type when material name is empty', () => {
    render(
      <MaterialList
        materials={[
          makeMaterial({
            name: '',
            ref_filament_catalog: { ...REF_FILAMENT, brand: 'Grilon3', material_type: 'PETG' },
          }),
        ]}
      />
    )
    expect(screen.getByText(/Grilon3 PETG/)).toBeInTheDocument()
  })
})
