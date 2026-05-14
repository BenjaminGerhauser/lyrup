import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
}

vi.mock('@/lib/supabase/server-cookies', () => ({
  createSupabaseServerClient: vi.fn(async () => mockSupabaseClient),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('server-only', () => ({}))

import { addClient, editClient, deleteClient, listClients } from '../clients'
import { revalidatePath } from 'next/cache'

const AUTH_USER = { id: 'user-1', email: 'u@example.com' }

function fd(fields: Record<string, string>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}

function setAuth() {
  mockGetUser.mockResolvedValue({ data: { user: AUTH_USER }, error: null })
}
function setNoAuth() {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// addClient
// ---------------------------------------------------------------------------

describe('addClient', () => {
  it('UNAUTHENTICATED if no user', async () => {
    setNoAuth()
    const r = await addClient(fd({ name: 'X', whatsapp: '12345678' }))
    expect(r).toEqual({ success: false, error: 'UNAUTHENTICATED' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('validation error: empty name', async () => {
    setAuth()
    const r = await addClient(fd({ name: '', whatsapp: '12345678' }))
    expect(r).toMatchObject({ success: false })
    expect((r as { error: string }).error).toMatch(/nombre/i)
  })

  it('validation error: empty whatsapp', async () => {
    setAuth()
    const r = await addClient(fd({ name: 'Juan' }))
    expect(r).toMatchObject({ success: false })
    expect((r as { error: string }).error).toMatch(/whatsapp/i)
  })

  it('validation error: invalid whatsapp chars', async () => {
    setAuth()
    const r = await addClient(fd({ name: 'Juan', whatsapp: '+54 ABC' }))
    expect(r).toMatchObject({ success: false })
  })

  it('validation error: invalid email format', async () => {
    setAuth()
    const r = await addClient(fd({ name: 'Juan', whatsapp: '+54 9 11 12345678', email: 'not-an-email' }))
    expect(r).toMatchObject({ success: false })
    expect((r as { error: string }).error).toMatch(/email/i)
  })

  it('inserts and returns the new client', async () => {
    setAuth()
    const newRow = { id: 'cli-1', user_id: AUTH_USER.id, name: 'Juan', whatsapp: '+5491112345678', email: null, notes: null }
    const single = vi.fn().mockResolvedValue({ data: newRow, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ insert })

    const r = await addClient(fd({ name: 'Juan', whatsapp: '+5491112345678' }))
    expect(r).toEqual({ success: true, client: newRow })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: AUTH_USER.id, name: 'Juan', whatsapp: '+5491112345678' }),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/cotizar')
    expect(revalidatePath).toHaveBeenCalledWith('/cotizaciones')
  })

  it('DB error returns generic friendly error', async () => {
    setAuth()
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ insert })

    const r = await addClient(fd({ name: 'Juan', whatsapp: '+5491112345678' }))
    expect(r).toMatchObject({ success: false })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// editClient
// ---------------------------------------------------------------------------

describe('editClient', () => {
  it('UNAUTHENTICATED if no user', async () => {
    setNoAuth()
    const r = await editClient(fd({ id: 'c1', name: 'X', whatsapp: '12345678' }))
    expect(r).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('missing id', async () => {
    setAuth()
    const r = await editClient(fd({ name: 'X', whatsapp: '12345678' }))
    expect(r).toMatchObject({ success: false })
    expect((r as { error: string }).error).toMatch(/ID/i)
  })

  it('happy path scopes to user_id', async () => {
    setAuth()
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const update = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ update })

    const r = await editClient(fd({ id: 'c1', name: 'Juan', whatsapp: '12345678' }))
    expect(r).toEqual({ success: true })
    expect(eq1).toHaveBeenCalledWith('id', 'c1')
    expect(eq2).toHaveBeenCalledWith('user_id', AUTH_USER.id)
  })
})

// ---------------------------------------------------------------------------
// deleteClient
// ---------------------------------------------------------------------------

describe('deleteClient', () => {
  it('UNAUTHENTICATED if no user', async () => {
    setNoAuth()
    const r = await deleteClient(fd({ id: 'c1' }))
    expect(r).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('missing id', async () => {
    setAuth()
    const r = await deleteClient(fd({}))
    expect(r).toMatchObject({ success: false })
  })

  it('happy path scopes to user_id', async () => {
    setAuth()
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const del = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ delete: del })

    const r = await deleteClient(fd({ id: 'c1' }))
    expect(r).toEqual({ success: true })
    expect(eq2).toHaveBeenCalledWith('user_id', AUTH_USER.id)
  })
})

// ---------------------------------------------------------------------------
// listClients
// ---------------------------------------------------------------------------

describe('listClients', () => {
  it('empty array when not authenticated', async () => {
    setNoAuth()
    const r = await listClients()
    expect(r).toEqual([])
  })

  it('returns rows ordered by name', async () => {
    setAuth()
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'a' }, { id: 'b' }], error: null })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ select })

    const r = await listClients()
    expect(r).toEqual([{ id: 'a' }, { id: 'b' }])
    expect(eq).toHaveBeenCalledWith('user_id', AUTH_USER.id)
    expect(order).toHaveBeenCalledWith('name', { ascending: true })
  })
})
