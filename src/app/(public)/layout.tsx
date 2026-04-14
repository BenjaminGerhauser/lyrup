import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lyrup — Calculá cuánto cobrar tus impresiones 3D',
  description:
    'Subí tu G-code y en segundos tenés el costo real: filamento, electricidad, depreciación y mano de obra. Presupuesto profesional en PDF listo para enviar por WhatsApp.',
  openGraph: {
    title: 'Lyrup — Calculá cuánto cobrar tus impresiones 3D',
    description:
      'El cotizador inteligente para emprendedores de impresión 3D. Subí tu G-code, calculá el costo real, generá un presupuesto profesional.',
    images: ['/og-image.png'],
    url: 'https://lyrup.com',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: 'https://lyrup.com',
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Lyrup',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'ARS',
              name: 'Free',
            },
          }),
        }}
      />
      {children}
    </>
  )
}
