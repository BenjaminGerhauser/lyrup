'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UseUserResult {
  user: User | null
  loading: boolean
  error: string | null
}

/**
 * Client hook that returns the currently authenticated Supabase user.
 * Initial state: loading=true, user=null, error=null.
 * After resolution: loading=false.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    supabase.auth
      .getUser()
      .then(({ data, error: authError }) => {
        if (authError) {
          setError(authError.message)
        } else {
          setUser(data.user)
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { user, loading, error }
}
