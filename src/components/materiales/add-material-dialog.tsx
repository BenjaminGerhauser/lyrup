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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusIcon } from 'lucide-react'
import { addMaterial, type MaterialActionResult } from '@/app/actions/materials'
import type { RefFilamentCatalog } from '@/types/domain'
import { formatArs } from '@/lib/format'
import { ColorPicker } from './color-picker'
import { trackMaterialAdded } from '@/lib/analytics/umami'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AddMaterialDialogProps {
  refFilamentCatalog: RefFilamentCatalog[]
}

const MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon'] as const
type MaterialType = (typeof MATERIAL_TYPES)[number]

const initialState: MaterialActionResult | null = null

// ---------------------------------------------------------------------------
// Reference price badge
// ---------------------------------------------------------------------------

function RefPriceBadge({ refRow }: { refRow: RefFilamentCatalog }) {
  const daysAgo = Math.floor(
    (Date.now() - new Date(refRow.last_updated).getTime()) / 86_400_000
  )

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-800 dark:bg-amber-950"
      data-testid="ref-price-badge"
    >
      <span className="font-medium text-amber-800 dark:text-amber-200">
        Precio de referencia: {formatArs(refRow.price_per_kg_ars)}/kg
      </span>
      <span className="ml-2 text-amber-600 dark:text-amber-400">
        — actualizado hace {daysAgo} día{daysAgo !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AddMaterialDialog
// ---------------------------------------------------------------------------

export function AddMaterialDialog({ refFilamentCatalog }: AddMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedRefId, setSelectedRefId] = useState<string>('')
  const [colorHex, setColorHex] = useState<string>('')
  const [priceOverride, setPriceOverride] = useState<string>('')

  const [state, dispatch, isPending] = useActionState(
    async (_prev: MaterialActionResult | null, formData: FormData) => {
      // Inject color picker value
      formData.set('color_hex', colorHex)
      // If catalog mode, set the ref_filament_id
      if (!isManual && selectedRefId) {
        formData.set('ref_filament_id', selectedRefId)
      } else if (isManual) {
        formData.delete('ref_filament_id')
      }
      const result = await addMaterial(formData)
      if (result.success) {
        trackMaterialAdded()
        handleClose()
      }
      return result
    },
    initialState
  )

  // Derived: catalog rows filtered by selected type, sorted by popularity
  const rowsForType = selectedType
    ? refFilamentCatalog
        .filter((r) => r.material_type === selectedType)
        .sort((a, b) => a.popularity_rank - b.popularity_rank)
    : []

  // Currently selected ref row
  const selectedRef = refFilamentCatalog.find((r) => r.id === selectedRefId) ?? null

  // When a ref row is selected, auto-fill the price
  useEffect(() => {
    if (selectedRef) {
      setPriceOverride(String(selectedRef.price_per_kg_ars))
    }
  }, [selectedRef])

  // Reset product selection when type changes
  useEffect(() => {
    setSelectedRefId('')
    setPriceOverride('')
  }, [selectedType])

  function handleClose() {
    setOpen(false)
    setIsManual(false)
    setSelectedType('')
    setSelectedRefId('')
    setColorHex('')
    setPriceOverride('')
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) handleClose()
    else setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Agregar material
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar material</DialogTitle>
          <DialogDescription>
            Buscá tu filamento en el catálogo o ingresá los datos manualmente.
          </DialogDescription>
        </DialogHeader>

        <form action={dispatch} className="flex flex-col gap-4">
          {/* Manual entry toggle */}
          <button
            type="button"
            className="text-sm text-primary underline-offset-2 hover:underline text-left w-fit"
            onClick={() => {
              setIsManual((v) => !v)
              setSelectedType('')
              setSelectedRefId('')
              setPriceOverride('')
            }}
          >
            {isManual
              ? '← Buscar en el catálogo'
              : 'Mi filamento no está en la lista'}
          </button>

          {/* ---- CATALOG MODE ---- */}
          {!isManual && (
            <>
              {/* Type select */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Tipo de filamento <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(val: string | null) => setSelectedType(val ?? '')}
                >
                  <SelectTrigger className="w-full" aria-label="Seleccioná un tipo">
                    <SelectValue>
                      {(val: string) => val || null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Hidden for form submission */}
                <input type="hidden" name="material_type" value={selectedType} />
              </div>

              {/* Brand/product select — only when type selected */}
              {selectedType && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Marca / Producto</label>
                  <Select
                    value={selectedRefId}
                    onValueChange={(val: string | null) => setSelectedRefId(val ?? '')}
                  >
                    <SelectTrigger className="w-full" aria-label="Seleccioná un producto">
                      <SelectValue>
                        {(val: string) => {
                          if (!val) return null
                          const r = refFilamentCatalog.find((r) => r.id === val)
                          return r ? `${r.brand}` : val
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {rowsForType.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Reference-price badge + auto-fill info */}
              {selectedRef && (
                <div className="flex flex-col gap-2">
                  <RefPriceBadge refRow={selectedRef} />
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">
                      Datos del producto
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                      <span className="text-muted-foreground">Densidad</span>
                      <span>{selectedRef.density_g_cm3} g/cm³</span>
                      <span className="text-muted-foreground">Diámetro</span>
                      <span>{selectedRef.filament_diameter}mm</span>
                      {selectedRef.nozzle_temp_min !== null && selectedRef.nozzle_temp_max !== null && (
                        <>
                          <span className="text-muted-foreground">Boquilla</span>
                          <span>{selectedRef.nozzle_temp_min}–{selectedRef.nozzle_temp_max}°C</span>
                        </>
                      )}
                      {selectedRef.bed_temp_min !== null && selectedRef.bed_temp_max !== null && (
                        <>
                          <span className="text-muted-foreground">Cama</span>
                          <span>{selectedRef.bed_temp_min}–{selectedRef.bed_temp_max}°C</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ---- MANUAL MODE ---- */}
          {isManual && (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-material-name" className="text-sm font-medium">
                  Nombre del filamento <span className="text-destructive">*</span>
                </label>
                <input
                  id="manual-material-name"
                  name="manual_name"
                  type="text"
                  required
                  placeholder="Ej: PLA genérico blanco"
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Tipo de filamento <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(val: string | null) => setSelectedType(val ?? '')}
                >
                  <SelectTrigger className="w-full" aria-label="Seleccioná un tipo">
                    <SelectValue>
                      {(val: string) => val || null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="material_type" value={selectedType} />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="manual-brand" className="text-sm font-medium">
                  Marca
                </label>
                <input
                  id="manual-brand"
                  name="brand"
                  type="text"
                  placeholder="Ej: eSUN"
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="manual-density" className="text-sm font-medium">
                  Densidad (g/cm³)
                </label>
                <input
                  id="manual-density"
                  name="density_g_cm3"
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.01"
                  placeholder="1.24"
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                />
              </div>
            </>
          )}

          {/* ---- COMMON FIELDS ---- */}

          {/* Custom name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="add-material-custom-name" className="text-sm font-medium">
              Nombre personalizado
            </label>
            <input
              id="add-material-custom-name"
              name="custom_name"
              type="text"
              placeholder="Ej: Mi PLA rojo PrintaLot"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          {/* Price per kg — pre-filled from ref, user can override */}
          <div className="flex flex-col gap-1">
            <label htmlFor="add-material-price" className="text-sm font-medium">
              Precio por kg (ARS) <span className="text-destructive">*</span>
            </label>
            <input
              id="add-material-price"
              name="price_per_kg"
              type="number"
              min="1"
              step="1"
              required
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder="8500"
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          {/* Color picker */}
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
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Agregando…' : 'Agregar material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
