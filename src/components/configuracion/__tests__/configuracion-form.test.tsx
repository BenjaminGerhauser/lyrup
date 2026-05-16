/**
 * ConfiguracionForm component tests
 *
 * Strategy: mock all @base-ui/react derived components (via ui/select wrapper),
 * Button, and Input with simple HTML equivalents. Test behaviour via rendered DOM.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Shared context for Select mock — defined before vi.mock factories
// ---------------------------------------------------------------------------

// We define this as a module-level variable so the mock factory closure can
// reference it. vi.mock is hoisted but the factories still close over module scope.
let _selectOnValueChange: ((val: string | null) => void) | undefined

// ---------------------------------------------------------------------------
// Mocks — must appear before imports that use them
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode
    value?: string
    onValueChange?: (val: string | null) => void
  }) => {
    _selectOnValueChange = onValueChange
    return (
      <div data-testid="select-root" data-value={value}>
        {children}
      </div>
    )
  },
  SelectTrigger: ({ children, id, ...rest }: { children?: React.ReactNode; id?: string; [k: string]: unknown }) => (
    <button type="button" id={id} data-testid={rest['data-testid'] as string ?? 'select-trigger'}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { children?: unknown; placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button
      type="button"
      data-testid={`select-item-${value}`}
      onClick={() => _selectOnValueChange?.(value)}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, type, onClick, disabled, ...rest }: React.ComponentProps<'button'>) =>
    React.createElement('button', { type: type ?? 'button', onClick, disabled, ...rest }, children),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ id, name, type, defaultValue, value, onChange, placeholder, ...rest }: React.ComponentProps<'input'>) =>
    React.createElement('input', { id, name, type: type ?? 'text', defaultValue, value, onChange, placeholder, ...rest }),
}))

// Mock the server action
const mockUpdateConfig = vi.fn()
vi.mock('@/app/actions/configuracion', () => ({
  updateConfig: (...args: unknown[]) => mockUpdateConfig(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/configuracion',
}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { ConfiguracionForm } from '../configuracion-form'
import type { RefElectricityRate } from '@/types/domain'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ELECTRICITY_RATES: RefElectricityRate[] = [
  { id: 'rate-1', province: 'Buenos Aires', tier: 'EDENOR', rate_kwh_ars: 105.5, last_updated: '2025-01-01' },
  { id: 'rate-2', province: 'Córdoba', tier: 'EPEC', rate_kwh_ars: 88.4, last_updated: '2025-01-01' },
  { id: 'rate-3', province: 'Santa Fe', tier: 'EPE', rate_kwh_ars: 92.1, last_updated: '2025-01-01' },
]

const INITIAL_VALUES = {
  business_name: 'Mi Negocio 3D',
  phone: '+54 9 351 000 0000',
  business_phone: '',
  logo_url: '',
  labor_rate_hour: 800,
  default_margin_percent: 100,
  default_labor_factor: 0.20,
  province: 'Córdoba',
  electricity_rate_kwh: 88.4,
  // Sprint 3 — PDF config
  quote_validity_days: 30,
  quote_footer_note: '',
  pdf_show_breakdown: true,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConfiguracionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _selectOnValueChange = undefined
    mockUpdateConfig.mockResolvedValue({ success: true })
  })

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------

  it('renders business_name field with initial value', () => {
    render(
      <ConfiguracionForm initialValues={INITIAL_VALUES} electricityRates={ELECTRICITY_RATES} />
    )
    const input = screen.getByLabelText(/nombre del negocio/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Mi Negocio 3D')
  })

  it('renders cost default fields with correct initial values', () => {
    render(
      <ConfiguracionForm initialValues={INITIAL_VALUES} electricityRates={ELECTRICITY_RATES} />
    )
    expect(screen.getByLabelText(/tarifa de mano de obra/i)).toHaveValue(800)
    expect(screen.getByLabelText(/margen de ganancia/i)).toHaveValue(100)
    expect(screen.getByLabelText(/factor de mano de obra/i)).toHaveValue(0.20)
  })

  it('renders province select items for each rate', () => {
    render(
      <ConfiguracionForm initialValues={INITIAL_VALUES} electricityRates={ELECTRICITY_RATES} />
    )
    expect(screen.getByTestId('select-item-Córdoba')).toBeInTheDocument()
    expect(screen.getByTestId('select-item-Buenos Aires')).toBeInTheDocument()
    expect(screen.getByTestId('select-item-Santa Fe')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(
      <ConfiguracionForm initialValues={INITIAL_VALUES} electricityRates={ELECTRICITY_RATES} />
    )
    expect(screen.getByRole('button', { name: /guardar configuración/i })).toBeInTheDocument()
  })

  // ------------------------------------------------------------------
  // Province → rate auto-fill (Task 5.5 core behaviour)
  // ------------------------------------------------------------------

  it('province auto-fill — clicking a province item updates the rate input', async () => {
    render(
      <ConfiguracionForm
        initialValues={{ ...INITIAL_VALUES, province: '', electricity_rate_kwh: 0 }}
        electricityRates={ELECTRICITY_RATES}
      />
    )

    // Click the Córdoba item — triggers _selectOnValueChange('Córdoba')
    await act(async () => {
      fireEvent.click(screen.getByTestId('select-item-Córdoba'))
    })

    const rateInput = screen.getByLabelText(/tarifa eléctrica.*kWh/i)
    expect(rateInput).toHaveValue(88.4)
  })

  it('shows "tarifa actualizada" notice after province change', async () => {
    render(
      <ConfiguracionForm
        initialValues={{ ...INITIAL_VALUES, province: '', electricity_rate_kwh: 0 }}
        electricityRates={ELECTRICITY_RATES}
      />
    )

    await act(async () => {
      fireEvent.click(screen.getByTestId('select-item-Córdoba'))
    })

    expect(screen.getByText(/tarifa actualizada al cambiar de provincia/i)).toBeInTheDocument()
  })

  it('rate override — user can change rate after province auto-fill', async () => {
    render(
      <ConfiguracionForm initialValues={INITIAL_VALUES} electricityRates={ELECTRICITY_RATES} />
    )

    // Trigger Buenos Aires auto-fill (rate = 105.5)
    await act(async () => {
      fireEvent.click(screen.getByTestId('select-item-Buenos Aires'))
    })

    const rateInput = screen.getByLabelText(/tarifa eléctrica.*kWh/i)
    expect(rateInput).toHaveValue(105.5)

    // Now override manually
    await act(async () => {
      fireEvent.change(rateInput, { target: { value: '150' } })
    })

    expect(rateInput).toHaveValue(150)
    // "tarifa actualizada" notice should disappear after manual edit
    expect(screen.queryByText(/tarifa actualizada al cambiar de provincia/i)).not.toBeInTheDocument()
  })

  // ------------------------------------------------------------------
  // Form submission (Task 5.2 integration via useActionState)
  // ------------------------------------------------------------------

  it('shows error message from action state on failed submit', async () => {
    mockUpdateConfig.mockResolvedValue({
      success: false,
      error: 'El nombre del negocio es obligatorio',
    })

    render(
      <ConfiguracionForm
        initialValues={{ ...INITIAL_VALUES, business_name: '' }}
        electricityRates={ELECTRICITY_RATES}
      />
    )

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /guardar/i }).closest('form')!)
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /el nombre del negocio es obligatorio/i
    )
  })

  it('shows success message on successful save', async () => {
    mockUpdateConfig.mockResolvedValue({ success: true })

    render(
      <ConfiguracionForm initialValues={INITIAL_VALUES} electricityRates={ELECTRICITY_RATES} />
    )

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /guardar/i }).closest('form')!)
    })

    expect(await screen.findByTestId('form-success')).toBeInTheDocument()
  })
})
