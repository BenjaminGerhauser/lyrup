import Link from 'next/link'
import { PlusIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { listQuotes } from '@/app/actions/quotes'
import { listClients } from '@/app/actions/clients'
import { CotizacionesFilters } from '@/components/cotizaciones/filters'
import { CotizacionesList } from '@/components/cotizaciones/list'
import { isValidStatus } from '@/lib/validation/quotes'

interface PageProps {
  searchParams: Promise<{
    status?: string
    client?: string
    q?: string
  }>
}

const NO_CLIENT_SENTINEL = '__none__'

export default async function CotizacionesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const status = sp.status && isValidStatus(sp.status) ? sp.status : undefined
  const rawClient = sp.client?.trim() || undefined
  const noClient = rawClient === NO_CLIENT_SENTINEL
  const clientId = noClient ? undefined : rawClient
  const search = sp.q?.trim() || undefined

  const [quotes, clients] = await Promise.all([
    listQuotes({ status, clientId, noClient, search }),
    listClients(),
  ])

  const clientById = new Map(clients.map((c) => [c.id, c.name]))
  const hasFilters = Boolean(status || rawClient || search)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">
            Historial completo. Editá, cambiá el estado o eliminá cada una.
          </p>
        </div>
        <Link href="/cotizar" className={buttonVariants({ variant: 'default' })}>
          <PlusIcon className="size-4" /> Nueva cotización
        </Link>
      </header>

      <CotizacionesFilters
        clients={clients}
        currentStatus={status}
        currentClient={rawClient}
        currentSearch={search}
      />

      <CotizacionesList
        quotes={quotes}
        clientById={clientById}
        hasFilters={hasFilters}
      />
    </div>
  )
}
