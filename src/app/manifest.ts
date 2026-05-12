import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lyrup',
    short_name: 'Lyrup',
    description: 'Cotizador inteligente para impresores 3D',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#0B0F1A',
    theme_color: '#06B6D4',
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
