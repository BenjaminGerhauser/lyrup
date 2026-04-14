const FEATURES = [
  {
    number: '01',
    title: 'Cotizador inteligente',
    description: 'Subí tu G-code de Cura, PrusaSlicer o BambuStudio y Lyrup hace el trabajo.',
    bullets: [
      'Parsea automáticamente: tiempo, gramos, capas',
      'Calcula el costo real con TU tarifa eléctrica, TU filamento, TU impresora',
      'Te sugiere precio de venta con el margen que vos quieras',
    ],
    badge: null,
  },
  {
    number: '02',
    title: 'Presupuesto profesional',
    description: 'Transmití confianza a tus clientes con documentación de nivel profesional.',
    bullets: [
      'PDF con tu logo y datos de contacto',
      'Compartilo por WhatsApp en un click',
      'Tu cliente recibe un presupuesto que da confianza',
    ],
    badge: null,
  },
  {
    number: '03',
    title: 'Todo lo que viene',
    description: 'Estamos construyendo el ecosistema completo para tu negocio 3D.',
    bullets: [
      'Gestión de pedidos con kanban',
      'Catálogo público con pagos via Mercado Pago',
      'Conexión con tu impresora (Klipper, BambuLab, OctoPrint)',
      'Analytics de rentabilidad por pieza, por impresora, por cliente',
    ],
    badge: 'Próximamente',
  },
]

export function Solution() {
  return (
    <section id="solucion" className="bg-lyrup-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-lyrup-cyan">
            La solución
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-lyrup-text-heading sm:text-4xl lg:text-5xl">
            Tu negocio de impresión 3D,{' '}
            <span className="text-lyrup-cyan">bajo control</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-lyrup-text-secondary">
            Desde la cotización hasta el cobro, Lyrup cubre todo el flujo de tu negocio.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:gap-12">
          {FEATURES.map(({ number, title, description, bullets, badge }) => (
            <div
              key={number}
              className="group relative flex flex-col gap-6 rounded-2xl border border-lyrup-border bg-lyrup-bg-elevated p-8 transition-colors hover:border-lyrup-cyan/40 lg:flex-row lg:items-start lg:gap-10"
            >
              <div className="shrink-0">
                <span className="font-mono text-5xl font-bold text-lyrup-cyan/20 group-hover:text-lyrup-cyan/40 transition-colors lg:text-6xl">
                  {number}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-heading text-2xl font-semibold text-lyrup-text-heading">
                    {title}
                  </h3>
                  {badge && (
                    <span className="rounded-full bg-lyrup-cyan/10 px-3 py-1 text-xs font-medium text-lyrup-cyan">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-lyrup-text-secondary">{description}</p>
                <ul className="flex flex-col gap-2">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-lyrup-text-secondary">
                      <span className="mt-0.5 shrink-0 text-lyrup-cyan">→</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
