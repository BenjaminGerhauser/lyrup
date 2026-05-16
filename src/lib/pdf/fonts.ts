/**
 * src/lib/pdf/fonts.ts
 * Registers Inter (Regular + Bold) TTFs with @react-pdf/renderer.
 *
 * react-pdf caches font registrations by family name — calling Font.register
 * multiple times with the same family is a no-op after the first call.
 *
 * If the TTF files are absent (e.g. local dev without font download), react-pdf
 * will silently fall back to its built-in Helvetica — the PDF still generates,
 * just without the Inter typeface. We log a console.warn once to aid debugging.
 *
 * Font files live under public/fonts/inter/ and are served as static assets.
 * react-pdf fetches them at generation time via the absolute path.
 */

import { Font } from '@react-pdf/renderer'

let registered = false

export function registerFonts(): void {
  if (registered) return

  // In Node (SSR / vitest with jsdom), `/fonts/inter/...` resolves to the OS root,
  // not to public/. Skip registration so react-pdf falls back to built-in Helvetica.
  // Detect Node via process.versions.node — works even when jsdom defines window.
  const isNode =
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null
  if (isNode) {
    registered = true
    return
  }

  try {
    Font.register({
      family: 'Inter',
      fonts: [
        { src: '/fonts/inter/Inter-Regular.ttf', fontWeight: 400 },
        { src: '/fonts/inter/Inter-Bold.ttf', fontWeight: 700 },
      ],
    })
    registered = true
  } catch (err) {
    console.warn('[pdf/fonts] Failed to register Inter fonts — falling back to Helvetica.', err)
  }
}
