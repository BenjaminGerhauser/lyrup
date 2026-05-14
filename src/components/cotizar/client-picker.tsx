'use client'

import { useActionState, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addClient, type ClientCreateResult } from '@/app/actions/clients'
import type { Client } from '@/types/domain'

interface ClientPickerProps {
  clients: Client[]
  value: string | null
  onChange: (id: string | null) => void
  onClientCreated: (client: Client) => void
}

const initialState: ClientCreateResult | null = null

const NONE_VALUE = '__none__'

export function ClientPicker({
  clients,
  value,
  onChange,
  onClientCreated,
}: ClientPickerProps) {
  const [open, setOpen] = useState(false)

  const [state, dispatch, isPending] = useActionState(
    async (_prev: ClientCreateResult | null, formData: FormData) => {
      const result = await addClient(formData)
      if (result.success) {
        onClientCreated(result.client)
        setOpen(false)
      }
      return result
    },
    initialState,
  )

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">Cliente (opcional)</span>
      <div className="flex gap-2">
        <Select
          value={value ?? NONE_VALUE}
          onValueChange={(v: string | null) =>
            onChange(!v || v === NONE_VALUE ? null : v)
          }
        >
          <SelectTrigger className="flex-1">
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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button type="button" variant="outline" size="sm" aria-label="Nuevo cliente" />
            }
          >
            <PlusIcon className="size-4" /> Nuevo
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
              <DialogDescription>
                El WhatsApp es obligatorio para enviar el PDF de la cotización
                (próximamente).
              </DialogDescription>
            </DialogHeader>

            <form action={dispatch} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Nombre</span>
                <Input name="name" maxLength={100} placeholder="Juan Pérez" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">WhatsApp</span>
                <Input
                  name="whatsapp"
                  placeholder="+54 9 11 1234-5678"
                  inputMode="tel"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Email (opcional)</span>
                <Input name="email" placeholder="cliente@correo.com" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Notas (opcional)</span>
                <textarea
                  name="notes"
                  maxLength={500}
                  className="min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  {isPending ? 'Guardando…' : 'Crear cliente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
