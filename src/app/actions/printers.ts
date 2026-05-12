'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { validateAddPrinter, validateEditPrinter } from '@/lib/validation/printers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrinterActionResult =
  | { success: true }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// addPrinter
// ---------------------------------------------------------------------------

export async function addPrinter(formData: FormData): Promise<PrinterActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const refModelId = formData.get('ref_model_id')?.toString() || null
    const customName = formData.get('custom_name')?.toString() || null
    const purchasePrice = formData.get('purchase_price')?.toString() || null
    const purchaseDate = formData.get('purchase_date')?.toString() || null
    const manualName = formData.get('manual_name')?.toString() || null
    const powerW = formData.get('power_w')?.toString() || null
    const lifeHoursEstimate = formData.get('life_hours_estimate')?.toString() || null

    const validation = validateAddPrinter({
      ref_model_id: refModelId,
      custom_name: customName,
      purchase_price: purchasePrice,
      purchase_date: purchaseDate,
      manual_name: manualName,
      power_w: powerW,
      life_hours_estimate: lifeHoursEstimate,
    })

    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    // Determine printer name: custom_name > manual_name > 'Sin nombre'
    const name = customName || manualName || 'Sin nombre'
    const price = purchasePrice ? parseFloat(purchasePrice) : null
    const watts = powerW ? parseFloat(powerW) : null
    const life = lifeHoursEstimate ? parseInt(lifeHoursEstimate, 10) : undefined

    const { error } = await supabase
      .from('printers')
      .insert({
        user_id: user.id,
        name,
        printer_model_id: refModelId,
        purchase_price_ars: price,
        ...(watts !== null ? { power_w: watts } : {}),
        ...(life !== undefined ? { life_hours_estimate: life } : {}),
      })

    if (error) {
      console.error('addPrinter error:', error)
      return { success: false, error: 'Error al agregar la impresora. Intentá de nuevo.' }
    }

    revalidatePath('/impresoras')
    return { success: true }
  } catch (err) {
    console.error('addPrinter unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// editPrinter
// ---------------------------------------------------------------------------

export async function editPrinter(formData: FormData): Promise<PrinterActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    if (!id) {
      return { success: false, error: 'ID de impresora requerido' }
    }

    const purchasePrice = formData.get('purchase_price')?.toString() || null
    const customName = formData.get('custom_name')?.toString() || null

    const validation = validateEditPrinter({
      purchase_price: purchasePrice,
      custom_name: customName,
    })

    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (purchasePrice !== null && purchasePrice !== '') {
      updateData.purchase_price_ars = parseFloat(purchasePrice)
    }
    if (customName !== null) {
      updateData.name = customName || undefined
    }

    const { error } = await supabase
      .from('printers')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // RLS: user can only edit their own printers

    if (error) {
      console.error('editPrinter error:', error)
      return { success: false, error: 'Error al editar la impresora. Intentá de nuevo.' }
    }

    revalidatePath('/impresoras')
    return { success: true }
  } catch (err) {
    console.error('editPrinter unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// deletePrinter
// ---------------------------------------------------------------------------

export async function deletePrinter(formData: FormData): Promise<PrinterActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    if (!id) {
      return { success: false, error: 'ID de impresora requerido' }
    }

    const { error } = await supabase
      .from('printers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // RLS: user can only delete their own printers

    if (error) {
      console.error('deletePrinter error:', error)
      return { success: false, error: 'Error al eliminar la impresora. Intentá de nuevo.' }
    }

    revalidatePath('/impresoras')
    return { success: true }
  } catch (err) {
    console.error('deletePrinter unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}
