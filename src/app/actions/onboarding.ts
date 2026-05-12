'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import type { OnboardingDraft } from '@/types/domain'

export type OnboardingResult = { success: true } | { error: string }

/**
 * Server Action — completes onboarding atomically via the PG function
 * `complete_onboarding(...)`. On success redirects to /dashboard.
 *
 * Returns `{ error }` on RPC failure so the wizard can display an inline error.
 * Never throws — errors are returned as a discriminated union.
 */
export async function completeOnboarding(
  draft: OnboardingDraft
): Promise<OnboardingResult> {
  const supabase = await createSupabaseServerClient()

  // Verify the caller is authenticated before invoking the RPC.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'No autenticado. Ingresá nuevamente.' }
  }

  const { error: rpcError } = await supabase.rpc('complete_onboarding', {
    p_user_id: user.id,
    p_business_name: draft.business_name,
    p_phone: draft.phone || null,
    p_province: draft.province,
    p_electricity_rate_kwh: draft.electricity_rate_kwh,
    p_printer_model_id: draft.printer_model_id,
    p_printer_name: draft.printer_name,
    p_filament_id: draft.filament_id,
    p_filament_name: draft.filament_name,
  })

  if (rpcError) {
    console.error('completeOnboarding RPC error:', rpcError)
    return { error: 'Ocurrió un error al guardar. Intentá de nuevo.' }
  }

  redirect('/dashboard')
}
