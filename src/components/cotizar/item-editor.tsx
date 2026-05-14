'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { UploadIcon, FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MarginControl } from './margin-control'
import { parseGcode } from '@/lib/gcode-parser'
import { matchGcodeToUserEquipment } from '@/lib/gcode-matcher'
import { calculateCosts } from '@/lib/cost-calculator'
import { formatArs } from '@/lib/format'
import type {
  Material,
  Printer,
  RefFilamentCatalog,
  RefPrinterModel,
  User,
} from '@/types/domain'
import type { WizardItem } from './cotizar-wizard'

interface ItemEditorProps {
  item: WizardItem
  profile: User
  printers: Printer[]
  materials: Material[]
  refPrinters: RefPrinterModel[]
  refFilaments: RefFilamentCatalog[]
  onPatch: (patch: Partial<WizardItem>) => void
}

export function ItemEditor({
  item,
  profile,
  printers,
  materials,
  refPrinters,
  refFilaments,
  onPatch,
}: ItemEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseWarning, setParseWarning] = useState<string | null>(null)

  // Recompute the breakdown whenever any cost-relevant input changes.
  useEffect(() => {
    const printer = printers.find((p) => p.id === item.printerId)
    const material = materials.find((m) => m.id === item.materialId)

    if (!printer || !material || item.filamentG == null || item.printHours == null) {
      if (item.breakdown !== null) onPatch({ breakdown: null })
      return
    }
    if (item.filamentG <= 0 || item.printHours <= 0) {
      if (item.breakdown !== null) onPatch({ breakdown: null })
      return
    }

    // Fallback to the ref catalog when the user's printer row is missing
    // these fields — onboarding stores only the FK to ref_printer_models,
    // it doesn't copy power_w or reference_price_ars over.
    const refPrinter = printer.printer_model_id
      ? refPrinters.find((rp) => rp.id === printer.printer_model_id)
      : undefined
    const refMaterial = material.filament_id
      ? refFilaments.find((rf) => rf.id === material.filament_id)
      : undefined

    const effectiveWatts = Number(printer.power_w ?? refPrinter?.power_w ?? 0)
    const effectivePrinterPrice = Number(
      printer.purchase_price_ars ?? refPrinter?.reference_price_ars ?? 0,
    )
    const effectiveMaterialPricePerKg = Number(
      material.price_per_kg_ars ?? refMaterial?.price_per_kg_ars ?? 0,
    )

    const calcInputs = {
      filamentGrams: item.filamentG,
      printTimeMinutes: item.printHours * 60,
      materialPricePerKg: effectiveMaterialPricePerKg,
      printerWatts: effectiveWatts,
      electricityRateKwh: Number(profile.electricity_rate_kwh ?? 0),
      printerPrice: effectivePrinterPrice,
      printerLifeHours: printer.life_hours_estimate,
      laborRateHour: Number(profile.labor_rate_hour ?? 0),
      laborFactor: item.laborFactor,
      marginPercent: item.marginPercent,
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[calculateCosts] inputs', calcInputs)
    }
    const breakdown = calculateCosts(calcInputs)

    if ('error' in breakdown) {
      if (item.breakdown !== null) onPatch({ breakdown: null })
      return
    }
    // Avoid an infinite loop: only patch if the result actually changed.
    const prev = item.breakdown
    if (
      !prev ||
      prev.suggestedPrice !== breakdown.suggestedPrice ||
      prev.totalCost !== breakdown.totalCost
    ) {
      onPatch({ breakdown })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    item.printerId,
    item.materialId,
    item.filamentG,
    item.printHours,
    item.laborFactor,
    item.marginPercent,
  ])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    setParseError(null)
    setParseWarning(null)
    try {
      const text = await file.text()
      const parsed = parseGcode(text)
      // Dev-only debug log to diagnose parser issues in the wild.
      if (process.env.NODE_ENV !== 'production') {
        console.log('[parseGcode]', { filename: file.name, parsed })
      }
      if (!parsed) {
        setParseError(
          'No reconocemos el slicer de este archivo. Aceptamos Cura, PrusaSlicer, OrcaSlicer, BambuStudio y Simplify3D.',
        )
        return
      }
      const match = matchGcodeToUserEquipment(
        parsed,
        printers,
        materials,
        refPrinters,
        refFilaments,
      )

      const missing: string[] = []
      if (parsed.filamentUsedGrams == null) missing.push('filamento')
      if (parsed.estimatedTimeMinutes == null) missing.push('tiempo de impresión')
      if (missing.length > 0) {
        setParseWarning(
          `Detectamos ${parsed.slicerName} pero no pudimos extraer ${missing.join(' ni ')}. Completalo manualmente abajo.`,
        )
      }

      // Round to user-friendly precision (1 decimal for grams, 2 for hours).
      const filamentG =
        parsed.filamentUsedGrams != null
          ? Math.round(parsed.filamentUsedGrams * 10) / 10
          : null
      const printHours =
        parsed.estimatedTimeMinutes != null
          ? Math.round((parsed.estimatedTimeMinutes / 60) * 100) / 100
          : null

      onPatch({
        gcodeFilename: file.name,
        parsed,
        filamentG,
        printHours,
        printerId: match.suggestedPrinterId ?? item.printerId ?? printers[0].id,
        materialId: match.suggestedMaterialId ?? item.materialId ?? materials[0].id,
        description: item.description || file.name.replace(/\.gcode$/i, ''),
      })
    } catch (err) {
      console.error('handleFiles parse error:', err)
      setParseError('No pudimos leer el archivo. Probá con otro G-code.')
    }
  }

  const summary = useMemo(() => {
    if (!item.parsed) return null
    return [
      item.parsed.slicerName,
      item.parsed.printerIdentifier,
      item.parsed.filamentType,
      item.parsed.filamentBrand,
    ]
      .filter(Boolean)
      .join(' · ')
  }, [item.parsed])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle de la pieza activa</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-input bg-muted/30 hover:bg-muted/50'
          }`}
        >
          {item.gcodeFilename ? (
            <>
              <FileTextIcon className="size-8 text-primary" />
              <p className="text-sm font-medium">{item.gcodeFilename}</p>
              {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar archivo
              </Button>
            </>
          ) : (
            <>
              <UploadIcon className="size-8 text-muted-foreground" />
              <p className="text-sm">Arrastrá tu G-code acá o</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Subir archivo
              </Button>
              <p className="text-xs text-muted-foreground">
                Cura, PrusaSlicer, OrcaSlicer, BambuStudio, Simplify3D
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".gcode,.gco,.g,text/plain,application/octet-stream"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {parseError && (
          <div
            aria-live="polite"
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {parseError}
          </div>
        )}

        {parseWarning && (
          <div
            aria-live="polite"
            className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
          >
            {parseWarning}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium">Descripción</span>
            <Input
              type="text"
              value={item.description}
              onChange={(e) => onPatch({ description: e.target.value })}
              placeholder="Ej: Soporte auriculares M01"
              maxLength={200}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Cantidad</span>
            <Input
              type="number"
              min={1}
              step={1}
              value={item.quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                onPatch({ quantity: Number.isFinite(v) && v >= 1 ? v : 1 })
              }}
            />
          </label>

          <div className="sm:col-span-2">
            <MarginControl
              value={item.marginPercent}
              onChange={(v) => onPatch({ marginPercent: v })}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Filamento (g)</span>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={item.filamentG ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onPatch({ filamentG: Number.isFinite(v) ? v : null })
              }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Tiempo (horas)</span>
            <Input
              type="number"
              min={0}
              step={0.1}
              value={item.printHours ?? ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                onPatch({ printHours: Number.isFinite(v) ? v : null })
              }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Impresora</span>
            <Select
              value={item.printerId ?? ''}
              onValueChange={(v: string | null) => onPatch({ printerId: v ?? '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegí una impresora">
                  {(val: string) => {
                    if (!val) return null
                    const p = printers.find((p) => p.id === val)
                    return p ? p.name : val
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {printers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Material</span>
            <Select
              value={item.materialId ?? ''}
              onValueChange={(v: string | null) => onPatch({ materialId: v ?? '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegí un material">
                  {(val: string) => {
                    if (!val) return null
                    const m = materials.find((m) => m.id === val)
                    return m ? m.name : val
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        {item.breakdown && (() => {
          const printer = printers.find((p) => p.id === item.printerId)
          const missing: { label: string; reason: string }[] = []
          const refPrinter = printer?.printer_model_id
            ? refPrinters.find((rp) => rp.id === printer.printer_model_id)
            : undefined
          const watts = printer?.power_w ?? refPrinter?.power_w ?? null
          const price = printer?.purchase_price_ars ?? refPrinter?.reference_price_ars ?? null

          if (item.breakdown.electricityCost === 0) {
            if (!profile.electricity_rate_kwh) {
              missing.push({
                label: 'electricidad',
                reason: 'Falta configurar tu tarifa eléctrica en /configuracion.',
              })
            } else if (!watts) {
              missing.push({
                label: 'electricidad',
                reason: `Falta cargar el consumo (W) de "${printer?.name ?? 'la impresora'}" en /impresoras (o no está en el catálogo de referencia).`,
              })
            }
          }
          if (item.breakdown.depreciationCost === 0) {
            if (!price) {
              missing.push({
                label: 'depreciación',
                reason: `Falta cargar el precio de compra de "${printer?.name ?? 'la impresora'}" en /impresoras.`,
              })
            }
          }
          if (item.breakdown.laborCost === 0 && !profile.labor_rate_hour) {
            missing.push({
              label: 'mano de obra',
              reason: 'Falta configurar tu tarifa por hora en /configuracion.',
            })
          }

          return (
            <div className="rounded-lg border border-input bg-muted/30 p-3 text-sm">
              <div className="mb-2 font-medium">Desglose de costos</div>
              <dl className="grid grid-cols-2 gap-y-1">
                <dt className="text-muted-foreground">Material</dt>
                <dd className="text-right">{formatArs(item.breakdown.materialCost)}</dd>
                <dt className="text-muted-foreground">Electricidad</dt>
                <dd className="text-right">{formatArs(item.breakdown.electricityCost)}</dd>
                <dt className="text-muted-foreground">Depreciación</dt>
                <dd className="text-right">{formatArs(item.breakdown.depreciationCost)}</dd>
                <dt className="text-muted-foreground">Mano de obra</dt>
                <dd className="text-right">{formatArs(item.breakdown.laborCost)}</dd>
                <dt className="font-medium">Costo total (1 unidad)</dt>
                <dd className="text-right font-medium">{formatArs(item.breakdown.totalCost)}</dd>
                <dt className="font-medium text-primary">Precio sugerido (1 unidad)</dt>
                <dd className="text-right font-medium text-primary">
                  {formatArs(item.breakdown.suggestedPrice)}
                </dd>
                {item.quantity > 1 && (
                  <>
                    <dt className="font-medium">Subtotal × {item.quantity}</dt>
                    <dd className="text-right font-medium">
                      {formatArs(item.breakdown.suggestedPrice * item.quantity)}
                    </dd>
                  </>
                )}
              </dl>

              {missing.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 border-t border-input pt-2 text-xs text-amber-700 dark:text-amber-300">
                  {missing.map((m) => (
                    <li key={m.label}>⚠ {m.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}
