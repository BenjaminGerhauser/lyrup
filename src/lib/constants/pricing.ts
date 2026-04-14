export interface PricingTier {
  name: string
  price: number
  currency: string
  period: string
  features: string[]
  highlighted: boolean
  badge?: string
}

export const TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    currency: 'ARS',
    period: 'mes',
    features: [
      '5 cotizaciones/mes',
      '1 impresora',
      'PDF con marca de agua',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 19900,
    currency: 'ARS',
    period: 'mes',
    features: [
      'Cotizaciones ilimitadas',
      '5 impresoras',
      'PDF con tu logo',
      'Gestion de pedidos',
      'Catalogo publico',
      'Mercado Pago',
    ],
    highlighted: true,
    badge: 'Mas popular',
  },
  {
    name: 'Farm',
    price: 49900,
    currency: 'ARS',
    period: 'mes',
    features: [
      'Cotizaciones ilimitadas',
      'Impresoras ilimitadas',
      'PDF con tu logo',
      'Gestion de pedidos',
      'Catalogo publico',
      'Mercado Pago',
      'Conexion firmware',
      'Analytics avanzados',
    ],
    highlighted: false,
  },
]
