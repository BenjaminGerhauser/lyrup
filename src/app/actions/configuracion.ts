'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { validateConfig } from '@/lib/validation/configuracion'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConfigActionResult =
  | { success: true }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// updateConfig
// ---------------------------------------------------------------------------

/**
 * Server Action — updates the authenticated user's config row in `users`.
 *
 * Auth guard: returns { success: false, error: 'UNAUTHENTICATED' } if no session.
 * Validation: returns { success: false, error: string } for invalid data.
 * Success: updates the row and calls revalidatePath('/configuracion').
 *
 * Never throws — errors are returned as a discriminated union.
 */
export async function updateConfig(formData: FormData): Promise<ConfigActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    // Extract form fields
    const businessName = formData.get('business_name')?.toString() ?? null
    const phone = formData.get('phone')?.toString() || null
    const businessPhone = formData.get('business_phone')?.toString() || null
    const logoUrl = formData.get('logo_url')?.toString() || null
    const laborRateHour = formData.get('labor_rate_hour')?.toString() || null
    const defaultMarginPercent = formData.get('default_margin_percent')?.toString() || null
    const defaultLaborFactor = formData.get('default_labor_factor')?.toString() || null
    const province = formData.get('province')?.toString() || null
    const electricityRateKwh = formData.get('electricity_rate_kwh')?.toString() || null

    // Validate
    const validation = validateConfig({
      business_name: businessName,
      phone,
      business_phone: businessPhone,
      logo_url: logoUrl,
      labor_rate_hour: laborRateHour,
      default_margin_percent: defaultMarginPercent,
      default_labor_factor: defaultLaborFactor,
      province,
      electricity_rate_kwh: electricityRateKwh,
    })

    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    // Build update payload (only non-null values to avoid overwriting with null)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      business_name: businessName?.trim() ?? null,
    }

    if (phone !== null) updateData.phone = phone
    if (businessPhone !== null) updateData.business_phone = businessPhone
    if (logoUrl !== null) updateData.logo_url = logoUrl
    if (laborRateHour !== null) updateData.labor_rate_hour = parseFloat(laborRateHour)
    if (defaultMarginPercent !== null) updateData.default_margin_percent = parseFloat(defaultMarginPercent)
    if (defaultLaborFactor !== null) updateData.default_labor_factor = parseFloat(defaultLaborFactor)
    if (province !== null) updateData.province = province
    if (electricityRateKwh !== null) updateData.electricity_rate_kwh = parseFloat(electricityRateKwh)

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('updateConfig error:', error)
      return { success: false, error: 'Error al guardar la configuración. Intentá de nuevo.' }
    }

    revalidatePath('/configuracion')
    return { success: true }
  } catch (err) {
    console.error('updateConfig unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}
