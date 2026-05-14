'use client'

import { useActionState, useState, type ReactNode } from 'react'
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

export type DeleteActionResult =
  | { success: true }
  | { success: false; error: string }

interface DeleteConfirmDialogProps {
  id: string
  displayName: string
  entityLabel: string
  action: (formData: FormData) => Promise<DeleteActionResult>
  triggerRender?: ReactNode
  triggerChildren?: ReactNode
}

const initialState: DeleteActionResult | null = null

export function DeleteConfirmDialog({
  id,
  displayName,
  entityLabel,
  action,
  triggerRender,
  triggerChildren,
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, dispatch, isPending] = useActionState(
    async (_prev: DeleteActionResult | null, formData: FormData) => {
      const result = await action(formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    initialState,
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          triggerRender ?? (
            <Button
              variant="destructive"
              size="sm"
              aria-label={`Eliminar ${displayName}`}
            />
          )
        }
      >
        {triggerChildren ?? (
          <>
            <Trash2Icon />
            <span className="sr-only">Eliminar</span>
          </>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar {entityLabel}</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que querés eliminar <strong>{displayName}</strong>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch}>
          <input type="hidden" name="id" value={id} />

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
