import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Module mocks — must appear before any imports that use them
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

// Chainable query builder mocks
const makeChain = (fn: ReturnType<typeof vi.fn>) => ({
  eq: vi.fn().mockReturnThis(),
  then: fn,
  // Allow await by making it a thenable
})

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

import { addPrinter, editPrinter, deletePrinter } from '../printers'
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
// addPrinter tests
// ---------------------------------------------------------------------------

describe('addPrinter server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: successful insert
    mockFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  it('unauthenticated call → { success: false, error: "UNAUTHENTICATED" }', async () => {
    setupUnauthenticatedUser()

    const result = await addPrinter(makeFormData({
      ref_model_id: 'model-1',
      purchase_price: '150000',
    }))

    expect(result).toEqual({ success: false, error: 'UNAUTHENTICATED' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('authenticated user with valid ref-model data → { success: true }', async () => {
    setupAuthenticatedUser()
    const mockInsertFn = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsertFn })

    const result = await addPrinter(makeFormData({
      ref_model_id: 'model-uuid-1',
      purchase_price: '150000',
      custom_name: 'Mi Ender 3',
    }))

    expect(result).toEqual({ success: true })
    expect(mockInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: AUTHENTICATED_USER.id,
        printer_model_id: 'model-uuid-1',
        purchase_price_ars: 150000,
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/impresoras')
  })

  it('missing purchase_price → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await addPrinter(makeFormData({
      ref_model_id: 'model-1',
      // No purchase_price
    }))

    expect(result).toHaveProperty('success', false)
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toContain('precio de compra')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('purchase_price = 0 → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await addPrinter(makeFormData({
      ref_model_id: 'model-1',
      purchase_price: '0',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('precio de compra')
  })

  it('manual entry without name → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await addPrinter(makeFormData({
      // No ref_model_id = manual entry
      purchase_price: '50000',
      // No manual_name
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('nombre')
  })

  it('Supabase insert error → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()
    const mockInsertFn = vi.fn().mockResolvedValue({ error: { message: 'DB error', code: '500' } })
    mockFrom.mockReturnValue({ insert: mockInsertFn })

    const result = await addPrinter(makeFormData({
      ref_model_id: 'model-1',
      purchase_price: '150000',
    }))

    expect(result).toEqual({ success: false, error: 'Error al agregar la impresora. Intentá de nuevo.' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// editPrinter tests
// ---------------------------------------------------------------------------

describe('editPrinter server action', () => {
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

    const result = await editPrinter(makeFormData({
      id: 'printer-1',
      purchase_price: '200000',
    }))

    expect(result).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('authenticated user with valid data → { success: true }', async () => {
    setupAuthenticatedUser()
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ update: mockUpdateFn })

    const result = await editPrinter(makeFormData({
      id: 'printer-1',
      purchase_price: '200000',
      custom_name: 'Ender 3 Personalizada',
    }))

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/impresoras')
  })

  it('invalid purchase_price → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await editPrinter(makeFormData({
      id: 'printer-1',
      purchase_price: '-100',
    }))

    expect(result).toHaveProperty('success', false)
    expect((result as { error: string }).error).toContain('precio de compra')
  })
})

// ---------------------------------------------------------------------------
// deletePrinter tests
// ---------------------------------------------------------------------------

describe('deletePrinter server action', () => {
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

    const result = await deletePrinter(makeFormData({ id: 'printer-1' }))

    expect(result).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('authenticated user with valid id → { success: true }', async () => {
    setupAuthenticatedUser()
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ delete: mockDeleteFn })

    const result = await deletePrinter(makeFormData({ id: 'printer-1' }))

    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/impresoras')
  })

  it('missing id → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()

    const result = await deletePrinter(makeFormData({}))

    expect(result).toHaveProperty('success', false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('Supabase delete error → { success: false, error: "..." }', async () => {
    setupAuthenticatedUser()
    const mockEq2 = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEq1 })
    mockFrom.mockReturnValue({ delete: mockDeleteFn })

    const result = await deletePrinter(makeFormData({ id: 'printer-1' }))

    expect(result).toEqual({ success: false, error: 'Error al eliminar la impresora. Intentá de nuevo.' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
