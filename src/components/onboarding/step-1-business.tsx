'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Step1Values {
  business_name: string
  phone: string
}

interface Step1BusinessProps {
  initialValues?: Partial<Step1Values>
  onNext: (values: Step1Values) => void
}

export default function Step1Business({ initialValues, onNext }: Step1BusinessProps) {
  const [businessName, setBusinessName] = useState(initialValues?.business_name ?? '')
  const [phone, setPhone] = useState(initialValues?.phone ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = businessName.trim()
    if (!trimmed) {
      setError('El nombre del negocio es obligatorio.')
      return
    }
    setError(null)
    onNext({ business_name: trimmed, phone: phone.trim() })
  }

  return (
    <div className="bg-lyrup-bg-elevated rounded-xl p-6 border border-lyrup-border">
      <h1 className="text-lyrup-text-heading font-heading text-2xl font-bold mb-2">
        Contanos sobre tu negocio
      </h1>
      <p className="text-lyrup-text-secondary text-sm mb-6">
        Esta información aparecerá en tus cotizaciones.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label
            htmlFor="business_name"
            className="block text-lyrup-text text-sm font-medium mb-1.5"
          >
            Nombre del negocio <span className="text-lyrup-error">*</span>
          </label>
          <Input
            id="business_name"
            type="text"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Ej: Impresiones 3D Córdoba"
            className="w-full"
            aria-required="true"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'business_name_error' : undefined}
          />
          {error && (
            <p
              id="business_name_error"
              role="alert"
              aria-live="polite"
              className="mt-1.5 text-xs text-lyrup-error"
            >
              {error}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="phone"
            className="block text-lyrup-text text-sm font-medium mb-1.5"
          >
            WhatsApp{' '}
            <span className="text-lyrup-text-muted font-normal">(opcional)</span>
          </label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: +54 9 351 000 0000"
            className="w-full"
          />
        </div>

        <Button type="submit" className="w-full">
          Siguiente →
        </Button>
      </form>
    </div>
  )
}
