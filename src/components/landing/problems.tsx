import { Calculator, MessageSquare, BarChart3 } from 'lucide-react'

const PROBLEMS = [
  {
    icon: Calculator,
    title: 'No sabés cuánto cobrar',
    description:
      'Calculás a ojo o con una planilla que no actualizás hace 6 meses. Perdés plata en cada pieza sin darte cuenta.',
  },
  {
    icon: MessageSquare,
    title: 'Tus pedidos son un quilombo',
    description:
      'Presupuestos por WhatsApp, seguimiento en la cabeza, entregas que se te pasan. No escala.',
  },
  {
    icon: BarChart3,
    title: 'No sabés si tu negocio rinde',
    description:
      'No tenés idea cuánto gasta cada impresora, cuál es tu margen real, ni si te conviene seguir.',
  },
]

export function Problems() {
  return (
    <section
      id="problema"
      className="section-gradient py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-lyrup-cyan">
            El problema
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-lyrup-text-heading sm:text-4xl">
            ¿Te suena familiar?
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PROBLEMS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex flex-col gap-4 rounded-xl border border-lyrup-border bg-lyrup-bg-elevated p-6 transition-colors hover:border-lyrup-cyan/50"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-lyrup-bg-subtle text-lyrup-cyan transition-colors group-hover:bg-lyrup-cyan/10">
                <Icon className="size-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-xl font-semibold text-lyrup-text-heading">
                  {title}
                </h3>
                <p className="leading-relaxed text-lyrup-text-secondary">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
