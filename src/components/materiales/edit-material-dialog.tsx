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
import { editMaterial, type MaterialActionResult } from '@/app/actions/materials'
import type { MaterialWithRef } from './material-list'
import { ColorPicker } from './color-picker'

// ---------------------------------------------------------------------------
// EditMaterialDialog
// ---------------------------------------------------------------------------

interface EditMaterialDialogProps {
  material: MaterialWithRef
}

const initialState: MaterialActionResult | null = null

export function EditMaterialDialog({ material }: EditMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [colorHex, setColorHex] = useState<string>(material.color ?? '')
  const [state, dispatch, isPending] = useActionState(
    async (_prev: MaterialActionResult | null, formData: FormData) => {
      // Inject the color picker value into the FormData
      formData.set('color_hex', colorHex)
      const result = await editMaterial(formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    initialState
  )

  const ref = material.ref_filament_catalog
  const displayName =
    material.name ||
    (ref ? `${ref.brand} ${ref.material_type}` : null) ||
    'Material'

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Reset color to current material color on open
      setColorHex(material.color ?? '')
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <DialogTitle>Editar material</DialogTitle>
          <DialogDescription>
            Modificá el precio, el nombre o el color del material.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={material.id} />

          {/* Read-only ref fields */}
          {ref && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium">{ref.brand} {ref.material_type}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {ref.density_g_cm3} g/cm³ ·{' '}
                {ref.filament_diameter}mm{' '}
                {ref.nozzle_temp_min && ref.nozzle_temp_max
                  ? ` · Boquilla ${ref.nozzle_temp_min}–${ref.nozzle_temp_max}°C`
                  : ''}
              </p>
            </div>
          )}

          {/* Editable: custom_name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-material-name" className="text-sm font-medium">
              Nombre personalizado
            </label>
            <input
              id="edit-material-name"
              name="custom_name"
              type="text"
              defaultValue={material.name}
              placeholder="Ej: Mi PLA rojo"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          {/* Editable: price_per_kg */}
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-material-price" className="text-sm font-medium">
              Precio por kg (ARS) <span className="text-destructive">*</span>
            </label>
            <input
              id="edit-material-price"
              name="price_per_kg"
              type="number"
              min="1"
              step="1"
              defaultValue={material.price_per_kg_ars ?? ''}
              placeholder="8500"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          {/* Editable: color_hex via ColorPicker */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Color</label>
            <ColorPicker value={colorHex} onChange={setColorHex} />
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
