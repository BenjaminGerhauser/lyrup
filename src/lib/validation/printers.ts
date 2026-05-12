/**
 * Pure validation functions for printer CRUD forms.
 * No Zod, no throws — returns discriminated union { valid: true } | { error: string }.
 */

export interface AddPrinterData {
  ref_model_id: string | null
  custom_name: string | null
  purchase_price: string | number | null
  purchase_date: string | null
  // Manual-entry fields (used when ref_model_id is null)
  manual_name: string | null
  power_w: string | number | null
  life_hours_estimate: string | number | null
}

export interface EditPrinterData {
  purchase_price: string | number | null
  custom_name: string | null
}

export type ValidationResult = { valid: true } | { error: string }

/**
 * Validates data for adding a printer.
 * Required: purchase_price > 0.
 * Manual entry: manual_name must be non-empty.
 */
export function validateAddPrinter(data: AddPrinterData): ValidationResult {
  const price = typeof data.purchase_price === 'string'
    ? parseFloat(data.purchase_price)
    : data.purchase_price

  if (price === null || price === undefined || isNaN(price as number)) {
    return { error: 'El precio de compra es obligatorio' }
  }

  if ((price as number) <= 0) {
    return { error: 'El precio de compra debe ser mayor a cero' }
  }

  // Manual entry: requires a name
  if (data.ref_model_id === null) {
    const name = data.manual_name?.trim() ?? ''
    if (!name) {
      return { error: 'El nombre de la impresora es obligatorio para entrada manual' }
    }

    const powerW = typeof data.power_w === 'string'
      ? parseFloat(data.power_w)
      : data.power_w

    if (powerW !== null && powerW !== undefined && !isNaN(powerW as number) && (powerW as number) < 0) {
      return { error: 'El consumo eléctrico no puede ser negativo' }
    }
  }

  return { valid: true }
}

/**
 * Validates data for editing a printer.
 * Allowed fields: purchase_price and custom_name.
 * purchase_price is required if provided and must be > 0.
 */
export function validateEditPrinter(data: EditPrinterData): ValidationResult {
  // If purchase_price is provided, it must be valid
  if (data.purchase_price !== null && data.purchase_price !== undefined && data.purchase_price !== '') {
    const price = typeof data.purchase_price === 'string'
      ? parseFloat(data.purchase_price)
      : data.purchase_price

    if (isNaN(price as number)) {
      return { error: 'El precio de compra no es válido' }
    }

    if ((price as number) <= 0) {
      return { error: 'El precio de compra debe ser mayor a cero' }
    }
  }

  return { valid: true }
}
