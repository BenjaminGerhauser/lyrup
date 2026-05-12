import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'
import type { Printer, RefPrinterModel } from '@/types/domain'
import { EditPrinterDialog } from './edit-printer-dialog'
import { DeletePrinterDialog } from './delete-printer-dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PrinterWithRef extends Printer {
  ref_printer_model?: RefPrinterModel | null
}

interface PrinterListProps {
  printers: PrinterWithRef[]
}

// ---------------------------------------------------------------------------
// PrinterCard
// ---------------------------------------------------------------------------

function PrinterCard({ printer }: { printer: PrinterWithRef }) {
  const displayName =
    printer.name ||
    printer.ref_printer_model?.full_name ||
    `${printer.ref_printer_model?.brand ?? ''} ${printer.ref_printer_model?.model ?? ''}`.trim() ||
    'Impresora sin nombre'

  const isCatalog = printer.printer_model_id !== null
  const watts = printer.power_w ?? printer.ref_printer_model?.power_w

  return (
    <Card>
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        <CardAction>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isCatalog
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isCatalog ? 'catálogo' : 'manual'}
          </span>
        </CardAction>
        {printer.ref_printer_model && (
          <CardDescription>
            {printer.ref_printer_model.brand} {printer.ref_printer_model.model}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {watts !== null && watts !== undefined && (
            <>
              <dt className="text-muted-foreground">Consumo</dt>
              <dd>{watts}W</dd>
            </>
          )}
          {printer.life_hours_estimate !== undefined && (
            <>
              <dt className="text-muted-foreground">Vida estimada</dt>
              <dd>{printer.life_hours_estimate.toLocaleString('es-AR')}h</dd>
            </>
          )}
          {printer.purchase_price_ars !== null && printer.purchase_price_ars !== undefined && (
            <>
              <dt className="text-muted-foreground">Precio de compra</dt>
              <dd>
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  maximumFractionDigits: 0,
                }).format(printer.purchase_price_ars)}
              </dd>
            </>
          )}
        </dl>
      </CardContent>

      <CardFooter className="gap-2">
        <EditPrinterDialog printer={printer} />
        <DeletePrinterDialog printerId={printer.id} printerName={displayName} />
      </CardFooter>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// PrinterList
// ---------------------------------------------------------------------------

export function PrinterList({ printers }: PrinterListProps) {
  if (printers.length === 0) {
    return null
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="printer-list"
    >
      {printers.map((printer) => (
        <PrinterCard key={printer.id} printer={printer} />
      ))}
    </div>
  )
}
