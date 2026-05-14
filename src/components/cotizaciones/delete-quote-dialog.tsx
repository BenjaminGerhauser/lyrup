'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deleteQuote, type QuoteActionResult } from '@/app/actions/quotes'

interface DeleteQuoteDialogProps {
  quoteId: string
  quoteTitle: string
}

const initialState: QuoteActionResult | null = null

export function DeleteQuoteDialog({ quoteId, quoteTitle }: DeleteQuoteDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [state, dispatch, isPending] = useActionState(
    async (_prev: QuoteActionResult | null, formData: FormData) => {
      const result = await deleteQuote(formData)
      if (result.success) {
        setOpen(false)
        router.push('/cotizaciones')
        router.refresh()
      }
      return result
    },
    initialState,
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm" aria-label="Eliminar cotización" />
        }
      >
        <Trash2Icon className="size-4" /> Eliminar
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cotización</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que querés eliminar <strong>{quoteTitle}</strong>? Esta acción
            elimina también todos sus ítems y no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch}>
          <input type="hidden" name="id" value={quoteId} />

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
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
