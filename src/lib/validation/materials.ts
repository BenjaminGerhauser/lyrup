/**
 * Pure validation functions for material CRUD forms.
 * No Zod, no throws — returns discriminated union { valid: true } | { error: string }.
 */

const VALID_MATERIAL_TYPES = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon'] as const
export type MaterialType = (typeof VALID_MATERIAL_TYPES)[number]

export interface AddMaterialData {
  ref_filament_id: string | null
  custom_name: string | null
  material_type: string | null
  price_per_kg: string | number | null
  color_hex: string | null
  // Manual-entry fields (used when ref_filament_id is null)
  manual_name: string | null
  brand: string | null
  density_g_cm3: string | number | null
}

export interface EditMaterialData {
  price_per_kg: string | number | null
  custom_name: string | null
  color_hex: string | null
}

export type ValidationResult = { valid: true } | { error: string }

/**
 * Validates data for adding a material.
 * Required: price_per_kg > 0, material_type in allowed enum.
 * Manual entry: manual_name must be non-empty.
 */
export function validateAddMaterial(data: AddMaterialData): ValidationResult {
  // Validate material_type (required always)
  const type = data.material_type?.trim() ?? ''
  if (!type) {
    return { error: 'El tipo de material es obligatorio' }
  }
  if (!VALID_MATERIAL_TYPES.includes(type as MaterialType)) {
    return { error: `Tipo de material inválido. Debe ser uno de: ${VALID_MATERIAL_TYPES.join(', ')}` }
  }

  // Validate price_per_kg (required, > 0)
  const price =
    typeof data.price_per_kg === 'string'
      ? parseFloat(data.price_per_kg)
      : data.price_per_kg

  if (price === null || price === undefined || isNaN(price as number)) {
    return { error: 'El precio por kg es obligatorio' }
  }
  if ((price as number) <= 0) {
    return { error: 'El precio por kg debe ser mayor a cero' }
  }

  // Manual entry: requires a name
  if (data.ref_filament_id === null) {
    const name = data.manual_name?.trim() ?? ''
    if (!name) {
      return { error: 'El nombre del material es obligatorio para entrada manual' }
    }
  }

  return { valid: true }
}

/**
 * Validates data for editing a material.
 * Allowed fields: price_per_kg, custom_name, color_hex.
 * price_per_kg is optional but if provided must be > 0.
 */
export function validateEditMaterial(data: EditMaterialData): ValidationResult {
  if (
    data.price_per_kg !== null &&
    data.price_per_kg !== undefined &&
    data.price_per_kg !== ''
  ) {
    const price =
      typeof data.price_per_kg === 'string'
        ? parseFloat(data.price_per_kg)
        : data.price_per_kg

    if (isNaN(price as number)) {
      return { error: 'El precio por kg no es válido' }
    }
    if ((price as number) <= 0) {
      return { error: 'El precio por kg debe ser mayor a cero' }
    }
  }

  return { valid: true }
}
