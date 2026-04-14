import { WaitlistForm } from './waitlist-form'

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-lyrup-bg py-20 lg:py-32"
    >
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-lyrup-cyan/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column — copy + form */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-lyrup-border bg-lyrup-bg-elevated px-4 py-1.5 text-sm text-lyrup-text-secondary">
                <span className="size-2 rounded-full bg-lyrup-cyan animate-pulse" />
                Acceso anticipado — lista de espera abierta
              </div>

              <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-lyrup-text-heading sm:text-5xl lg:text-6xl">
                Dejá de adivinar{' '}
                <span className="text-lyrup-cyan">cuánto cobrar</span>{' '}
                tus impresiones 3D
              </h1>

              <p className="text-lg leading-relaxed text-lyrup-text-secondary sm:text-xl">
                Lyrup analiza tu G-code y calcula el costo REAL: filamento,
                electricidad, depreciación de la impresora y mano de obra.
                Generá un presupuesto profesional en PDF y compartilo por
                WhatsApp en un click.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <WaitlistForm section="hero" />
              <p className="text-sm text-lyrup-text-muted">
                Sin tarjeta. Te avisamos cuando esté listo.
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-lyrup-text-secondary">
              <div className="flex items-center gap-2">
                <span className="text-lyrup-cyan">✓</span>
                Análisis de G-code
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lyrup-cyan">✓</span>
                Costo real en segundos
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lyrup-cyan">✓</span>
                PDF profesional
              </div>
            </div>
          </div>

          {/* Right column — animated visual (hidden on mobile) */}
          <div className="hidden lg:flex lg:items-center lg:justify-center">
            <div className="hero-glow relative h-[480px] w-full max-w-lg rounded-2xl border border-lyrup-border bg-lyrup-bg-elevated p-6">
              {/* Animated G-code → Costo → PDF visual */}
              <div className="flex h-full flex-col gap-4">
                {/* Step 1: G-code file */}
                <div className="hero-step flex items-center gap-3 rounded-xl border border-lyrup-border bg-lyrup-bg-subtle p-4" style={{ animationDelay: '0s' }}>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lyrup-cyan/10 text-lg">
                    📄
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lyrup-text-heading font-mono">pieza_final_v3.gcode</p>
                    <p className="text-xs text-lyrup-text-muted">3h 42m · 87.4g PLA · 312 capas</p>
                  </div>
                </div>

                {/* Arrow + Processing */}
                <div className="flex items-center justify-center gap-2 text-lyrup-text-muted text-sm">
                  <div className="hero-processing-bar h-0.5 flex-1 rounded-full bg-lyrup-bg-subtle overflow-hidden">
                    <div className="h-full bg-lyrup-cyan rounded-full" style={{ animation: 'processing 2s ease-in-out infinite' }} />
                  </div>
                  <span className="shrink-0 text-xs text-lyrup-cyan font-mono">analizando...</span>
                  <div className="hero-processing-bar h-0.5 flex-1 rounded-full bg-lyrup-bg-subtle overflow-hidden">
                    <div className="h-full bg-lyrup-cyan rounded-full" style={{ animation: 'processing 2s ease-in-out infinite 0.3s' }} />
                  </div>
                </div>

                {/* Step 2: Cost breakdown */}
                <div className="flex flex-col gap-2 rounded-xl border border-lyrup-border bg-lyrup-bg-subtle p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-lyrup-text-muted">Desglose de costos</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: 'Filamento PLA', value: '$1.240' },
                      { label: 'Electricidad', value: '$380' },
                      { label: 'Depreciación', value: '$290' },
                      { label: 'Mano de obra', value: '$2.100' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs text-lyrup-text-secondary">{label}</span>
                        <span className="font-mono text-sm text-lyrup-text-heading">{value}</span>
                      </div>
                    ))}
                    <div className="mt-1 border-t border-lyrup-border pt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-lyrup-text-heading">Costo total</span>
                      <span className="font-mono text-base font-bold text-lyrup-cyan">$4.010</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-lyrup-text-heading">Precio sugerido (30%)</span>
                      <span className="font-mono text-base font-bold text-lyrup-success">$5.213</span>
                    </div>
                  </div>
                </div>

                {/* Step 3: PDF Export */}
                <div className="flex items-center gap-3 rounded-xl border border-lyrup-cyan/30 bg-lyrup-cyan/5 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lyrup-cyan/20 text-lg">
                    📋
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-lyrup-text-heading">Presupuesto listo para enviar</p>
                    <p className="text-xs text-lyrup-text-muted">PDF con tu logo · Compartir por WhatsApp</p>
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-lyrup-cyan text-lyrup-bg text-sm font-bold">
                    ↗
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes processing {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-processing-bar > div {
            animation: none !important;
            width: 100%;
            margin-left: 0;
          }
          .animate-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}
