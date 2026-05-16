import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { ConfiguracionForm } from '@/components/configuracion/configuracion-form'
import type { RefElectricityRate, User } from '@/types/domain'

export default async function ConfiguracionPage() {
  const supabase = await createSupabaseServerClient()

  // Get authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch the users row (profile data)
  const { data: userData } = authUser
    ? await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
    : { data: null }

  // Fetch all electricity rates for province → rate auto-fill
  const { data: electricityRates } = await supabase
    .from('ref_electricity_rates')
    .select('*')
    .order('province', { ascending: true })

  const user = userData as User | null
  const rates = (electricityRates ?? []) as RefElectricityRate[]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajustá los valores predeterminados para tus cotizaciones
        </p>
      </div>

      {/* Form */}
      <ConfiguracionForm
        initialValues={
          user
            ? {
                business_name: user.business_name ?? '',
                phone: user.phone ?? '',
                business_phone: user.business_phone ?? '',
                logo_url: user.logo_url ?? '',
                labor_rate_hour: user.labor_rate_hour ?? 1500,
                default_margin_percent: user.default_margin_percent ?? 100,
                default_labor_factor: user.default_labor_factor ?? 0.20,
                province: user.province ?? '',
                electricity_rate_kwh: user.electricity_rate_kwh ?? 0,
                // Sprint 3 — PDF config fields
                quote_validity_days: user.quote_validity_days ?? 30,
                quote_footer_note: user.quote_footer_note ?? '',
                pdf_show_breakdown: user.pdf_show_breakdown ?? true,
              }
            : undefined
        }
        electricityRates={rates}
      />
    </div>
  )
}
