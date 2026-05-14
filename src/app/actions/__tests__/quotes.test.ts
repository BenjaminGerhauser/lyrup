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

import {
  createQuote,
  updateQuoteMetadata,
  updateQuoteStatus,
  deleteQuote,
  listQuotes,
} from '../quotes'
import { revalidatePath } from 'next/cache'

const AUTH_USER = { id: 'user-1' }
const UUID = '00000000-0000-0000-0000-000000000001'

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

function validItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    description: 'Pieza A',
    quantity: 1,
    unit_price_ars: 5000,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// createQuote
// ---------------------------------------------------------------------------

describe('createQuote', () => {
  it('UNAUTHENTICATED if no user', async () => {
    setNoAuth()
    const r = await createQuote({ title: 'X', client_id: null, notes: null, items: [validItem()] })
    expect(r).toEqual({ success: false, error: 'UNAUTHENTICATED' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('validation error: empty title', async () => {
    setAuth()
    const r = await createQuote({ title: '', client_id: null, notes: null, items: [validItem()] })
    expect(r).toMatchObject({ success: false })
  })

  it('validation error: zero items', async () => {
    setAuth()
    const r = await createQuote({ title: 'X', client_id: null, notes: null, items: [] })
    expect(r).toMatchObject({ success: false })
    expect((r as { error: string }).error).toMatch(/ítem/i)
  })

  it('validation error: item quantity < 1', async () => {
    setAuth()
    const r = await createQuote({
      title: 'X',
      client_id: null,
      notes: null,
      items: [validItem({ quantity: 0 })],
    })
    expect(r).toMatchObject({ success: false })
  })

  it('happy path inserts quote then items', async () => {
    setAuth()
    const insertedQuote = { id: 'q-1', user_id: AUTH_USER.id, title: 'X', status: 'draft' }
    const singleQ = vi.fn().mockResolvedValue({ data: insertedQuote, error: null })
    const selectQ = vi.fn().mockReturnValue({ single: singleQ })
    const insertQ = vi.fn().mockReturnValue({ select: selectQ })

    const insertI = vi.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce({ insert: insertQ })
      .mockReturnValueOnce({ insert: insertI })

    const r = await createQuote({
      title: 'X',
      client_id: null,
      notes: 'algo',
      items: [validItem({ quantity: 2, unit_price_ars: 5000 })],
    })

    expect(r).toMatchObject({ success: true })
    expect(insertQ).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: AUTH_USER.id, title: 'X', status: 'draft' }),
    )
    expect(insertI).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          quote_id: 'q-1',
          quantity: 2,
          unit_price_ars: 5000,
          subtotal_ars: 10000,
        }),
      ]),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/cotizaciones')
  })

  it('rolls back quote when items insert fails (compensating action)', async () => {
    setAuth()
    const insertedQuote = { id: 'q-2', user_id: AUTH_USER.id, title: 'X', status: 'draft' }
    const singleQ = vi.fn().mockResolvedValue({ data: insertedQuote, error: null })
    const selectQ = vi.fn().mockReturnValue({ single: singleQ })
    const insertQ = vi.fn().mockReturnValue({ select: selectQ })

    const insertI = vi.fn().mockResolvedValue({ error: { message: 'items boom' } })

    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const del = vi.fn().mockReturnValue({ eq: eq1 })

    mockFrom
      .mockReturnValueOnce({ insert: insertQ })
      .mockReturnValueOnce({ insert: insertI })
      .mockReturnValueOnce({ delete: del })

    const r = await createQuote({
      title: 'X',
      client_id: null,
      notes: null,
      items: [validItem()],
    })

    expect(r).toMatchObject({ success: false })
    // Compensating delete fired
    expect(del).toHaveBeenCalled()
    expect(eq1).toHaveBeenCalledWith('id', 'q-2')
    expect(eq2).toHaveBeenCalledWith('user_id', AUTH_USER.id)
  })
})

// ---------------------------------------------------------------------------
// updateQuoteMetadata
// ---------------------------------------------------------------------------

describe('updateQuoteMetadata', () => {
  it('UNAUTHENTICATED if no user', async () => {
    setNoAuth()
    const r = await updateQuoteMetadata(UUID, { title: 'X', client_id: null, notes: null })
    expect(r).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('happy path scopes to user_id', async () => {
    setAuth()
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const update = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ update })

    const r = await updateQuoteMetadata(UUID, { title: 'New', client_id: null, notes: null })
    expect(r).toEqual({ success: true })
    expect(eq1).toHaveBeenCalledWith('id', UUID)
    expect(eq2).toHaveBeenCalledWith('user_id', AUTH_USER.id)
  })

  it('validation error: empty title', async () => {
    setAuth()
    const r = await updateQuoteMetadata(UUID, { title: '', client_id: null, notes: null })
    expect(r).toMatchObject({ success: false })
  })
})

// ---------------------------------------------------------------------------
// updateQuoteStatus
// ---------------------------------------------------------------------------

describe('updateQuoteStatus', () => {
  it('UNAUTHENTICATED if no user', async () => {
    setNoAuth()
    const r = await updateQuoteStatus(fd({ id: 'q1', status: 'sent' }))
    expect(r).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('missing id', async () => {
    setAuth()
    const r = await updateQuoteStatus(fd({ status: 'sent' }))
    expect(r).toMatchObject({ success: false })
  })

  it('invalid status', async () => {
    setAuth()
    const r = await updateQuoteStatus(fd({ id: 'q1', status: 'bogus' }))
    expect(r).toMatchObject({ success: false })
  })

  it('happy path for each valid status', async () => {
    setAuth()
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const update = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ update })

    for (const s of ['draft', 'sent', 'accepted', 'rejected']) {
      const r = await updateQuoteStatus(fd({ id: 'q1', status: s }))
      expect(r).toEqual({ success: true })
    }
    expect(update).toHaveBeenCalledTimes(4)
  })
})

// ---------------------------------------------------------------------------
// deleteQuote
// ---------------------------------------------------------------------------

describe('deleteQuote', () => {
  it('UNAUTHENTICATED if no user', async () => {
    setNoAuth()
    const r = await deleteQuote(fd({ id: 'q1' }))
    expect(r).toEqual({ success: false, error: 'UNAUTHENTICATED' })
  })

  it('happy path scopes to user_id', async () => {
    setAuth()
    const eq2 = vi.fn().mockResolvedValue({ error: null })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const del = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ delete: del })

    const r = await deleteQuote(fd({ id: 'q1' }))
    expect(r).toEqual({ success: true })
    expect(eq2).toHaveBeenCalledWith('user_id', AUTH_USER.id)
  })
})

// ---------------------------------------------------------------------------
// listQuotes
// ---------------------------------------------------------------------------

describe('listQuotes', () => {
  it('empty array when not authenticated', async () => {
    setNoAuth()
    const r = await listQuotes()
    expect(r).toEqual([])
  })

  it('applies status + client + search filters', async () => {
    setAuth()
    const finalResult = { data: [{ id: 'q1' }], error: null }

    // Build a chainable query that resolves at .range()
    const range = vi.fn().mockResolvedValue(finalResult)
    const ilike = vi.fn().mockReturnValue({ range })
    const eqClient = vi.fn().mockReturnValue({ ilike, range })
    const eqStatus = vi.fn().mockReturnValue({ eq: eqClient, ilike, range })
    const order = vi.fn().mockReturnValue({ eq: eqStatus, range })
    const eqUser = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq: eqUser })
    mockFrom.mockReturnValue({ select })

    const r = await listQuotes({ status: 'sent', clientId: 'c1', search: 'soporte' })

    expect(r).toEqual([{ id: 'q1' }])
    expect(eqUser).toHaveBeenCalledWith('user_id', AUTH_USER.id)
    expect(eqStatus).toHaveBeenCalledWith('status', 'sent')
    expect(eqClient).toHaveBeenCalledWith('client_id', 'c1')
    expect(ilike).toHaveBeenCalledWith('title', '%soporte%')
  })

  it('noClient filter uses is(client_id, null) and skips clientId', async () => {
    setAuth()
    const finalResult = { data: [{ id: 'q2' }], error: null }

    const range = vi.fn().mockResolvedValue(finalResult)
    const isClient = vi.fn().mockReturnValue({ range })
    const order = vi.fn().mockReturnValue({ is: isClient, range })
    const eqUser = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq: eqUser })
    mockFrom.mockReturnValue({ select })

    const r = await listQuotes({ noClient: true, clientId: 'should-be-ignored' })

    expect(r).toEqual([{ id: 'q2' }])
    expect(isClient).toHaveBeenCalledWith('client_id', null)
  })
})
