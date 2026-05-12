import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { PrinterList, type PrinterWithRef } from '@/components/impresoras/printer-list'
import { AddPrinterDialog } from '@/components/impresoras/add-printer-dialog'
import type { RefPrinterModel } from '@/types/domain'

export default async function ImpresorasPage() {
  const supabase = await createSupabaseServerClient()

  // Fetch user's printers sorted by created_at DESC
  const { data: printers } = await supabase
    .from('printers')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch ref printer models for the add dialog cascading select
  const { data: refModels } = await supabase
    .from('ref_printer_models')
    .select('*')
    .order('popularity_rank', { ascending: true })

  const printerList = (printers ?? []) as PrinterWithRef[]
  const refPrinterModels = (refModels ?? []) as RefPrinterModel[]

  // Enrich printers with their ref model (client-side join for display)
  const enriched: PrinterWithRef[] = printerList.map((p) => ({
    ...p,
    ref_printer_model: refPrinterModels.find((r) => r.id === p.printer_model_id) ?? null,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Impresoras
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestioná tus impresoras 3D
          </p>
        </div>
        <AddPrinterDialog refPrinterModels={refPrinterModels} />
      </div>

      {/* Content */}
      {enriched.length === 0 ? (
        <EmptyState refPrinterModels={refPrinterModels} />
      ) : (
        <PrinterList printers={enriched} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ refPrinterModels }: { refPrinterModels: RefPrinterModel[] }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center"
      data-testid="empty-state"
    >
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">No tenés impresoras cargadas</p>
        <p className="text-sm text-muted-foreground">
          Agregá tu primera impresora para empezar a cotizar.
        </p>
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Agregá tu primera impresora
      </p>
      <AddPrinterDialog refPrinterModels={refPrinterModels} />
    </div>
  )
}
