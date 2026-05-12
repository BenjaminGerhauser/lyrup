/**
 * PrinterList component tests
 *
 * Strategy: mock Dialog, Select, and Button components with simple HTML
 * equivalents so @base-ui/react portal logic doesn't interfere with jsdom.
 * Mock server actions (addPrinter, editPrinter, deletePrinter) to avoid DB calls.
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
    variant,
    size,
    'aria-label': ariaLabel,
    ...rest
  }: React.ComponentProps<'button'> & { variant?: string; size?: string }) =>
    React.createElement('button', { type: type ?? 'button', onClick, disabled, 'aria-label': ariaLabel, ...rest }, children),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardAction: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/app/actions/printers', () => ({
  addPrinter: vi.fn().mockResolvedValue({ success: true }),
  editPrinter: vi.fn().mockResolvedValue({ success: true }),
  deletePrinter: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  usePathname: () => '/impresoras',
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { PrinterList, type PrinterWithRef } from '../printer-list'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REF_MODEL = {
  id: 'ref-1',
  brand: 'Creality',
  model: 'Ender 3 V3',
  full_name: 'Creality Ender 3 V3',
  bed_x_mm: 220,
  bed_y_mm: 220,
  bed_z_mm: 250,
  power_w: 350,
  last_updated: '2025-01-01',
  gcode_identifiers: ['ender3v3'],
  popularity_rank: 1,
  estimated_life_hours: 5000,
  firmware_type: 'Marlin',
  nozzle_diameter_default: 0.4,
  reference_price_ars: null,
}

function makePrinter(overrides: Partial<PrinterWithRef> = {}): PrinterWithRef {
  return {
    id: 'printer-1',
    user_id: 'user-1',
    name: 'Mi Ender 3',
    printer_model_id: 'ref-1',
    power_w: 350,
    purchase_price_ars: 150000,
    depreciation_months: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    life_hours_estimate: 5000,
    nozzle_diameter: 0.4,
    accumulated_hours: 0,
    ref_printer_model: REF_MODEL,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrinterList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when printers array is empty', () => {
    const { container } = render(<PrinterList printers={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a card for each printer', () => {
    const printers = [
      makePrinter({ id: 'p1', name: 'Ender 3' }),
      makePrinter({ id: 'p2', name: 'Bambu A1', printer_model_id: 'ref-2', ref_printer_model: null }),
    ]

    render(<PrinterList printers={printers} />)

    const cards = screen.getAllByTestId('card')
    expect(cards).toHaveLength(2)
  })

  it('shows printer name', () => {
    render(<PrinterList printers={[makePrinter({ name: 'Mi Ender 3' })]} />)
    expect(screen.getByText('Mi Ender 3')).toBeInTheDocument()
  })

  it('shows "catálogo" badge when ref_model_id is set', () => {
    render(<PrinterList printers={[makePrinter({ printer_model_id: 'ref-1' })]} />)
    expect(screen.getByText('catálogo')).toBeInTheDocument()
  })

  it('shows "manual" badge when printer_model_id is null', () => {
    render(<PrinterList printers={[makePrinter({ printer_model_id: null, ref_printer_model: null })]} />)
    expect(screen.getByText('manual')).toBeInTheDocument()
  })

  it('shows power consumption when available', () => {
    render(<PrinterList printers={[makePrinter({ power_w: 350 })]} />)
    expect(screen.getByText('350W')).toBeInTheDocument()
  })

  it('falls back to ref model name when printer name is empty', () => {
    render(
      <PrinterList
        printers={[
          makePrinter({
            name: '',
            ref_printer_model: { ...REF_MODEL, full_name: 'Creality Ender 3 V3' },
          }),
        ]}
      />
    )
    // full_name may appear in both the card title and the CardDescription
    const matches = screen.getAllByText(/Creality Ender 3 V3/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the printer list container with data-testid', () => {
    render(<PrinterList printers={[makePrinter()]} />)
    expect(screen.getByTestId('printer-list')).toBeInTheDocument()
  })

  it('renders Edit and Delete action buttons for each printer', () => {
    render(<PrinterList printers={[makePrinter({ name: 'Mi Ender' })]} />)
    // Edit button has aria-label containing "Editar"
    expect(screen.getByRole('button', { name: /editar mi ender/i })).toBeInTheDocument()
    // Delete button has aria-label containing "Eliminar"
    expect(screen.getByRole('button', { name: /eliminar mi ender/i })).toBeInTheDocument()
  })
})
