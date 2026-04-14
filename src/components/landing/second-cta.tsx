import { createServerClient } from '@/lib/supabase/server'
import { WaitlistForm } from './waitlist-form'

async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = createServerClient()
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

export async function SecondCta() {
  const count = await getWaitlistCount()

  return (
    <section id="cta" className="bg-lyrup-bg py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="cta-glow flex flex-col items-center gap-8 rounded-2xl border border-lyrup-border bg-lyrup-bg-elevated p-10 text-center lg:p-14">
          {count > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-lyrup-border bg-lyrup-bg-subtle px-4 py-1.5 text-sm text-lyrup-text-secondary">
              <span className="size-2 rounded-full bg-lyrup-success" />
              Ya se anotaron{' '}
              <span className="font-mono font-semibold text-lyrup-text-heading">
                {count}
              </span>{' '}
              emprendedores
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-3xl font-bold text-lyrup-text-heading sm:text-4xl lg:text-5xl">
              Sumate a los primeros emprendedores 3D que van a{' '}
              <span className="text-lyrup-cyan">dejar de perder plata</span>
            </h2>
            <p className="text-lg text-lyrup-text-secondary">
              Entrás primero, pagás menos, y ayudás a definir qué construimos
              primero.
            </p>
          </div>

          <div className="w-full max-w-md">
            <WaitlistForm utmSource="second_cta" section="cta" />
          </div>

          <p className="text-sm text-lyrup-text-muted">
            Sin tarjeta. Sin spam. Solo te avisamos cuando abramos.
          </p>
        </div>
      </div>
    </section>
  )
}
