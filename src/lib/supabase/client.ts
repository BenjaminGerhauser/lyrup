import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Browser-side Supabase client using the anon key.
 * Safe to call in Client Components — no server-only APIs used.
 * Call once per module (createBrowserClient handles singleton internally).
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
