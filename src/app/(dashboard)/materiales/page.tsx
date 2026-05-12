import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import type { Material, RefFilamentCatalog } from '@/types/domain'
import { MaterialList, type MaterialWithRef } from '@/components/materiales/material-list'
import { AddMaterialDialog } from '@/components/materiales/add-material-dialog'

/**
 * Materiales page — RSC.
 * Fetches user's materials and ref_filament_catalog server-side.
 * No 'use client' — this is a pure Server Component.
 */
export default async function MaterialesPage() {
  const supabase = await createSupabaseServerClient()

  // Fetch user's materials sorted newest-first
  const { data: materialsData } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch filament catalog for add dialog and join
  const { data: catalogData } = await supabase
    .from('ref_filament_catalog')
    .select('*')
    .order('popularity_rank', { ascending: true })

  const materials = (materialsData ?? []) as Material[]
  const catalog = (catalogData ?? []) as RefFilamentCatalog[]

  // Build catalog lookup for joining ref data onto each material
  const catalogById = new Map(catalog.map((r) => [r.id, r]))

  const materialsWithRef: MaterialWithRef[] = materials.map((m) => ({
    ...m,
    ref_filament_catalog: m.filament_id ? (catalogById.get(m.filament_id) ?? null) : null,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Materiales
          </h1>
          <p className="text-sm text-muted-foreground">
            Administrá tus filamentos y sus precios por kg.
          </p>
        </div>
        <AddMaterialDialog refFilamentCatalog={catalog} />
      </div>

      {/* Material list or empty state */}
      {materialsWithRef.length > 0 ? (
        <MaterialList materials={materialsWithRef} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            Todavía no tenés materiales cargados
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Agregá tu primer filamento para empezar a cotizar.
          </p>
          <div className="mt-6">
            <AddMaterialDialog refFilamentCatalog={catalog} />
          </div>
        </div>
      )}
    </div>
  )
}
