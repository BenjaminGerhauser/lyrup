'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { OnboardingDraft, RefElectricityRate } from '@/types/domain'

interface Step4ProvinceProps {
  draft: OnboardingDraft
  onSubmit: (values: Pick<OnboardingDraft, 'province' | 'electricity_rate_kwh'>) => void
  isPending: boolean
  error?: string
}

export default function Step4Province({ draft, onSubmit, isPending, error: actionError }: Step4ProvinceProps) {
  const [rates, setRates] = useState<RefElectricityRate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState<string>(draft.province ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase
      .from('ref_electricity_rates')
      .select('*')
      .order('province', { ascending: true })
      .then(({ data }) => {
        setRates(data ?? [])
        setLoading(false)
      })
  }, [])

  // Derive unique provinces for the selector
  const provinces = Array.from(new Set(rates.map((r) => r.province)))

  function getRateForProvince(province: string): number {
    const rate = rates.find((r) => r.province === province)
    return rate?.rate_kwh_ars ?? 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvince) {
      setValidationError('Seleccioná tu provincia para continuar.')
      return
    }
    setValidationError(null)
    onSubmit({
      province: selectedProvince,
      electricity_rate_kwh: getRateForProvince(selectedProvince),
    })
  }

  const displayError = validationError ?? actionError

  return (
    <div className="bg-lyrup-bg-elevated rounded-xl p-6 border border-lyrup-border">
      <h1 className="text-lyrup-text-heading font-heading text-2xl font-bold mb-2">
        ¿En qué provincia estás?
      </h1>
      <p className="text-lyrup-text-secondary text-sm mb-6">
        Usamos la tarifa eléctrica de tu provincia para calcular el costo de impresión.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <label
            htmlFor="province"
            className="block text-lyrup-text text-sm font-medium mb-1.5"
          >
            Provincia <span className="text-lyrup-error">*</span>
          </label>

          {loading ? (
            <div className="h-8 rounded-lg bg-lyrup-bg-subtle animate-pulse" />
          ) : (
            <Select
              value={selectedProvince}
              onValueChange={(val: string | null) => {
                setSelectedProvince(val ?? '')
                if (validationError) setValidationError(null)
              }}
            >
              <SelectTrigger
                id="province"
                className="w-full"
                aria-invalid={displayError ? 'true' : undefined}
                aria-describedby={displayError ? 'province_error' : undefined}
              >
                <SelectValue placeholder="Seleccioná tu provincia">
                  {(val: string) => val || null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Argentina</SelectLabel>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          {displayError && (
            <p
              id="province_error"
              role="alert"
              aria-live="polite"
              className="mt-1.5 text-xs text-lyrup-error"
            >
              {displayError}
            </p>
          )}
        </div>

        {/* Summary of what's about to be saved */}
        {selectedProvince && (
          <div className="mb-6 p-3 rounded-lg bg-lyrup-bg-subtle border border-lyrup-border text-sm text-lyrup-text-secondary">
            <p>
              Tarifa eléctrica:{' '}
              <span className="text-lyrup-text font-medium">
                ${getRateForProvince(selectedProvince).toFixed(2)} ARS/kWh
              </span>
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || isPending}>
          {isPending ? 'Guardando...' : '¡Listo! Ir al panel →'}
        </Button>
      </form>
    </div>
  )
}
