'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { validateEmail, validatePassword } from '@/lib/auth/validation'
import { sanitizeRedirectTo } from '@/proxy'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthResult =
  | { success: true }
  | { error: string }

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  const emailError = validateEmail(email)
  if (emailError) {
    return { error: emailError }
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return { error: passwordError }
  }

  try {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already been registered') ||
        error.code === 'user_already_exists'
      ) {
        return { error: 'Email ya registrado' }
      }
      console.error('signUp error:', error)
      return { error: 'Error al registrarse. Intentá de nuevo.' }
    }

    return { success: true }
  } catch (err) {
    console.error('signUp unexpected error:', err)
    return { error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const redirectTo = formData.get('redirectTo')?.toString() ?? null

  const emailError = validateEmail(email)
  if (emailError) {
    return { error: emailError }
  }

  if (!password) {
    return { error: 'La contraseña es obligatoria' }
  }

  try {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (
        error.message.toLowerCase().includes('invalid login credentials') ||
        error.message.toLowerCase().includes('invalid credentials') ||
        error.code === 'invalid_credentials'
      ) {
        return { error: 'Email o contraseña incorrectos' }
      }
      console.error('signIn error:', error)
      return { error: 'Error al iniciar sesión. Intentá de nuevo.' }
    }

    const safeRedirect = sanitizeRedirectTo(redirectTo)
    redirect(safeRedirect)
  } catch (err) {
    // redirect() throws a NEXT_REDIRECT error — re-throw it
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err
    }
    console.error('signIn unexpected error:', err)
    return { error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('signOut error:', error)
      return { error: 'Error al cerrar sesión. Intentá de nuevo.' }
    }

    redirect('/')
  } catch (err) {
    // redirect() throws a NEXT_REDIRECT error — re-throw it
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err
    }
    console.error('signOut unexpected error:', err)
    return { error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// sendPasswordResetEmail
// ---------------------------------------------------------------------------

export async function sendPasswordResetEmail(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase() ?? ''

  const emailError = validateEmail(email)
  if (emailError) {
    return { error: emailError }
  }

  try {
    const supabase = await createSupabaseServerClient()

    // Anti-enumeration: call regardless of whether the email exists.
    // Errors are intentionally swallowed.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`,
    })

    return { success: true }
  } catch (err) {
    console.error('sendPasswordResetEmail unexpected error:', err)
    // Still return success to prevent user enumeration
    return { success: true }
  }
}
