'use client'

import { useActionState, useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusIcon } from 'lucide-react'
import { addPrinter, type PrinterActionResult } from '@/app/actions/printers'
import type { RefPrinterModel } from '@/types/domain'
import { trackPrinterAdded } from '@/lib/analytics/umami'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AddPrinterDialogProps {
  refPrinterModels: RefPrinterModel[]
}

const initialState: PrinterActionResult | null = null

// ---------------------------------------------------------------------------
// AddPrinterDialog
// ---------------------------------------------------------------------------

export function AddPrinterDialog({ refPrinterModels }: AddPrinterDialogProps) {
  const [open, setOpen] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedModelId, setSelectedModelId] = useState<string>('')
  const [state, dispatch, isPending] = useActionState(
    async (_prev: PrinterActionResult | null, formData: FormData) => {
      const result = await addPrinter(formData)
      if (result.success) {
        trackPrinterAdded()
        handleClose()
      }
      return result
    },
    initialState
  )

  // Derived: unique brands sorted by first model's popularity_rank
  const brands = Array.from(
    new Set(
      [...refPrinterModels]
        .sort((a, b) => a.popularity_rank - b.popularity_rank)
        .map((m) => m.brand)
    )
  )

  // Filtered models for selected brand
  const modelsForBrand = selectedBrand
    ? refPrinterModels
        .filter((m) => m.brand === selectedBrand)
        .sort((a, b) => a.popularity_rank - b.popularity_rank)
    : []

  // Auto-fill from selected model
  const selectedModel = refPrinterModels.find((m) => m.id === selectedModelId) ?? null

  // Reset model when brand changes
  useEffect(() => {
    setSelectedModelId('')
  }, [selectedBrand])

  function handleClose() {
    setOpen(false)
    setIsManual(false)
    setSelectedBrand('')
    setSelectedModelId('')
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) handleClose()
    else setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Agregar impresora
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar impresora</DialogTitle>
          <DialogDescription>
            Buscá tu modelo o ingresá los datos manualmente.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="flex flex-col gap-4">
          {/* Manual entry toggle */}
          <button
            type="button"
            className="text-sm text-primary underline-offset-2 hover:underline text-left w-fit"
            onClick={() => {
              setIsManual((v) => !v)
              setSelectedBrand('')
              setSelectedModelId('')
            }}
          >
            {isManual
              ? '← Buscar en el catálogo'
              : 'Mi impresora no está en la lista'}
          </button>

          {/* Hidden flag for manual entry */}
          {isManual && (
            <input type="hidden" name="ref_model_id" value="" />
          )}

          {/* ---- CATALOG MODE ---- */}
          {!isManual && (
            <>
              {/* Brand select */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Marca</label>
                <Select
                  value={selectedBrand}
                  onValueChange={(val: string | null) => setSelectedBrand(val ?? '')}
                >
                  <SelectTrigger className="w-full" aria-label="Seleccioná una marca">
                    <SelectValue placeholder="Seleccioná una marca">
                      {(val: string) => val || null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model select — only when brand selected */}
              {selectedBrand && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Modelo</label>
                  <Select
                    value={selectedModelId}
                    onValueChange={(val: string | null) => setSelectedModelId(val ?? '')}
                  >
                    <SelectTrigger className="w-full" aria-label="Seleccioná un modelo">
                      <SelectValue placeholder="Seleccioná un modelo">
                        {(val: string) => {
                          if (!val) return null
                          const m = refPrinterModels.find((m) => m.id === val)
                          return m ? m.model : val
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {modelsForBrand.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Hidden input for form submission */}
                  <input type="hidden" name="ref_model_id" value={selectedModelId} />
                </div>
              )}

              {/* Auto-filled read-only fields */}
              {selectedModel && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">
                    Datos del modelo
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {selectedModel.power_w !== null && selectedModel.power_w !== undefined && (
                      <>
                        <span className="text-muted-foreground">Consumo</span>
                        <span>{selectedModel.power_w}W</span>
                      </>
                    )}
                    {selectedModel.estimated_life_hours !== undefined && (
                      <>
                        <span className="text-muted-foreground">Vida estimada</span>
                        <span>{selectedModel.estimated_life_hours.toLocaleString('es-AR')}h</span>
                      </>
                    )}
                    {selectedModel.firmware_type && (
                      <>
                        <span className="text-muted-foreground">Firmware</span>
                        <span>{selectedModel.firmware_type}</span>
                      </>
                    )}
                    {selectedModel.nozzle_diameter_default !== null && selectedModel.nozzle_diameter_default !== undefined && (
                      <>
                        <span className="text-muted-foreground">Boquilla</span>
                        <span>{selectedModel.nozzle_diameter_default}mm</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ---- MANUAL MODE ---- */}
          {isManual && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-name" className="text-sm font-medium">
                  Nombre de la impresora <span className="text-destructive">*</span>
                </label>
                <input
                  id="manual-name"
                  name="manual_name"
                  type="text"
                  required
                  placeholder="Ej: Mi Ender 3 Pro"
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="manual-power" className="text-sm font-medium">
                  Consumo eléctrico (W)
                </label>
                <input
                  id="manual-power"
                  name="power_w"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="250"
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="manual-life" className="text-sm font-medium">
                  Vida estimada (horas)
                </label>
                <input
                  id="manual-life"
                  name="life_hours_estimate"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="5000"
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                />
              </div>
            </>
          )}

          {/* ---- COMMON FIELDS ---- */}
          <div className="flex flex-col gap-1">
            <label htmlFor="add-custom-name" className="text-sm font-medium">
              Nombre personalizado
            </label>
            <input
              id="add-custom-name"
              name="custom_name"
              type="text"
              placeholder="Ej: Mi impresora del taller"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="add-purchase-price" className="text-sm font-medium">
              Precio de compra (ARS) <span className="text-destructive">*</span>
            </label>
            <input
              id="add-purchase-price"
              name="purchase_price"
              type="number"
              min="1"
              step="1"
              required
              placeholder="150000"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="add-purchase-date" className="text-sm font-medium">
              Fecha de compra
            </label>
            <input
              id="add-purchase-date"
              name="purchase_date"
              type="date"
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
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Agregando…' : 'Agregar impresora'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
