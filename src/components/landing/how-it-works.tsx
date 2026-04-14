const STEPS = [
  {
    number: '01',
    title: 'Configurá tu setup',
    description:
      'Agregá tu impresora, tus materiales y tu tarifa eléctrica. 5 minutos y listo.',
  },
  {
    number: '02',
    title: 'Subí tu G-code',
    description:
      'Arrastrá el archivo que exportaste del slicer. Lyrup hace el resto.',
  },
  {
    number: '03',
    title: 'Enviá el presupuesto',
    description:
      'Descargá el PDF o compartilo directo por WhatsApp. Tu cliente lo recibe en segundos.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="section-gradient py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-lyrup-cyan">
            Cómo funciona
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-lyrup-text-heading sm:text-4xl">
            Cotizá en 3 pasos
          </h2>
          <p className="mt-4 text-lg text-lyrup-text-secondary">
            De G-code a presupuesto profesional en menos de 2 minutos.
          </p>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="absolute left-1/2 top-14 hidden h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-lyrup-border to-transparent lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {STEPS.map(({ number, title, description }, index) => (
              <div
                key={number}
                className="relative flex flex-col items-center gap-4 text-center"
              >
                {/* Step number circle */}
                <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-lyrup-cyan bg-lyrup-bg">
                  <span className="font-mono text-xl font-bold text-lyrup-cyan">
                    {index + 1}
                  </span>
                </div>

                {/* Content card */}
                <div className="flex w-full flex-col gap-2 rounded-xl border border-lyrup-border bg-lyrup-bg-elevated p-6">
                  <h3 className="font-heading text-xl font-semibold text-lyrup-text-heading">
                    {title}
                  </h3>
                  <p className="text-lyrup-text-secondary">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
