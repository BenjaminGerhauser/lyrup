/**
 * Pure validation functions for quote CRUD operations.
 * No Zod, no throws — returns discriminated union { valid: true } | { error: string }.
 */

import type { CostBreakdown } from '@/types/calculator'
import type { QuoteStatus } from '@/types/domain'

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const VALID_STATUSES: ReadonlyArray<QuoteStatus> = ['draft', 'sent', 'accepted', 'rejected']

export interface QuoteItemInput {
  description: string
  quantity: number
  unit_price_ars: number
  printer_id?: string | null
  material_id?: string | null
  filament_g?: number | null
  print_hours?: number | null
  cost_breakdown?: CostBreakdown | null
  gcode_filename?: string | null
}

export interface QuoteCreateData {
  title: string
  client_id: string | null
  notes: string | null
  items: QuoteItemInput[]
}

export interface QuoteMetadataUpdateData {
  title: string
  client_id: string | null
  notes: string | null
}

export type ValidationResult = { valid: true } | { error: string }

export function isValidStatus(s: string): s is QuoteStatus {
  return (VALID_STATUSES as readonly string[]).includes(s)
}

export function validateQuoteItem(item: QuoteItemInput, idx: number): ValidationResult {
  const label = `Ítem ${idx + 1}`

  const description = item.description?.trim() ?? ''
  if (!description) return { error: `${label}: la descripción es obligatoria` }
  if (description.length > 200) return { error: `${label}: la descripción no puede superar 200 caracteres` }

  if (!Number.isInteger(item.quantity) || item.quantity < 1) {
    return { error: `${label}: la cantidad debe ser un entero mayor o igual a 1` }
  }
  if (item.quantity > 10000) {
    return { error: `${label}: la cantidad no puede superar 10000` }
  }

  if (typeof item.unit_price_ars !== 'number' || isNaN(item.unit_price_ars) || item.unit_price_ars <= 0) {
    return { error: `${label}: el precio unitario debe ser mayor a cero` }
  }

  if (item.printer_id && !UUID_RE.test(item.printer_id)) {
    return { error: `${label}: printer_id no es un UUID válido` }
  }
  if (item.material_id && !UUID_RE.test(item.material_id)) {
    return { error: `${label}: material_id no es un UUID válido` }
  }
  if (item.filament_g != null && (item.filament_g < 0 || isNaN(item.filament_g))) {
    return { error: `${label}: los gramos de filamento no pueden ser negativos` }
  }
  if (item.print_hours != null && (item.print_hours < 0 || isNaN(item.print_hours))) {
    return { error: `${label}: las horas de impresión no pueden ser negativas` }
  }

  return { valid: true }
}

export function validateQuoteCreate(data: QuoteCreateData): ValidationResult {
  const title = data.title?.trim() ?? ''
  if (!title) return { error: 'El título de la cotización es obligatorio' }
  if (title.length > 200) return { error: 'El título no puede superar los 200 caracteres' }

  if (data.client_id !== null && !UUID_RE.test(data.client_id)) {
    return { error: 'El cliente seleccionado no es válido' }
  }

  if ((data.notes ?? '').length > 500) {
    return { error: 'Las notas no pueden superar los 500 caracteres' }
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { error: 'La cotización debe tener al menos un ítem' }
  }
  if (data.items.length > 50) {
    return { error: 'La cotización no puede tener más de 50 ítems' }
  }

  for (let i = 0; i < data.items.length; i++) {
    const r = validateQuoteItem(data.items[i], i)
    if ('error' in r) return r
  }

  return { valid: true }
}

export function validateQuoteMetadataUpdate(data: QuoteMetadataUpdateData): ValidationResult {
  const title = data.title?.trim() ?? ''
  if (!title) return { error: 'El título de la cotización es obligatorio' }
  if (title.length > 200) return { error: 'El título no puede superar los 200 caracteres' }

  if (data.client_id !== null && !UUID_RE.test(data.client_id)) {
    return { error: 'El cliente seleccionado no es válido' }
  }

  if ((data.notes ?? '').length > 500) {
    return { error: 'Las notas no pueden superar los 500 caracteres' }
  }

  return { valid: true }
}
