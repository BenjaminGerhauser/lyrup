'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { joinWaitlist } from '@/app/actions/waitlist'
import { Loader2 } from 'lucide-react'

type FormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'duplicate' }
  | { status: 'invalid_email' }
  | { status: 'error' }

const initialState: FormState = { status: 'idle' }

interface WaitlistFormProps {
  utmSource?: string
  section?: 'hero' | 'cta'
}

export function WaitlistForm({ utmSource, section }: WaitlistFormProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = formRef.current
    if (!el || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return

    const sessionKey = `waitlist_form_view_fired_${section ?? 'default'}`
    if (sessionStorage.getItem(sessionKey)) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1')
            window.umami?.track('waitlist_form_view', { section: section ?? 'landing' })
          }
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [section])

  async function formAction(_prevState: FormState, formData: FormData): Promise<FormState> {
    setLocalError(null)
    const email = formData.get('email')?.toString().trim() ?? ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      setLocalError('Ingresá un email válido')
      return { status: 'invalid_email' }
    }

    if (utmSource) {
      formData.set('utm_source', utmSource)
    }

    const result = await joinWaitlist(formData)

    if ('success' in result) {
      if (typeof window !== 'undefined') {
        window.umami?.track('waitlist_submit', { source: utmSource ?? 'landing' })
      }
      return { status: 'success' }
    }

    if (result.error === 'duplicate') return { status: 'duplicate' }
    if (result.error === 'invalid_email') {
      setLocalError('Ingresá un email válido')
      return { status: 'invalid_email' }
    }
    return { status: 'error' }
  }

  const [state, dispatch, isPending] = useActionState(formAction, initialState)

  if (state.status === 'success') {
    return (
      <div ref={formRef} aria-live="polite" className="rounded-xl border border-lyrup-border bg-lyrup-bg-elevated p-6 text-center">
        <p className="text-lg font-medium text-lyrup-text-heading">
          ¡Listo! Te avisamos cuando abramos.
        </p>
        <p className="mt-1 text-sm text-lyrup-text-secondary">
          Revisá tu bandeja de entrada — te mandamos un email de confirmación.
        </p>
      </div>
    )
  }

  if (state.status === 'duplicate') {
    return (
      <div ref={formRef} aria-live="polite" className="rounded-xl border border-lyrup-border bg-lyrup-bg-elevated p-6 text-center">
        <p className="text-lg font-medium text-lyrup-text-heading">
          Ya estás en la lista. Te avisamos cuando abramos.
        </p>
        <p className="mt-1 text-sm text-lyrup-text-secondary">
          Estás anotado. No te preocupes, sos el primero en saber.
        </p>
      </div>
    )
  }

  return (
    <div ref={formRef}>
      <form action={dispatch} className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-col gap-1.5">
          <Input
            ref={emailRef}
            type="email"
            name="email"
            placeholder="tu@email.com"
            aria-label="Tu dirección de email"
            readOnly={isPending}
            className="h-11 border-lyrup-border bg-lyrup-bg-subtle text-lyrup-text placeholder:text-lyrup-text-muted focus-visible:border-lyrup-cyan focus-visible:ring-lyrup-cyan/20 text-base"
            required
          />
          {localError && (
            <p className="text-sm text-lyrup-error" aria-live="polite">
              {localError}
            </p>
          )}
          {state.status === 'error' && (
            <p className="text-sm text-lyrup-error" aria-live="polite">
              Algo falló. Intentá de nuevo en un momento.
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 shrink-0 bg-lyrup-cyan px-6 text-lyrup-bg font-semibold hover:bg-lyrup-cyan-hover disabled:opacity-60 text-base"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Quiero acceso anticipado'
          )}
        </Button>
      </form>
    </div>
  )
}
