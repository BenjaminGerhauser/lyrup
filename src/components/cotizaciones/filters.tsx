'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Client, QuoteStatus } from '@/types/domain'

interface CotizacionesFiltersProps {
  clients: Client[]
  currentStatus?: QuoteStatus
  currentClient?: string
  currentSearch?: string
}

const ALL = '__all__'
const NO_CLIENT = '__none__'
const SEARCH_DEBOUNCE_MS = 300

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
}

export function CotizacionesFilters({
  clients,
  currentStatus,
  currentClient,
  currentSearch,
}: CotizacionesFiltersProps) {
  const router = useRouter()
  const sp = useSearchParams()
  const [search, setSearch] = useState(currentSearch ?? '')
  // Remembers the last value WE pushed to the URL. Lets us distinguish our
  // own pushes (skip sync) from external ones — Limpiar, back/forward, etc.
  const lastPushedRef = useRef<string>(currentSearch ?? '')

  // Only sync when currentSearch changes from something other than our push.
  // Without this guard, an in-flight URL push (e.g. "Test") clobbers extra
  // characters the user typed in the meantime (e.g. "Testa" → "Test").
  useEffect(() => {
    const next = currentSearch ?? ''
    if (next !== lastPushedRef.current) {
      setSearch(next)
      lastPushedRef.current = next
    }
  }, [currentSearch])

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/cotizaciones${params.toString() ? `?${params}` : ''}`)
    },
    [router, sp],
  )

  // Debounced live search: push URL only after the user stops typing.
  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed === lastPushedRef.current) return
    const id = setTimeout(() => {
      lastPushedRef.current = trimmed
      updateParam('q', trimmed || null)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search, updateParam])

  const anyActive = Boolean(currentStatus || currentClient || currentSearch)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por título"
        className="flex-1"
      />

      <Select
        value={currentStatus ?? ALL}
        onValueChange={(v: string | null) =>
          updateParam('status', !v || v === ALL ? null : v)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Estado">
            {(val: string) => {
              if (!val || val === ALL) return 'Todos los estados'
              return STATUS_LABELS[val as QuoteStatus] ?? val
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {(Object.keys(STATUS_LABELS) as QuoteStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentClient ?? ALL}
        onValueChange={(v: string | null) =>
          updateParam('client', !v || v === ALL ? null : v)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Cliente">
            {(val: string) => {
              if (!val || val === ALL) return 'Todos los clientes'
              if (val === NO_CLIENT) return 'Sin cliente'
              const c = clients.find((c) => c.id === val)
              return c ? c.name : val
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los clientes</SelectItem>
          <SelectItem value={NO_CLIENT}>Sin cliente</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {anyActive && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/cotizaciones')}
        >
          <XIcon className="size-4" /> Limpiar
        </Button>
      )}
    </div>
  )
}
