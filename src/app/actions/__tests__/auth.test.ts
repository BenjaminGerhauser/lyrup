import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must appear before any imports that use them
// ---------------------------------------------------------------------------

// Mock Supabase server-cookies client
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockResetPasswordForEmail = vi.fn()

const mockSupabaseClient = {
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
}

vi.mock('@/lib/supabase/server-cookies', () => ({
  createSupabaseServerClient: vi.fn(async () => mockSupabaseClient),
}))

// Mock next/navigation redirect — it throws NEXT_REDIRECT in real Next.js;
// here we let it resolve normally so callers handle it cleanly in tests.
const mockRedirect = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    // Simulate the NEXT_REDIRECT throw so our catch blocks re-throw correctly
    const err = new Error('NEXT_REDIRECT')
    throw err
  },
}))

// Mock proxy sanitizeRedirectTo — always returns its input if valid,
// else /dashboard. We use the real implementation via a simplified mock.
vi.mock('@/proxy', () => ({
  sanitizeRedirectTo: (value: string | null | undefined) => {
    if (!value || !value.startsWith('/')) return '/dashboard'
    if (value.startsWith('//')) return '/dashboard'
    const allowed = ['/dashboard', '/cotizar', '/cotizaciones', '/impresoras', '/materiales', '/configuracion', '/onboarding']
    if (!allowed.some((p) => value === p || value.startsWith(p + '/'))) return '/dashboard'
    return value
  },
}))

// Strip 'use server' directive effect
vi.mock('server-only', () => ({}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { signUp, signIn, signOut, sendPasswordResetEmail } from '../auth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    fd.set(k, v)
  }
  return fd
}

const VALID_EMAIL = 'user@example.com'
const VALID_PASSWORD = 'ValidPass1!'

// ---------------------------------------------------------------------------
// signUp tests
// ---------------------------------------------------------------------------

describe('signUp server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid email + password → { success: true }', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    const result = await signUp(makeFormData({ email: VALID_EMAIL, password: VALID_PASSWORD }))

    expect(result).toEqual({ success: true })
    expect(mockSignUp).toHaveBeenCalledWith({ email: VALID_EMAIL, password: VALID_PASSWORD })
  })

  it('invalid email format → { error: "..." } without calling Supabase', async () => {
    const result = await signUp(makeFormData({ email: 'notvalid', password: VALID_PASSWORD }))

    expect(result).toHaveProperty('error')
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('weak password → { error: "..." } without calling Supabase', async () => {
    const result = await signUp(makeFormData({ email: VALID_EMAIL, password: '123' }))

    expect(result).toHaveProperty('error')
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('duplicate email (already registered) → { error: "Email ya registrado" }', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered', code: 'user_already_exists' },
    })

    const result = await signUp(makeFormData({ email: VALID_EMAIL, password: VALID_PASSWORD }))

    expect(result).toEqual({ error: 'Email ya registrado' })
  })

  it('Supabase generic error → { error: "Error al registrarse..." }', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'Database error', code: '500' },
    })

    const result = await signUp(makeFormData({ email: VALID_EMAIL, password: VALID_PASSWORD }))

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('Error al registrarse')
  })
})

// ---------------------------------------------------------------------------
// signIn tests
// ---------------------------------------------------------------------------

describe('signIn server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid credentials → calls signInWithPassword and redirects to /dashboard', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await expect(
      signIn(makeFormData({ email: VALID_EMAIL, password: VALID_PASSWORD }))
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: VALID_EMAIL, password: VALID_PASSWORD })
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('valid credentials + redirectTo=/cotizar → redirects to /cotizar', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await expect(
      signIn(makeFormData({ email: VALID_EMAIL, password: VALID_PASSWORD, redirectTo: '/cotizar' }))
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/cotizar')
  })

  it('invalid credentials → { error: "Email o contraseña incorrectos" }', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
    })

    const result = await signIn(makeFormData({ email: VALID_EMAIL, password: 'WrongPass1!' }))

    expect(result).toEqual({ error: 'Email o contraseña incorrectos' })
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('missing password → { error: "La contraseña es obligatoria" }', async () => {
    const result = await signIn(makeFormData({ email: VALID_EMAIL, password: '' }))

    expect(result).toEqual({ error: 'La contraseña es obligatoria' })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('invalid email format → { error: "..." } without calling Supabase', async () => {
    const result = await signIn(makeFormData({ email: 'bad-email', password: VALID_PASSWORD }))

    expect(result).toHaveProperty('error')
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('open-redirect guard: redirectTo=https://evil.com → redirects to /dashboard', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    await expect(
      signIn(makeFormData({ email: VALID_EMAIL, password: VALID_PASSWORD, redirectTo: 'https://evil.com' }))
    ).rejects.toThrow('NEXT_REDIRECT')

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })
})

// ---------------------------------------------------------------------------
// signOut tests
// ---------------------------------------------------------------------------

describe('signOut server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successful signOut → calls signOut and redirects to /', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    await expect(signOut()).rejects.toThrow('NEXT_REDIRECT')

    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })

  it('signOut error → { error: "Error al cerrar sesión..." }', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Session error' } })

    const result = await signOut()

    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('Error al cerrar sesión')
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// sendPasswordResetEmail tests
// ---------------------------------------------------------------------------

describe('sendPasswordResetEmail server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid email → { success: true } and calls resetPasswordForEmail', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    const result = await sendPasswordResetEmail(makeFormData({ email: VALID_EMAIL }))

    expect(result).toEqual({ success: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      VALID_EMAIL,
      expect.objectContaining({ redirectTo: expect.any(String) })
    )
  })

  it('invalid email → { error: "..." } without calling Supabase', async () => {
    const result = await sendPasswordResetEmail(makeFormData({ email: 'notvalid' }))

    expect(result).toHaveProperty('error')
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('non-existent email still returns { success: true } (anti-enumeration)', async () => {
    // Supabase returns no error for non-existent emails (handled server-side)
    mockResetPasswordForEmail.mockResolvedValue({ error: null })

    const result = await sendPasswordResetEmail(makeFormData({ email: 'ghost@nowhere.com' }))

    expect(result).toEqual({ success: true })
  })

  it('Supabase error is swallowed → still returns { success: true }', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })

    // The action intentionally absorbs errors to prevent enumeration
    const result = await sendPasswordResetEmail(makeFormData({ email: VALID_EMAIL }))

    // success: true returned regardless (anti-enumeration)
    expect(result).toEqual({ success: true })
  })
})
