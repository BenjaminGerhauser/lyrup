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
import type { RefFilamentCatalog } from '@/types/domain'

interface Step3MaterialProps {
  initialValue?: string
  onNext: (values: { filament_id: string; filament_name: string }) => void
}

type GroupedFilaments = Record<string, RefFilamentCatalog[]>

export default function Step3Material({ initialValue, onNext }: Step3MaterialProps) {
  const [filaments, setFilaments] = useState<RefFilamentCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>(initialValue ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase
      .from('ref_filament_catalog')
      .select('*')
      .order('material_type', { ascending: true })
      .order('brand', { ascending: true })
      .then(({ data }) => {
        setFilaments(data ?? [])
        setLoading(false)
      })
  }, [])

  // Group filaments by material_type (PLA, PETG, ABS, TPU, etc.)
  const grouped: GroupedFilaments = filaments.reduce<GroupedFilaments>((acc, f) => {
    const key = f.material_type
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) {
      setError('Seleccioná un filamento para continuar.')
      return
    }
    const filament = filaments.find((f) => f.id === selectedId)
    setError(null)
    onNext({
      filament_id: selectedId,
      filament_name: filament
        ? `${filament.brand} ${filament.material_type}${filament.color ? ` – ${filament.color}` : ''}`
        : selectedId,
    })
  }

  return (
    <div className="bg-lyrup-bg-elevated rounded-xl p-6 border border-lyrup-border">
      <h1 className="text-lyrup-text-heading font-heading text-2xl font-bold mb-2">
        ¿Con qué filamento imprimís?
      </h1>
      <p className="text-lyrup-text-secondary text-sm mb-6">
        Seleccioná el filamento que más usás.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-6">
          <label
            htmlFor="filament"
            className="block text-lyrup-text text-sm font-medium mb-1.5"
          >
            Filamento <span className="text-lyrup-error">*</span>
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
                id="filament"
                className="w-full"
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'filament_error' : undefined}
              >
                <SelectValue placeholder="Seleccioná un filamento">
                  {(val: string) => {
                    if (!val) return null
                    const f = filaments.find((f) => f.id === val)
                    return f
                      ? `${f.brand} ${f.material_type}${f.color ? ` – ${f.color}` : ''}`
                      : val
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(grouped).map(([type, typeFilaments]) => (
                  <SelectGroup key={type}>
                    <SelectLabel>{type}</SelectLabel>
                    {typeFilaments.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.brand}
                        {f.color ? ` – ${f.color}` : ''}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}

          {error && (
            <p
              id="filament_error"
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
