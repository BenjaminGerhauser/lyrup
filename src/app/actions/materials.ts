'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { validateAddMaterial, validateEditMaterial } from '@/lib/validation/materials'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MaterialActionResult =
  | { success: true }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// addMaterial
// ---------------------------------------------------------------------------

export async function addMaterial(formData: FormData): Promise<MaterialActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const refFilamentId = formData.get('ref_filament_id')?.toString() || null
    const customName = formData.get('custom_name')?.toString() || null
    const materialType = formData.get('material_type')?.toString() || null
    const priceRaw = formData.get('price_per_kg')?.toString() || null
    const colorHex = formData.get('color_hex')?.toString() || null
    const manualName = formData.get('manual_name')?.toString() || null
    const brand = formData.get('brand')?.toString() || null
    const densityRaw = formData.get('density_g_cm3')?.toString() || null

    const validation = validateAddMaterial({
      ref_filament_id: refFilamentId,
      custom_name: customName,
      material_type: materialType,
      price_per_kg: priceRaw,
      color_hex: colorHex,
      manual_name: manualName,
      brand: brand,
      density_g_cm3: densityRaw,
    })

    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    // Determine the name to store
    const name = customName || manualName || `${materialType ?? ''} ${brand ?? ''}`.trim() || 'Sin nombre'
    const price = priceRaw ? parseFloat(priceRaw) : null
    const density = densityRaw ? parseFloat(densityRaw) : null

    const { error } = await supabase.from('materials').insert({
      user_id: user.id,
      name,
      filament_id: refFilamentId,
      material_type: materialType,
      color: colorHex,
      price_per_kg_ars: price,
      density_g_cm3: density,
    })

    if (error) {
      console.error('addMaterial error:', error)
      return { success: false, error: 'Error al agregar el material. Intentá de nuevo.' }
    }

    revalidatePath('/materiales')
    return { success: true }
  } catch (err) {
    console.error('addMaterial unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// editMaterial
// ---------------------------------------------------------------------------

export async function editMaterial(formData: FormData): Promise<MaterialActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    if (!id) {
      return { success: false, error: 'ID de material requerido' }
    }

    const priceRaw = formData.get('price_per_kg')?.toString() || null
    const customName = formData.get('custom_name')?.toString() || null
    const colorHex = formData.get('color_hex')?.toString() || null

    const validation = validateEditMaterial({
      price_per_kg: priceRaw,
      custom_name: customName,
      color_hex: colorHex,
    })

    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (priceRaw !== null && priceRaw !== '') {
      updateData.price_per_kg_ars = parseFloat(priceRaw)
    }
    if (customName !== null) {
      updateData.name = customName || undefined
    }
    if (colorHex !== null) {
      updateData.color = colorHex || null
    }

    const { error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // RLS: user can only edit their own materials

    if (error) {
      console.error('editMaterial error:', error)
      return { success: false, error: 'Error al editar el material. Intentá de nuevo.' }
    }

    revalidatePath('/materiales')
    return { success: true }
  } catch (err) {
    console.error('editMaterial unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// deleteMaterial
// ---------------------------------------------------------------------------

export async function deleteMaterial(formData: FormData): Promise<MaterialActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    if (!id) {
      return { success: false, error: 'ID de material requerido' }
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // RLS: user can only delete their own materials

    if (error) {
      console.error('deleteMaterial error:', error)
      return { success: false, error: 'Error al eliminar el material. Intentá de nuevo.' }
    }

    revalidatePath('/materiales')
    return { success: true }
  } catch (err) {
    console.error('deleteMaterial unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}
