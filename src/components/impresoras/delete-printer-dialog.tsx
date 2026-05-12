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
import { Trash2Icon } from 'lucide-react'
import { deletePrinter, type PrinterActionResult } from '@/app/actions/printers'

// ---------------------------------------------------------------------------
// DeletePrinterDialog
// ---------------------------------------------------------------------------

interface DeletePrinterDialogProps {
  printerId: string
  printerName: string
}

const initialState: PrinterActionResult | null = null

export function DeletePrinterDialog({ printerId, printerName }: DeletePrinterDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, dispatch, isPending] = useActionState(
    async (_prev: PrinterActionResult | null, formData: FormData) => {
      const result = await deletePrinter(formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    initialState
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm" aria-label={`Eliminar ${printerName}`} />
        }
      >
        <Trash2Icon />
        <span className="sr-only">Eliminar</span>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar impresora</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que querés eliminar <strong>{printerName}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch}>
          <input type="hidden" name="id" value={printerId} />

          {state && !state.success && (
            <div
              aria-live="polite"
              role="alert"
              className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
