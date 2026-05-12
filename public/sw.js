/**
 * Lyrup Service Worker — Sprint 0
 *
 * Install-only service worker. No caching strategies are implemented in
 * Sprint 0 to avoid stale-asset issues during rapid iteration.
 * Asset caching will be added in Sprint 1 once the app shell stabilises.
 */

self.addEventListener('install', () => {
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Claim all open clients so the SW controls them from the first load
  event.waitUntil(self.clients.claim())
})

// No fetch handler — all requests pass through to the network unchanged.
