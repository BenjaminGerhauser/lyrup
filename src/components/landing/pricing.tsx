import { TIERS } from '@/lib/constants/pricing'
import { Check } from 'lucide-react'
import { PricingTracker } from './pricing-tracker'

export function Pricing() {
  return (
    <section id="precios" className="bg-lyrup-bg py-20 lg:py-28">
      <PricingTracker />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-lyrup-cyan">
            Precios
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-lyrup-text-heading sm:text-4xl">
            Precios simples. Empezá gratis.
          </h2>
          <p className="mt-4 text-lg text-lyrup-text-secondary">
            Arrancá sin pagar nada. Escalá cuando tu negocio lo necesite.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
                tier.highlighted
                  ? 'border-lyrup-cyan bg-lyrup-bg-elevated shadow-[0_0_40px_rgba(6,182,212,0.15)]'
                  : 'border-lyrup-border bg-lyrup-bg-elevated'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-lyrup-cyan px-4 py-1 text-xs font-bold text-lyrup-bg">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-xl font-bold text-lyrup-text-heading">
                  {tier.name}
                </h3>

                <div className="flex items-baseline gap-1">
                  {tier.price === 0 ? (
                    <span className="font-mono text-4xl font-bold text-lyrup-text-heading">
                      Gratis
                    </span>
                  ) : (
                    <>
                      <span className="font-mono text-sm text-lyrup-text-secondary">$</span>
                      <span className="font-mono text-4xl font-bold text-lyrup-text-heading">
                        {tier.price.toLocaleString('es-AR')}
                      </span>
                      <span className="text-sm text-lyrup-text-muted">
                        {tier.currency}/{tier.period}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="my-6 h-px bg-lyrup-border" />

              <ul className="flex flex-1 flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className={`mt-0.5 size-4 shrink-0 ${
                        tier.highlighted ? 'text-lyrup-cyan' : 'text-lyrup-success'
                      }`}
                    />
                    <span className="text-sm text-lyrup-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <a
                  href="#hero"
                  className={`block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-lyrup-cyan text-lyrup-bg hover:bg-lyrup-cyan-hover'
                      : 'border border-lyrup-border text-lyrup-text-secondary hover:border-lyrup-cyan/50 hover:text-lyrup-text'
                  }`}
                >
                  {tier.price === 0 ? 'Empezar gratis' : 'Quiero acceso anticipado'}
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-lyrup-text-muted">
          Pro cuesta menos que un kilo de PLA. Si Lyrup te ayuda a cotizar bien UNA pieza, ya se pagó solo.
        </p>
      </div>
    </section>
  )
}
