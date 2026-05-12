import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './types'

export interface UpdateSessionResult {
  response: NextResponse
  supabase: SupabaseClient<Database>
  user: User | null
}

/**
 * Refreshes the Supabase session cookie and returns the verified user.
 * Must be called at the start of every middleware execution so tokens are
 * refreshed before any auth check is performed.
 *
 * @param request - Incoming NextRequest from middleware
 * @returns response (with updated Set-Cookie headers), supabase client, and user
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser contacts the Supabase Auth server — use this (not getSession)
  // for secure authorization checks.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, supabase, user }
}
