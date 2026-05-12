import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must appear before any imports that use them
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
}

vi.mock('@/lib/supabase/server-cookies', () => ({
  createSupabaseServerClient: vi.fn(async () => mockSupabaseClient),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('server-only', () => ({}))

// ---------------------------------------------------------------------------
// Import SUT after mocks
// ---------------------------------------------------------------------------

import { updateConfig } from '../configuracion'
import { revalidatePath } from 'next/cache'

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

const AUTHENTICATED_USER = { id: 'user-123', email: 'user@example.com' }

function setupAuthenticatedUser() {
  mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER }, error: null })
}

function setupUnauthenticatedUser() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
}

const VALID_CONFIG = {
  business_name: 'Mi Negocio 3D',
  phone: '+54 9 351 000 0000',
  labor_rate_hour: '800',
  default_margin_percent: '100',
  default_labor_factor: '0.20',
  province: 'Córdoba',
  electricity_rate_kwh: '88.4',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('updateConfig server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: successful update chain
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('unauthenticated call → { success: false, error: "UNAUTHENTICATED" }', async () => {
    setupUnauthenticatedUser()

    const result = await updateConfig(makeFormData(VALID_CONFIG))

    expect(result).toEqual({ success: false, error: 'UNAUTHENTICATED' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('authenticated user with valid data → { success: true } + revalidatePath called', async () => {
    setupAuthenticatedUser()
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdateFn })

    const result = await updateConfig(makeFormData(VALID_CONFIG))

    expect(result).toEqual({ success: true })
    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        business_name: 'Mi Negocio 3D',
        labor_rate_hour: 800,
        default_margin_percent: 100,
        default_labor_factor: 0.20,
      })
    )
    expect(mockEq).toHaveBeenCalledWith('id', AUTHENTICATED_USER.id)
    expect(revalidatePath).toHaveBeenCalledWith('/configuracion')
  })

  it('missing business_name → { success: false, error: "..." } — DB not called', async () => {
    setupAuthenticatedUser()

    const result = await updateConfig(makeFormData({
      ...VALID_CONFIG,
      business_name: '',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('nombre del negocio')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('invalid labor_rate_hour (= 0) → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await updateConfig(makeFormData({
      ...VALID_CONFIG,
      labor_rate_hour: '0',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('mano de obra')
  })

  it('default_labor_factor out of range (= 0.50) → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await updateConfig(makeFormData({
      ...VALID_CONFIG,
      default_labor_factor: '0.50',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('factor de mano de obra')
  })

  it('Supabase update error → { success: false, error: "..." } — revalidatePath NOT called', async () => {
    setupAuthenticatedUser()
    const mockEq = vi.fn().mockResolvedValue({ error: { message: 'DB error', code: '500' } })
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdateFn })

    const result = await updateConfig(makeFormData(VALID_CONFIG))

    expect(result).toEqual({
      success: false,
      error: 'Error al guardar la configuración. Intentá de nuevo.',
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('negative default_margin_percent → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await updateConfig(makeFormData({
      ...VALID_CONFIG,
      default_margin_percent: '-10',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('margen')
  })
})
