import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Step1Business from '../step-1-business'

describe('Step1Business', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders business_name and phone fields', () => {
    render(<Step1Business onNext={vi.fn()} />)

    expect(screen.getByLabelText(/nombre del negocio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument()
  })

  it('empty business_name → shows inline error, onNext NOT called', () => {
    const onNext = vi.fn()
    render(<Step1Business onNext={onNext} />)

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('valid business_name → calls onNext with trimmed values', () => {
    const onNext = vi.fn()
    render(<Step1Business onNext={onNext} />)

    fireEvent.change(screen.getByLabelText(/nombre del negocio/i), {
      target: { value: '  Mi Negocio 3D  ' },
    })
    fireEvent.change(screen.getByLabelText(/whatsapp/i), {
      target: { value: '+54 9 351 000 0000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(onNext).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledWith({
      business_name: 'Mi Negocio 3D',
      phone: '+54 9 351 000 0000',
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('error clears when user starts typing after failed submit', () => {
    const onNext = vi.fn()
    render(<Step1Business onNext={onNext} />)

    // Trigger error first
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Start typing — error should clear
    fireEvent.change(screen.getByLabelText(/nombre del negocio/i), {
      target: { value: 'a' },
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('initialValues populate the fields', () => {
    render(
      <Step1Business
        initialValues={{ business_name: 'Inicial', phone: '123' }}
        onNext={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/nombre del negocio/i)).toHaveValue('Inicial')
    expect(screen.getByLabelText(/whatsapp/i)).toHaveValue('123')
  })
})
