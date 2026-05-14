'use client'

import { useActionState, useState } from 'react'
import { PencilIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateQuoteMetadata, type QuoteActionResult } from '@/app/actions/quotes'
import type { Client, QuoteWithItems } from '@/types/domain'

interface EditQuoteDialogProps {
  quote: QuoteWithItems
  clients: Client[]
}

const initialState: QuoteActionResult | null = null

const NONE_VALUE = '__none__'

export function EditQuoteDialog({ quote, clients }: EditQuoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(quote.title)
  const [clientId, setClientId] = useState<string | null>(quote.client_id)
  const [notes, setNotes] = useState(quote.notes ?? '')

  const [state, dispatch, isPending] = useActionState(
    async (_prev: QuoteActionResult | null, _formData: FormData) => {
      const result = await updateQuoteMetadata(quote.id, {
        title,
        client_id: clientId,
        notes: notes.trim() || null,
      })
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
        render={<Button variant="outline" size="sm" aria-label="Editar cotización" />}
      >
        <PencilIcon className="size-4" /> Editar
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cotización</DialogTitle>
        </DialogHeader>

        <form action={dispatch} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Título</span>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Cliente</span>
            <Select
              value={clientId ?? NONE_VALUE}
              onValueChange={(v: string | null) =>
                setClientId(!v || v === NONE_VALUE ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin cliente">
                  {(val: string) => {
                    if (!val || val === NONE_VALUE) return 'Sin cliente'
                    const c = clients.find((c) => c.id === val)
                    return c ? c.name : val
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sin cliente</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Notas</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>

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
              {isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
