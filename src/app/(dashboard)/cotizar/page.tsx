import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { listClients } from '@/app/actions/clients'
import { CotizarWizard } from '@/components/cotizar/cotizar-wizard'
import type {
  Printer,
  Material,
  RefPrinterModel,
  RefFilamentCatalog,
  User,
} from '@/types/domain'

export default async function CotizarPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const [profileRes, printersRes, materialsRes, refPrintersRes, refFilamentsRes, clients] =
    await Promise.all([
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      supabase.from('printers').select('*').eq('user_id', authUser.id).order('name'),
      supabase.from('materials').select('*').eq('user_id', authUser.id).order('name'),
      supabase.from('ref_printer_models').select('*').order('popularity_rank'),
      supabase.from('ref_filament_catalog').select('*').order('popularity_rank'),
      listClients(),
    ])

  if (profileRes.error || !profileRes.data) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold text-foreground">Cotizar</h1>
        <p className="text-destructive">No se pudo cargar tu perfil. Intentá de nuevo.</p>
      </div>
    )
  }

  const profile = profileRes.data as User
  const printers = (printersRes.data ?? []) as Printer[]
  const materials = (materialsRes.data ?? []) as Material[]
  const refPrinters = (refPrintersRes.data ?? []) as RefPrinterModel[]
  const refFilaments = (refFilamentsRes.data ?? []) as RefFilamentCatalog[]

  if (printers.length === 0 || materials.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground">Cotizar</h1>
        <p className="text-muted-foreground">
          Para cotizar necesitás al menos una impresora y un material configurados.
        </p>
        <div className="flex gap-3">
          {printers.length === 0 && (
            <a className="text-primary underline" href="/impresoras">
              Agregar impresora
            </a>
          )}
          {materials.length === 0 && (
            <a className="text-primary underline" href="/materiales">
              Agregar material
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <CotizarWizard
      profile={profile}
      printers={printers}
      materials={materials}
      refPrinters={refPrinters}
      refFilaments={refFilaments}
      initialClients={clients}
    />
  )
}
