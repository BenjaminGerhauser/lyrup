import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'
import type { Material, RefFilamentCatalog } from '@/types/domain'
import { formatArs } from '@/lib/format'
import { EditMaterialDialog } from './edit-material-dialog'
import { DeleteConfirmDialog } from '@/components/shared/delete-confirm-dialog'
import { deleteMaterial } from '@/app/actions/materials'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MaterialWithRef extends Material {
  ref_filament_catalog?: RefFilamentCatalog | null
}

interface MaterialListProps {
  materials: MaterialWithRef[]
}

// ---------------------------------------------------------------------------
// MaterialCard
// ---------------------------------------------------------------------------

function MaterialCard({ material }: { material: MaterialWithRef }) {
  const ref = material.ref_filament_catalog

  const displayName =
    material.name ||
    (ref ? `${ref.brand} ${ref.material_type}` : null) ||
    'Material sin nombre'

  const isCatalog = material.filament_id !== null
  const price = material.price_per_kg_ars
  const colorHex = material.color

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* Color swatch */}
          {colorHex && (
            <span
              className="inline-block h-4 w-4 shrink-0 rounded-full border border-foreground/20"
              style={{ background: colorHex }}
              aria-label={`Color: ${colorHex}`}
              data-testid="color-swatch"
            />
          )}
          {displayName}
        </CardTitle>
        <CardAction>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isCatalog
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isCatalog ? 'catálogo' : 'manual'}
          </span>
        </CardAction>
        {ref && (
          <CardDescription>
            {ref.brand} · {ref.material_type}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {price !== null && price !== undefined && (
            <>
              <dt className="text-muted-foreground">Precio/kg</dt>
              <dd>{formatArs(price)}</dd>
            </>
          )}
          {material.density_g_cm3 !== null && material.density_g_cm3 !== undefined && (
            <>
              <dt className="text-muted-foreground">Densidad</dt>
              <dd>{material.density_g_cm3} g/cm³</dd>
            </>
          )}
          {material.material_type && (
            <>
              <dt className="text-muted-foreground">Tipo</dt>
              <dd>{material.material_type}</dd>
            </>
          )}
          {material.filament_diameter !== undefined && (
            <>
              <dt className="text-muted-foreground">Diámetro</dt>
              <dd>{material.filament_diameter}mm</dd>
            </>
          )}
        </dl>
      </CardContent>

      <CardFooter className="gap-2">
        <EditMaterialDialog material={material} />
        <DeleteConfirmDialog
          id={material.id}
          displayName={displayName}
          entityLabel="material"
          action={deleteMaterial}
        />
      </CardFooter>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// MaterialList
// ---------------------------------------------------------------------------

export function MaterialList({ materials }: MaterialListProps) {
  if (materials.length === 0) {
    return null
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="material-list"
    >
      {materials.map((material) => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  )
}
