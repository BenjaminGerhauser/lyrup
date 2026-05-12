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
import type { RefPrinterModel } from '@/types/domain'

interface Step2PrinterProps {
  initialValue?: string
  onNext: (values: { printer_model_id: string; printer_name: string }) => void
}

type GroupedModels = Record<string, RefPrinterModel[]>

export default function Step2Printer({ initialValue, onNext }: Step2PrinterProps) {
  const [models, setModels] = useState<RefPrinterModel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>(initialValue ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase
      .from('ref_printer_models')
      .select('*')
      .order('brand', { ascending: true })
      .order('model', { ascending: true })
      .then(({ data }) => {
        setModels(data ?? [])
        setLoading(false)
      })
  }, [])

  // Group models by brand for the Select groups
  const grouped: GroupedModels = models.reduce<GroupedModels>((acc, m) => {
    if (!acc[m.brand]) acc[m.brand] = []
    acc[m.brand].push(m)
    return acc
  }, {})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) {
      setError('Seleccioná una impresora para continuar.')
      return
    }
    const model = models.find((m) => m.id === selectedId)
    setError(null)
    onNext({
      printer_model_id: selectedId,
      printer_name: model ? `${model.brand} ${model.model}` : selectedId,
    })
  }

  return (
    <div className="bg-lyrup-bg-elevated rounded-xl p-6 border border-lyrup-border">
      <h1 className="text-lyrup-text-heading font-heading text-2xl font-bold mb-2">
        ¿Qué impresora usás?
      </h1>
      <p className="text-lyrup-text-secondary text-sm mb-6">
        Seleccioná el modelo de tu impresora principal.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <label
            htmlFor="printer_model"
            className="block text-lyrup-text text-sm font-medium mb-1.5"
          >
            Modelo de impresora <span className="text-lyrup-error">*</span>
          </label>

          {loading ? (
            <div className="h-8 rounded-lg bg-lyrup-bg-subtle animate-pulse" />
          ) : (
            <Select
              value={selectedId}
              onValueChange={(val: string | null) => {
                setSelectedId(val ?? '')
                if (error) setError(null)
              }}
            >
              <SelectTrigger
                id="printer_model"
                className="w-full"
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'printer_error' : undefined}
              >
                <SelectValue placeholder="Seleccioná una impresora">
                  {(val: string) => {
                    if (!val) return null
                    const m = models.find((m) => m.id === val)
                    return m ? `${m.brand} ${m.model}` : val
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(grouped).map(([brand, brandModels]) => (
                  <SelectGroup key={brand}>
                    <SelectLabel>{brand}</SelectLabel>
                    {brandModels.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.model}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}

          {error && (
            <p
              id="printer_error"
              role="alert"
              aria-live="polite"
              className="mt-1.5 text-xs text-lyrup-error"
            >
              {error}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          Siguiente →
        </Button>
      </form>
    </div>
  )
}
