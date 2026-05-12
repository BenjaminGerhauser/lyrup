import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Cookie-based Supabase server client for user-scoped Server Components
 * and Server Actions. Uses the anon key + RLS for authorization.
 *
 * Do NOT use this for admin operations — use createAdminClient instead.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // The middleware handles session refresh so this is safe to ignore.
          }
        },
      },
    }
  )
}
