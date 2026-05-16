/**
 * src/lib/analytics/umami.ts
 *
 * Typed wrapper around window.umami — the ONLY place in src/ that references
 * window.umami directly. All tracking in the app goes through the named
 * exports below. Adding a new event means adding a row to this file.
 *
 * No-op behaviour (isEnabled === false):
 *   - NEXT_PUBLIC_UMAMI_URL is absent or empty
 *   - NEXT_PUBLIC_UMAMI_WEBSITE_ID is absent or empty
 *   - NODE_ENV !== 'production'
 * This prevents dev/preview data from polluting the Umami dashboard.
 *
 * SSR safety: safeTrack guards with `typeof window !== 'undefined'` so this
 * module is safe to import in Server Components and Server Actions.
 *
 * No new runtime dependencies — uses only window.umami (declared in
 * src/types/umami.d.ts) and process.env (Next.js built-in).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all tracked event name strings — use this to avoid raw strings. */
export type UmamiEventName =
  | 'signup_complete'
  | 'onboarding_complete'
  | 'gcode_parsed'
  | 'quote_saved'
  | 'pdf_generated'
  | 'pdf_error'
  | 'whatsapp_clicked'
  | 'printer_added'
  | 'material_added'

/** Maps each event name to its expected property shape. */
export type UmamiEventProperties = {
  signup_complete: Record<string, never>
  onboarding_complete: Record<string, never>
  gcode_parsed: { printer_matched: boolean; material_matched: boolean }
  quote_saved: { item_count: number }
  pdf_generated: { item_count: number }
  pdf_error: Record<string, never>
  whatsapp_clicked: { has_phone: boolean }
  printer_added: Record<string, never>
  material_added: Record<string, never>
}

// ---------------------------------------------------------------------------
// Enabled check — computed once at module load, never per call.
// ---------------------------------------------------------------------------

/**
 * True only in production with both env vars set.
 * Exported so tests and call-site guards can inspect it without calling track.
 */
export const isEnabled: boolean =
  !!process.env.NEXT_PUBLIC_UMAMI_URL &&
  !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
  process.env.NODE_ENV === 'production'

// ---------------------------------------------------------------------------
// Internal guard — not exported
// ---------------------------------------------------------------------------

/**
 * Calls window.umami.track only when:
 *   1. isEnabled is true (env vars set + production)
 *   2. window is defined (SSR guard)
 *   3. window.umami exists (ad-blocker guard via optional chaining)
 *
 * Single-expression &&-chain: overhead when disabled is one boolean check.
 * No try/catch, no async, no DOM access.
 */
function safeTrack<N extends UmamiEventName>(
  name: N,
  props?: UmamiEventProperties[N],
): void {
  isEnabled &&
    typeof window !== 'undefined' &&
    window.umami?.track(name, props as Record<string, unknown> | undefined)
}

// ---------------------------------------------------------------------------
// Named event functions — one per event (9 total)
// ---------------------------------------------------------------------------

/** Fires when a user successfully submits the registration form.
 * NOTE: fires on form-submit success, NOT on Supabase email-confirmation click.
 * This is intentional — measures top-of-funnel form completion. */
export function trackSignupComplete(): void {
  safeTrack('signup_complete')
}

/** Fires client-side after completeOnboarding server action returns success,
 * before the redirect() throws NEXT_REDIRECT. */
export function trackOnboardingComplete(): void {
  safeTrack('onboarding_complete')
}

/** Fires after G-code parse+match completes, regardless of match outcome.
 * Both match states (true/false) are valid funnel signals. */
export function trackGcodeParsed(props: UmamiEventProperties['gcode_parsed']): void {
  safeTrack('gcode_parsed', props)
}

/** Fires after saveQuote server action returns success. */
export function trackQuoteSaved(props: UmamiEventProperties['quote_saved']): void {
  safeTrack('quote_saved', props)
}

/** Fires after URL.createObjectURL succeeds and download is triggered. */
export function trackPdfGenerated(props: UmamiEventProperties['pdf_generated']): void {
  safeTrack('pdf_generated', props)
}

/** Fires inside the catch block when PDF generation fails.
 * Does NOT include error message or stack trace — privacy-safe. */
export function trackPdfError(): void {
  safeTrack('pdf_error')
}

/** Fires in WhatsApp button onClick BEFORE the URL is opened.
 * Fires regardless of has_phone value — both cases are valid funnel signals. */
export function trackWhatsappClicked(props: UmamiEventProperties['whatsapp_clicked']): void {
  safeTrack('whatsapp_clicked', props)
}

/** Fires after addPrinter server action returns success (ADD only, not edit). */
export function trackPrinterAdded(): void {
  safeTrack('printer_added')
}

/** Fires after addMaterial server action returns success (ADD only, not edit). */
export function trackMaterialAdded(): void {
  safeTrack('material_added')
}
