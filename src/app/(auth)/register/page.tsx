'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import type { AuthResult } from '@/app/actions/auth'
import { trackSignupComplete } from '@/lib/analytics/umami'

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AuthResult | null = null

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const [state, dispatch, isPending] = useActionState<AuthResult | null, FormData>(
    async (_prev: AuthResult | null, formData: FormData) => {
      const result = await signUp(formData)
      if (result && 'success' in result) {
        trackSignupComplete()
      }
      return result
    },
    initialState
  )

  const hasError = state && 'error' in state
  const isSuccess = state && 'success' in state

  return (
    <>
      <h1 className="text-xl font-heading font-semibold text-lyrup-text-heading mb-6 text-center">
        Creá tu cuenta
      </h1>

      {isSuccess ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg bg-lyrup-bg border border-lyrup-success/30 p-4 text-sm text-lyrup-success text-center"
        >
          ¡Listo! Revisá tu email para confirmar tu cuenta.
        </div>
      ) : (
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
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-lyrup-border bg-lyrup-bg px-3 py-2 text-sm text-lyrup-text placeholder:text-lyrup-text-muted focus:outline-none focus:ring-2 focus:ring-lyrup-cyan"
              placeholder="Mínimo 8 caracteres"
            />
            <p className="text-xs text-lyrup-text-muted">
              Debe tener mayúscula, minúscula, número y carácter especial.
            </p>
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
            {isPending ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
      )}

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-lyrup-text-secondary">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="text-lyrup-cyan hover:text-lyrup-cyan-hover transition-colors"
        >
          Ingresá
        </Link>
      </p>
    </>
  )
}
