import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, FileTextIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/cotizaciones/status-badge'
import { StatusToggle } from '@/components/cotizaciones/status-toggle'
import { EditQuoteDialog } from '@/components/cotizaciones/edit-quote-dialog'
import { DeleteQuoteDialog } from '@/components/cotizaciones/delete-quote-dialog'
import { QuoteActions } from '@/components/cotizaciones/quote-actions'
import { getQuote } from '@/app/actions/quotes'
import { listClients } from '@/app/actions/clients'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { formatArs } from '@/lib/format'
import type { QuoteDocumentUser } from '@/lib/pdf/document'

interface PageProps {
  params: Promise<{ id: string }>
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function CotizacionDetallePage({ params }: PageProps) {
  const { id } = await params

  // Parallel fetches: quote+items+client AND user PDF config row
  const supabase = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const [quote, clients] = await Promise.all([
    getQuote(id),
    listClients(),
  ])
  if (!quote) notFound()

  // Fetch user PDF config fields (needed by QuoteActions → PDF + WhatsApp)
  let userPdfData: QuoteDocumentUser | null = null
  if (authUser) {
    const { data: userRow } = await supabase
      .from('users')
      .select(
        'business_name, phone, business_phone, plan, quote_validity_days, quote_footer_note, pdf_show_breakdown'
      )
      .eq('id', authUser.id)
      .single()
    if (userRow) {
      userPdfData = userRow as QuoteDocumentUser
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/cotizaciones"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> Cotizaciones
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {quote.title}
            </h1>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {quote.client ? quote.client.name : 'Sin cliente'} ·{' '}
            {dateFormatter.format(new Date(quote.created_at))}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusToggle quoteId={quote.id} currentStatus={quote.status} />
          <EditQuoteDialog quote={quote} clients={clients} />
          <DeleteQuoteDialog quoteId={quote.id} quoteTitle={quote.title} />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Piezas ({quote.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {quote.items.map((it, idx) => {
            const printerLabel = it.printer
              ? it.printer.name
              : it.printer_id === null
                ? 'Impresora eliminada'
                : null
            const materialLabel = it.material
              ? it.material.name
              : it.material_id === null
                ? 'Material eliminado'
                : null
            return (
            <div key={it.id} className="rounded-lg border border-input p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {idx + 1}. {it.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {it.quantity} ud · {it.filament_g ?? '—'} g ·{' '}
                    {it.print_hours ?? '—'} h
                    {it.gcode_filename && (
                      <>
                        {' · '}
                        <FileTextIcon className="inline size-3" /> {it.gcode_filename}
                      </>
                    )}
                  </p>
                  {(printerLabel || materialLabel) && (
                    <p className="text-xs text-muted-foreground">
                      {printerLabel && (
                        <span className={!it.printer ? 'italic' : undefined}>
                          🖨 {printerLabel}
                        </span>
                      )}
                      {printerLabel && materialLabel && ' · '}
                      {materialLabel && (
                        <span className={!it.material ? 'italic' : undefined}>
                          🧵 {materialLabel}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Unitario</p>
                  <p className="font-medium">
                    {it.unit_price_ars != null ? formatArs(Number(it.unit_price_ars)) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="font-medium">
                    {it.subtotal_ars != null ? formatArs(Number(it.subtotal_ars)) : '—'}
                  </p>
                </div>
              </div>

              {it.cost_breakdown && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Ver desglose de costos
                  </summary>
                  <dl className="mt-2 grid grid-cols-2 gap-y-1 rounded-md bg-muted/30 p-2">
                    <dt className="text-muted-foreground">Material</dt>
                    <dd className="text-right">{formatArs(it.cost_breakdown.materialCost)}</dd>
                    <dt className="text-muted-foreground">Electricidad</dt>
                    <dd className="text-right">{formatArs(it.cost_breakdown.electricityCost)}</dd>
                    <dt className="text-muted-foreground">Depreciación</dt>
                    <dd className="text-right">{formatArs(it.cost_breakdown.depreciationCost)}</dd>
                    <dt className="text-muted-foreground">Mano de obra</dt>
                    <dd className="text-right">{formatArs(it.cost_breakdown.laborCost)}</dd>
                    <dt className="font-medium">Costo total (1 ud)</dt>
                    <dd className="text-right font-medium">{formatArs(it.cost_breakdown.totalCost)}</dd>
                    <dt className="font-medium text-primary">Precio sugerido (1 ud)</dt>
                    <dd className="text-right font-medium text-primary">
                      {formatArs(it.cost_breakdown.suggestedPrice)}
                    </dd>
                  </dl>
                </details>
              )}
            </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Total</CardTitle>
          <span className="text-2xl font-bold text-primary tabular-nums">
            {quote.total_ars != null ? formatArs(Number(quote.total_ars)) : '—'}
          </span>
        </CardHeader>
        {quote.notes && (
          <CardContent>
            <p className="text-xs text-muted-foreground">Notas</p>
            <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        )}
      </Card>

      {userPdfData && (
        <QuoteActions quote={quote} user={userPdfData} client={quote.client} />
      )}
    </div>
  )
}
