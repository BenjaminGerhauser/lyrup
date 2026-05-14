'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatArs } from '@/lib/format'
import type { WizardItem } from './cotizar-wizard'

interface QuoteSummaryProps {
  items: WizardItem[]
  total: number
  canSubmit: boolean
  isSubmitting: boolean
  submitError: string | null
  onSubmit: () => void
}

export function QuoteSummary({
  items,
  total,
  canSubmit,
  isSubmitting,
  submitError,
  onSubmit,
}: QuoteSummaryProps) {
  const readyCount = items.filter(
    (it) => it.breakdown !== null && it.description.trim() !== '',
  ).length

  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <CardHeader>
        <CardTitle>Resumen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="flex flex-col gap-1 text-sm">
          {items.map((it, idx) => (
            <div key={it.key} className="flex justify-between gap-2">
              <dt className="text-muted-foreground truncate">
                {it.description || `Pieza ${idx + 1}`}
                {it.quantity > 1 ? ` × ${it.quantity}` : ''}
              </dt>
              <dd className="shrink-0 font-medium">
                {it.breakdown ? formatArs(it.breakdown.suggestedPrice * it.quantity) : '—'}
              </dd>
            </div>
          ))}
        </dl>

        <div className="h-px bg-border" />

        <div className="flex justify-between gap-2 text-base">
          <span className="font-medium">Total</span>
          <span className="font-bold text-primary">{formatArs(total)}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          {readyCount} de {items.length} {items.length === 1 ? 'pieza lista' : 'piezas listas'}.
        </p>

        {submitError && (
          <div
            aria-live="polite"
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {isSubmitting ? 'Guardando…' : 'Guardar cotización'}
        </Button>
        {!canSubmit && !isSubmitting && (
          <p className="text-xs text-muted-foreground">
            Completá título, descripción, impresora, material y datos de cada pieza para guardar.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
