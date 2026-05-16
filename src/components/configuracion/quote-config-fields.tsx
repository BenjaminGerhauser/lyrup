'use client'

/**
 * QuoteConfigFields — controlled inputs for the 3 new quote PDF config columns.
 *
 * Props are controlled from the parent ConfiguracionForm to follow the existing
 * pattern (all form fields are controlled, synced via useEffect after server
 * revalidation).
 *
 * Fields:
 *   - quote_validity_days: integer 1–365, renders as number input
 *   - quote_footer_note: optional free-form text, renders as textarea
 *   - pdf_show_breakdown: boolean toggle, renders as checkbox
 */

import { Input } from '@/components/ui/input'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuoteConfigFieldValues {
  quote_validity_days: string
  quote_footer_note: string
  pdf_show_breakdown: boolean
}

interface QuoteConfigFieldsProps {
  values: QuoteConfigFieldValues
  onValuesChange: (next: Partial<QuoteConfigFieldValues>) => void
  /** Field-level validation error for quote_validity_days (shown inline). */
  validityDaysError?: string | null
}

// ---------------------------------------------------------------------------
// QuoteConfigFields
// ---------------------------------------------------------------------------

export function QuoteConfigFields({
  values,
  onValuesChange,
  validityDaysError,
}: QuoteConfigFieldsProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Configuración del presupuesto PDF
      </h2>

      {/* ── Validity days ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <label htmlFor="quote_validity_days" className="text-sm font-medium">
          Validez del presupuesto (días) <span className="text-destructive">*</span>
        </label>
        <Input
          id="quote_validity_days"
          name="quote_validity_days"
          type="number"
          min="1"
          max="365"
          step="1"
          value={values.quote_validity_days}
          onChange={(e) => onValuesChange({ quote_validity_days: e.target.value })}
          placeholder="30"
          aria-invalid={!!validityDaysError}
          aria-describedby={validityDaysError ? 'validity-days-error' : undefined}
          className="w-full"
        />
        {validityDaysError ? (
          <p
            id="validity-days-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {validityDaysError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            El PDF mostrará la fecha límite de aceptación calculada desde hoy.
          </p>
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <label htmlFor="quote_footer_note" className="text-sm font-medium">
          Nota al pie{' '}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          id="quote_footer_note"
          name="quote_footer_note"
          rows={3}
          value={values.quote_footer_note}
          onChange={(e) => onValuesChange({ quote_footer_note: e.target.value })}
          placeholder="Ej: Precios sujetos a cambio sin previo aviso."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Se imprime en itálica al pie de cada PDF. Dejá vacío para omitir.
        </p>
      </div>

      {/* ── Breakdown toggle ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <input
          id="pdf_show_breakdown"
          name="pdf_show_breakdown"
          type="checkbox"
          checked={values.pdf_show_breakdown}
          onChange={(e) => onValuesChange({ pdf_show_breakdown: e.target.checked })}
          value="on"
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-ring"
          aria-describedby="pdf-breakdown-hint"
        />
        <div className="flex flex-col gap-0.5">
          <label htmlFor="pdf_show_breakdown" className="text-sm font-medium cursor-pointer">
            Mostrar desglose de costos en PDF
          </label>
          <p id="pdf-breakdown-hint" className="text-xs text-muted-foreground">
            Agrega una tabla por pieza con material, electricidad, depreciación y mano de obra.
          </p>
        </div>
      </div>
    </section>
  )
}
