'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import type { AuthResult } from '@/app/actions/auth'

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AuthResult | null = null

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''

  const [state, dispatch, isPending] = useActionState<AuthResult | null, FormData>(
    async (_prev: AuthResult | null, formData: FormData) => {
      if (redirectTo) {
        formData.set('redirectTo', redirectTo)
      }
      return signIn(formData)
    },
    initialState
  )

  const hasError = state && 'error' in state

  return (
    <>
      <h1 className="text-xl font-heading font-semibold text-lyrup-text-heading mb-6 text-center">
        Ingresá a tu cuenta
      </h1>

      <form action={dispatch} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-lyrup-text-secondary"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-lyrup-border bg-lyrup-bg px-3 py-2 text-sm text-lyrup-text placeholder:text-lyrup-text-muted focus:outline-none focus:ring-2 focus:ring-lyrup-cyan"
            placeholder="vos@ejemplo.com"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-lyrup-text-secondary"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-lyrup-border bg-lyrup-bg px-3 py-2 text-sm text-lyrup-text placeholder:text-lyrup-text-muted focus:outline-none focus:ring-2 focus:ring-lyrup-cyan"
            placeholder="••••••••"
          />
        </div>

        {/* Error message */}
        {hasError && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-sm text-lyrup-error"
          >
            {(state as { error: string }).error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full rounded-lg bg-lyrup-cyan py-2 px-4 text-sm font-semibold text-lyrup-bg hover:bg-lyrup-cyan-hover disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-6 flex flex-col gap-2 text-center text-sm text-lyrup-text-secondary">
        <Link
          href="/forgot-password"
          className="hover:text-lyrup-cyan transition-colors"
        >
          Olvidé mi contraseña
        </Link>
        <span>
          ¿No tenés cuenta?{' '}
          <Link
            href="/register"
            className="text-lyrup-cyan hover:text-lyrup-cyan-hover transition-colors"
          >
            Registrate
          </Link>
        </span>
      </div>
    </>
  )
}
