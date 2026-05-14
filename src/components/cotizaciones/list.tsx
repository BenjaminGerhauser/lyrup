import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { formatArs } from '@/lib/format'
import type { Quote } from '@/types/domain'

interface CotizacionesListProps {
  quotes: Quote[]
  clientById: Map<string, string>
  hasFilters?: boolean
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function CotizacionesList({
  quotes,
  clientById,
  hasFilters = false,
}: CotizacionesListProps) {
  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          {hasFilters ? (
            <>
              <p className="font-medium">No encontramos cotizaciones con esos filtros</p>
              <p className="text-sm text-muted-foreground">
                Probá ajustando la búsqueda o tocá «Limpiar» para ver todas.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">Todavía no hay cotizaciones</p>
              <p className="text-sm text-muted-foreground">
                Cuando crees tu primera cotización va a aparecer acá.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {quotes.map((q) => {
        const clientName = q.client_id ? clientById.get(q.client_id) : null
        return (
          <Link
            key={q.id}
            href={`/cotizaciones/${q.id}`}
            className="rounded-lg border border-input bg-card transition-colors hover:bg-muted/30"
          >
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="font-medium truncate">{q.title}</p>
                <p className="text-xs text-muted-foreground">
                  {clientName ?? 'Sin cliente'} ·{' '}
                  {dateFormatter.format(new Date(q.created_at))}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                <StatusBadge status={q.status} />
                <p className="font-semibold tabular-nums">
                  {q.total_ars != null ? formatArs(Number(q.total_ars)) : '—'}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
