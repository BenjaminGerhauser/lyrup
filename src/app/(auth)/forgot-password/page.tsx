'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { sendPasswordResetEmail } from '@/app/actions/auth'
import type { AuthResult } from '@/app/actions/auth'

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: AuthResult | null = null

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ForgotPasswordPage() {
  const [state, dispatch, isPending] = useActionState<AuthResult | null, FormData>(
    async (_prev: AuthResult | null, formData: FormData) =>
      sendPasswordResetEmail(formData),
    initialState
  )

  const isSuccess = state && 'success' in state
  const hasError = state && 'error' in state

  return (
    <>
      <h1 className="text-xl font-heading font-semibold text-lyrup-text-heading mb-2 text-center">
        Recuperá tu contraseña
      </h1>
      <p className="text-sm text-lyrup-text-secondary text-center mb-6">
        Ingresá tu email y te enviamos un link para restablecer tu contraseña.
      </p>

      {isSuccess ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg bg-lyrup-bg border border-lyrup-success/30 p-4 text-sm text-lyrup-success text-center"
        >
          Revisá tu bandeja — si el email está registrado vas a recibir el link.
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

          {/* Validation error only (network errors — anti-enumeration means no "email not found") */}
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
            {isPending ? 'Enviando…' : 'Enviar link de recuperación'}
          </button>
        </form>
      )}

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-lyrup-text-secondary">
        <Link
          href="/login"
          className="text-lyrup-cyan hover:text-lyrup-cyan-hover transition-colors"
        >
          ← Volver al inicio de sesión
        </Link>
      </p>
    </>
  )
}
