'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker on mount (client-only).
 * Renders nothing — purely a side-effect component.
 * Only runs when the browser supports service workers.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        // Non-fatal — app still works without SW
        console.warn('[PwaRegister] SW registration failed:', err)
      })
  }, [])

  return null
}
