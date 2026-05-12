'use client'

import { useActionState, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PencilIcon } from 'lucide-react'
import { editPrinter, type PrinterActionResult } from '@/app/actions/printers'
import type { PrinterWithRef } from './printer-list'

// ---------------------------------------------------------------------------
// EditPrinterDialog
// ---------------------------------------------------------------------------

interface EditPrinterDialogProps {
  printer: PrinterWithRef
}

const initialState: PrinterActionResult | null = null

export function EditPrinterDialog({ printer }: EditPrinterDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, dispatch, isPending] = useActionState(
    async (_prev: PrinterActionResult | null, formData: FormData) => {
      const result = await editPrinter(formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    initialState
  )

  const refModel = printer.ref_printer_model
  const displayName =
    printer.name ||
    refModel?.full_name ||
    (refModel ? `${refModel.brand} ${refModel.model}` : 'Impresora')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" aria-label={`Editar ${displayName}`} />
        }
      >
        <PencilIcon />
        <span>Editar</span>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar impresora</DialogTitle>
          <DialogDescription>
            Modificá el precio de compra o el nombre personalizado.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={printer.id} />

          {/* Read-only ref fields */}
          {refModel && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium">{refModel.brand} {refModel.model}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {refModel.power_w ? `${refModel.power_w}W` : ''}
                {refModel.power_w && refModel.estimated_life_hours ? ' · ' : ''}
                {refModel.estimated_life_hours ? `${refModel.estimated_life_hours.toLocaleString('es-AR')}h de vida estimada` : ''}
              </p>
            </div>
          )}

          {/* Editable: custom_name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-custom-name" className="text-sm font-medium">
              Nombre personalizado
            </label>
            <input
              id="edit-custom-name"
              name="custom_name"
              type="text"
              defaultValue={printer.name}
              placeholder="Ej: Mi Ender 3 modificada"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          {/* Editable: purchase_price */}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-purchase-price" className="text-sm font-medium">
              Precio de compra (ARS) <span className="text-destructive">*</span>
            </label>
            <input
              id="edit-purchase-price"
              name="purchase_price"
              type="number"
              min="1"
              step="1"
              defaultValue={printer.purchase_price_ars ?? ''}
              placeholder="150000"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          {/* Error display */}
          {state && !state.success && (
            <div
              aria-live="polite"
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
