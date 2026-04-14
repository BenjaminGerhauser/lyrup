import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---- Module mocks -------------------------------------------------------

// Mock Supabase server client
const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))
const mockSupabaseClient = { from: mockFrom }

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}))

// Mock welcome email
vi.mock('@/lib/email/welcome', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}))

// 'use server' files can't be imported directly in jsdom without Next.js context.
// We need to strip the directive effect — vitest handles this via transform, but
// the 'use server' pragma may throw. We mock the server env to avoid it.
vi.mock('server-only', () => ({}))

// ---- Import AFTER mocks -------------------------------------------------

import { joinWaitlist } from '../waitlist'

// ---- Helpers ------------------------------------------------------------

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    fd.set(k, v)
  }
  return fd
}

// ---- Tests --------------------------------------------------------------

describe('joinWaitlist server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid email → { success: true } and calls Supabase insert', async () => {
    mockInsert.mockResolvedValue({ error: null })

    const result = await joinWaitlist(makeFormData({ email: 'user@example.com' }))

    expect(result).toEqual({ success: true })
    expect(mockFrom).toHaveBeenCalledWith('waitlist')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' })
    )
  })

  it('duplicate email (Supabase code 23505) → { error: "duplicate" }', async () => {
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

    const result = await joinWaitlist(makeFormData({ email: 'dupe@example.com' }))

    expect(result).toEqual({ error: 'duplicate' })
  })

  it('invalid email format → { error: "invalid_email" }', async () => {
    const result = await joinWaitlist(makeFormData({ email: 'not-valid' }))

    expect(result).toEqual({ error: 'invalid_email' })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('Supabase throws generic error → { error: "server_error" }', async () => {
    mockInsert.mockResolvedValue({ error: { code: '500', message: 'Internal error' } })

    const result = await joinWaitlist(makeFormData({ email: 'user@example.com' }))

    expect(result).toEqual({ error: 'server_error' })
  })

  it('UTM source override: utm_source in formData is used as source field', async () => {
    mockInsert.mockResolvedValue({ error: null })

    await joinWaitlist(
      makeFormData({ email: 'user@example.com', utm_source: 'twitter' })
    )

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'twitter' })
    )
  })
})
