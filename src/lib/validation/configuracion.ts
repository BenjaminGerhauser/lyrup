/**
 * Pure validation functions for the /configuracion form.
 * No Zod, no throws — returns discriminated union { valid: true } | { error: string }.
 */

export interface ConfigData {
  business_name: string | null
  /** WhatsApp / celular (stored as `phone` in DB) */
  phone: string | null
  /** Teléfono fijo / línea de negocio (stored as `business_phone` in DB) */
  business_phone: string | null
  logo_url: string | null
  labor_rate_hour: string | number | null
  default_margin_percent: string | number | null
  default_labor_factor: string | number | null
  province: string | null
  electricity_rate_kwh: string | number | null
}

export type ValidationResult = { valid: true } | { error: string }

/**
 * Validates the configuracion form data.
 *
 * Rules:
 * - business_name: required, non-empty
 * - labor_rate_hour: required, > 0
 * - default_margin_percent: required, >= 0
 * - default_labor_factor: required, in [0.05, 0.40]
 * - electricity_rate_kwh: optional, but if provided must be > 0
 */
export function validateConfig(data: ConfigData): ValidationResult {
  // business_name — required
  const name = data.business_name?.trim() ?? ''
  if (!name) {
    return { error: 'El nombre del negocio es obligatorio' }
  }

  // labor_rate_hour — required, > 0
  const laborRate =
    typeof data.labor_rate_hour === 'string'
      ? parseFloat(data.labor_rate_hour)
      : data.labor_rate_hour

  if (laborRate === null || laborRate === undefined || isNaN(laborRate as number)) {
    return { error: 'La tarifa de mano de obra es obligatoria' }
  }
  if ((laborRate as number) <= 0) {
    return { error: 'La tarifa de mano de obra debe ser mayor a cero' }
  }

  // default_margin_percent — required, >= 0
  const margin =
    typeof data.default_margin_percent === 'string'
      ? parseFloat(data.default_margin_percent)
      : data.default_margin_percent

  if (margin === null || margin === undefined || isNaN(margin as number)) {
    return { error: 'El margen de ganancia es obligatorio' }
  }
  if ((margin as number) < 0) {
    return { error: 'El margen de ganancia no puede ser negativo' }
  }

  // default_labor_factor — required, in [0.05, 0.40]
  const factor =
    typeof data.default_labor_factor === 'string'
      ? parseFloat(data.default_labor_factor)
      : data.default_labor_factor

  if (factor === null || factor === undefined || isNaN(factor as number)) {
    return { error: 'El factor de mano de obra es obligatorio' }
  }
  if ((factor as number) < 0.05 || (factor as number) > 0.40) {
    return { error: 'El factor de mano de obra debe estar entre 0.05 y 0.40' }
  }

  // electricity_rate_kwh — optional, but > 0 if provided
  if (data.electricity_rate_kwh !== null && data.electricity_rate_kwh !== undefined && data.electricity_rate_kwh !== '') {
    const rate =
      typeof data.electricity_rate_kwh === 'string'
        ? parseFloat(data.electricity_rate_kwh)
        : data.electricity_rate_kwh

    if (isNaN(rate as number) || (rate as number) <= 0) {
      return { error: 'La tarifa eléctrica debe ser mayor a cero' }
    }
  }

  return { valid: true }
}
