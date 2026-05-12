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

import { addMaterial, editMaterial, deleteMaterial } from '../materials'
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

// ---------------------------------------------------------------------------
// addMaterial tests
// ---------------------------------------------------------------------------

describe('addMaterial server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  it('unauthenticated call → { success: false, error: "UNAUTHENTICATED" }', async () => {
    setupUnauthenticatedUser()

    const result = await addMaterial(makeFormData({
      material_type: 'PLA',
      price_per_kg: '8500',
      ref_filament_id: 'filament-1',
    }))

    expect(result).toEqual({ success: false, error: 'UNAUTHENTICATED' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('authenticated user with valid ref-catalog data → { success: true }', async () => {
    setupAuthenticatedUser()
    const mockInsertFn = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsertFn })

    const result = await addMaterial(makeFormData({
      ref_filament_id: 'filament-uuid-1',
      material_type: 'PLA',
      price_per_kg: '8500',
      color_hex: '#FF0000',
      custom_name: 'Mi PLA rojo',
    }))

    expect(result).toEqual({ success: true })
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: AUTHENTICATED_USER.id,
        filament_id: 'filament-uuid-1',
        material_type: 'PLA',
        price_per_kg_ars: 8500,
        color: '#FF0000',
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/materiales')
  })

  it('missing material_type → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await addMaterial(makeFormData({
      ref_filament_id: 'filament-1',
      price_per_kg: '8500',
      // No material_type
    }))

    expect(result).toHaveProperty('success', false)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('tipo de material')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('price_per_kg = 0 → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await addMaterial(makeFormData({
      ref_filament_id: 'filament-1',
      material_type: 'PLA',
      price_per_kg: '0',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('mayor a cero')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('manual entry without name → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await addMaterial(makeFormData({
      // No ref_filament_id = manual entry
      material_type: 'ABS',
      price_per_kg: '9000',
      // No manual_name
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('nombre')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('Supabase insert error → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()
    const mockInsertFn = vi.fn().mockResolvedValue({ error: { message: 'DB error', code: '500' } })
    mockFrom.mockReturnValue({ insert: mockInsertFn })

    const result = await addMaterial(makeFormData({
      ref_filament_id: 'filament-1',
      material_type: 'PLA',
      price_per_kg: '8500',
    }))

    expect(result).toEqual({ success: false, error: 'Error al agregar el material. Intentá de nuevo.' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// editMaterial tests
// ---------------------------------------------------------------------------

describe('editMaterial server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })
  })

  it('unauthenticated call → { success: false, error: "UNAUTHENTICATED" }', async () => {
    setupUnauthenticatedUser()

    const result = await editMaterial(makeFormData({
      id: 'material-1',
      price_per_kg: '9000',
    }))

    expect(result).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('authenticated user with valid data → { success: true }', async () => {
    setupAuthenticatedUser()
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ update: mockUpdateFn })

    const result = await editMaterial(makeFormData({
      id: 'material-1',
      price_per_kg: '9000',
      custom_name: 'PLA Premium',
      color_hex: '#0000FF',
    }))

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/materiales')
  })

  it('invalid price → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await editMaterial(makeFormData({
      id: 'material-1',
      price_per_kg: '-100',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('mayor a cero')
  })

  it('missing id → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await editMaterial(makeFormData({
      price_per_kg: '9000',
      // No id
    }))

    expect(result).toHaveProperty('success', false)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// deleteMaterial tests
// ---------------------------------------------------------------------------

describe('deleteMaterial server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })
  })

  it('unauthenticated call → { success: false, error: "UNAUTHENTICATED" }', async () => {
    setupUnauthenticatedUser()

    const result = await deleteMaterial(makeFormData({ id: 'material-1' }))

    expect(result).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('authenticated user with valid id → { success: true }', async () => {
    setupAuthenticatedUser()
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ delete: mockDeleteFn })

    const result = await deleteMaterial(makeFormData({ id: 'material-1' }))

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/materiales')
  })

  it('missing id → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await deleteMaterial(makeFormData({}))

    expect(result).toHaveProperty('success', false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('Supabase delete error → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()
    const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ delete: mockDeleteFn })

    const result = await deleteMaterial(makeFormData({ id: 'material-1' }))

    expect(result).toEqual({ success: false, error: 'Error al eliminar el material. Intentá de nuevo.' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('Supabase error on delete also prevents revalidate', async () => {
    setupAuthenticatedUser()
    const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'Foreign key violation' } })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ delete: mockDeleteFn })

    await deleteMaterial(makeFormData({ id: 'material-2' }))

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
