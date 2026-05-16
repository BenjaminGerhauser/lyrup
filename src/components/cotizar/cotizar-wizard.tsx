'use client'

import { useReducer, useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ItemEditor } from './item-editor'
import { ClientPicker } from './client-picker'
import { QuoteSummary } from './quote-summary'
import { createQuote } from '@/app/actions/quotes'
import { formatArs } from '@/lib/format'
import { trackQuoteSaved } from '@/lib/analytics/umami'
import type {
  Client,
  Material,
  Printer,
  RefFilamentCatalog,
  RefPrinterModel,
  User,
} from '@/types/domain'
import type { QuoteItemInput } from '@/lib/validation/quotes'
import type { CostBreakdown } from '@/types/calculator'
import type { GcodeData } from '@/types/gcode'

// ---------------------------------------------------------------------------
// Wizard item state — one per piece in the multi-item quote.
// ---------------------------------------------------------------------------

export interface WizardItem {
  /** Local-only key — never sent to DB. */
  key: string
  description: string
  quantity: number
  marginPercent: number
  /** Per-item override of the user's default labor factor. */
  laborFactor: number
  printerId: string | null
  materialId: string | null
  filamentG: number | null
  printHours: number | null
  gcodeFilename: string | null
  parsed: GcodeData | null
  breakdown: CostBreakdown | null
}

interface WizardState {
  title: string
  notes: string
  clientId: string | null
  items: WizardItem[]
  activeItemKey: string
}

type WizardAction =
  | { type: 'SET_TITLE'; value: string }
  | { type: 'SET_NOTES'; value: string }
  | { type: 'SET_CLIENT'; value: string | null }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM'; key: string }
  | { type: 'UPDATE_ITEM'; key: string; patch: Partial<WizardItem> }
  | { type: 'SET_ACTIVE_ITEM'; key: string }

function makeEmptyItem(
  profileMargin: number,
  profileLaborFactor: number,
  defaultPrinterId: string,
  defaultMaterialId: string,
): WizardItem {
  return {
    key: crypto.randomUUID(),
    description: '',
    quantity: 1,
    marginPercent: profileMargin,
    laborFactor: profileLaborFactor,
    printerId: defaultPrinterId,
    materialId: defaultMaterialId,
    filamentG: null,
    printHours: null,
    gcodeFilename: null,
    parsed: null,
    breakdown: null,
  }
}

interface ReducerContext {
  defaultPrinterId: string
  defaultMaterialId: string
}

function wizardReducer(
  state: WizardState,
  action: WizardAction,
  ctx: ReducerContext,
): WizardState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.value }
    case 'SET_NOTES':
      return { ...state, notes: action.value }
    case 'SET_CLIENT':
      return { ...state, clientId: action.value }
    case 'ADD_ITEM': {
      const last = state.items[state.items.length - 1]
      const newItem = makeEmptyItem(
        last?.marginPercent ?? 100,
        last?.laborFactor ?? 0.2,
        last?.printerId ?? ctx.defaultPrinterId,
        last?.materialId ?? ctx.defaultMaterialId,
      )
      return {
        ...state,
        items: [...state.items, newItem],
        activeItemKey: newItem.key,
      }
    }
    case 'REMOVE_ITEM': {
      if (state.items.length === 1) return state
      const filtered = state.items.filter((it) => it.key !== action.key)
      const activeStillThere = filtered.some((it) => it.key === state.activeItemKey)
      return {
        ...state,
        items: filtered,
        activeItemKey: activeStillThere ? state.activeItemKey : filtered[0].key,
      }
    }
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((it) =>
          it.key === action.key ? { ...it, ...action.patch } : it,
        ),
      }
    case 'SET_ACTIVE_ITEM':
      return { ...state, activeItemKey: action.key }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Wizard component
// ---------------------------------------------------------------------------

interface CotizarWizardProps {
  profile: User
  printers: Printer[]
  materials: Material[]
  refPrinters: RefPrinterModel[]
  refFilaments: RefFilamentCatalog[]
  initialClients: Client[]
}

export function CotizarWizard({
  profile,
  printers,
  materials,
  refPrinters,
  refFilaments,
  initialClients,
}: CotizarWizardProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, startTransition] = useTransition()

  const profileMargin = Number(profile.default_margin_percent ?? 100)
  const profileLaborFactor = Number(profile.default_labor_factor ?? 0.2)
  const defaultPrinterId = printers[0].id
  const defaultMaterialId = materials[0].id

  const reducerWithCtx = useCallback(
    (state: WizardState, action: WizardAction) =>
      wizardReducer(state, action, { defaultPrinterId, defaultMaterialId }),
    [defaultPrinterId, defaultMaterialId],
  )

  const [state, dispatch] = useReducer(
    reducerWithCtx,
    null,
    (): WizardState => {
      const first = makeEmptyItem(
        profileMargin,
        profileLaborFactor,
        defaultPrinterId,
        defaultMaterialId,
      )
      return {
        title: '',
        notes: '',
        clientId: null,
        items: [first],
        activeItemKey: first.key,
      }
    },
  )

  const activeItem = state.items.find((it) => it.key === state.activeItemKey) ?? state.items[0]
  const total = state.items.reduce(
    (acc, it) => acc + (it.breakdown ? it.breakdown.suggestedPrice * it.quantity : 0),
    0,
  )

  const updateItem = useCallback(
    (key: string, patch: Partial<WizardItem>) => {
      dispatch({ type: 'UPDATE_ITEM', key, patch })
    },
    [],
  )

  const allItemsReady = state.items.every(
    (it) => it.breakdown !== null && it.description.trim() !== '' && it.printerId && it.materialId,
  )
  const canSubmit = state.title.trim() !== '' && allItemsReady && !isSubmitting

  const handleSubmit = () => {
    setSubmitError(null)

    const items: QuoteItemInput[] = state.items.map((it) => ({
      description: it.description.trim(),
      quantity: it.quantity,
      unit_price_ars: it.breakdown!.suggestedPrice,
      printer_id: it.printerId,
      material_id: it.materialId,
      filament_g: it.filamentG,
      print_hours: it.printHours,
      cost_breakdown: it.breakdown,
      gcode_filename: it.gcodeFilename,
    }))

    startTransition(async () => {
      const result = await createQuote({
        title: state.title.trim(),
        client_id: state.clientId,
        notes: state.notes.trim() || null,
        items,
      })

      if (!result.success) {
        setSubmitError(result.error)
        return
      }
      trackQuoteSaved({ item_count: items.length })
      router.push(`/cotizaciones/${result.quote.id}`)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Nueva cotización
        </h1>
        <p className="text-sm text-muted-foreground">
          Subí un G-code por cada pieza y armá la cotización completa.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la cotización</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Título</span>
                <Input
                  type="text"
                  value={state.title}
                  onChange={(e) => dispatch({ type: 'SET_TITLE', value: e.target.value })}
                  placeholder="Ej: Soportes auriculares lote 1"
                  maxLength={200}
                />
              </label>

              <ClientPicker
                clients={clients}
                value={state.clientId}
                onChange={(id) => dispatch({ type: 'SET_CLIENT', value: id })}
                onClientCreated={(c) => {
                  setClients((prev) =>
                    [...prev, c].sort((a, b) => a.name.localeCompare(b.name)),
                  )
                  dispatch({ type: 'SET_CLIENT', value: c.id })
                }}
              />

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Notas (opcional)</span>
                <textarea
                  value={state.notes}
                  onChange={(e) => dispatch({ type: 'SET_NOTES', value: e.target.value })}
                  className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={500}
                  placeholder="Plazo de entrega, condiciones, etc."
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Piezas ({state.items.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'ADD_ITEM' })}
              >
                <PlusIcon className="size-4" /> Agregar pieza
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {state.items.map((it, idx) => {
                const isActive = it.key === state.activeItemKey
                const ready = it.breakdown !== null && it.description.trim() !== ''
                return (
                  <div
                    key={it.key}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                      isActive ? 'border-primary bg-primary/5' : 'border-input'
                    }`}
                  >
                    <button
                      type="button"
                      className="flex-1 text-left text-sm"
                      onClick={() => dispatch({ type: 'SET_ACTIVE_ITEM', key: it.key })}
                    >
                      <span className="font-medium">Pieza {idx + 1}</span>{' '}
                      {it.description ? (
                        <span className="text-muted-foreground">— {it.description}</span>
                      ) : (
                        <span className="text-muted-foreground italic">sin descripción</span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ready ? formatArs(it.breakdown!.suggestedPrice * it.quantity) : '—'}
                      </span>
                    </button>
                    {state.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: 'REMOVE_ITEM', key: it.key })}
                        aria-label={`Quitar pieza ${idx + 1}`}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <ItemEditor
            key={activeItem.key}
            item={activeItem}
            profile={profile}
            printers={printers}
            materials={materials}
            refPrinters={refPrinters}
            refFilaments={refFilaments}
            onPatch={(patch) => updateItem(activeItem.key, patch)}
          />
        </div>

        <QuoteSummary
          items={state.items}
          total={total}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
