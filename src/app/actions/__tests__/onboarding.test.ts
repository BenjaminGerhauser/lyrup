import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must be defined BEFORE importing the module under test
// ---------------------------------------------------------------------------

const mockRpc = vi.fn()
const mockGetUser = vi.fn()
const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
  rpc: mockRpc,
}

vi.mock('@/lib/supabase/server-cookies', () => ({
  createSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// next/navigation redirect is a side-effect-only function.
// We capture calls to it to verify success path.
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

vi.mock('server-only', () => ({}))

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------

import { completeOnboarding } from '../onboarding'
import type { OnboardingDraft } from '@/types/domain'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_USER = { id: 'user-123', email: 'test@example.com' }

const VALID_DRAFT: OnboardingDraft = {
  business_name: 'Mi Negocio 3D',
  phone: '+54 9 351 000 0000',
  printer_model_id: 'printer-uuid-1',
  printer_name: 'Bambu Lab A1 Mini',
  filament_id: 'filament-uuid-1',
  filament_name: 'eSUN PLA Natural',
  province: 'Córdoba',
  electricity_rate_kwh: 88.4,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('completeOnboarding server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path — RPC called once with correct args, then redirect to /dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: VALID_USER }, error: null })
    mockRpc.mockResolvedValue({ error: null })

    await completeOnboarding(VALID_DRAFT)

    expect(mockRpc).toHaveBeenCalledOnce()
    expect(mockRpc).toHaveBeenCalledWith('complete_onboarding', {
      p_user_id: VALID_USER.id,
      p_business_name: VALID_DRAFT.business_name,
      p_phone: VALID_DRAFT.phone,
      p_province: VALID_DRAFT.province,
      p_electricity_rate_kwh: VALID_DRAFT.electricity_rate_kwh,
      p_printer_model_id: VALID_DRAFT.printer_model_id,
      p_printer_name: VALID_DRAFT.printer_name,
      p_filament_id: VALID_DRAFT.filament_id,
      p_filament_name: VALID_DRAFT.filament_name,
    })
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
  })

  it('unauthenticated user — returns { error } without calling RPC', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const result = await completeOnboarding(VALID_DRAFT)

    expect(result).toMatchObject({ error: expect.any(String) })
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('auth.getUser error — returns { error } without calling RPC', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' },
    })

    const result = await completeOnboarding(VALID_DRAFT)

    expect(result).toMatchObject({ error: expect.any(String) })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('RPC returns error — returns { error } discriminated union', async () => {
    mockGetUser.mockResolvedValue({ data: { user: VALID_USER }, error: null })
    mockRpc.mockResolvedValue({
      error: { message: 'function complete_onboarding() does not exist', code: '42883' },
    })

    const result = await completeOnboarding(VALID_DRAFT)

    expect(result).toMatchObject({ error: expect.any(String) })
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('empty phone (optional field) — passes null for p_phone to RPC', async () => {
    mockGetUser.mockResolvedValue({ data: { user: VALID_USER }, error: null })
    mockRpc.mockResolvedValue({ error: null })

    const draftNoPhone: OnboardingDraft = { ...VALID_DRAFT, phone: '' }
    await completeOnboarding(draftNoPhone)

    expect(mockRpc).toHaveBeenCalledWith(
      'complete_onboarding',
      expect.objectContaining({ p_phone: null })
    )
  })
})
