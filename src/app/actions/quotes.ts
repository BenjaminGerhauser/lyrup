'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import {
  isValidStatus,
  validateQuoteCreate,
  validateQuoteMetadataUpdate,
  type QuoteCreateData,
  type QuoteItemInput,
  type QuoteMetadataUpdateData,
} from '@/lib/validation/quotes'
import type { Quote, QuoteItem, QuoteStatus, QuoteWithItems, Client } from '@/types/domain'

export type QuoteActionResult =
  | { success: true }
  | { success: false; error: string }

export type QuoteCreateResult =
  | { success: true; quote: Quote }
  | { success: false; error: string }

interface ListQuotesFilters {
  status?: QuoteStatus
  clientId?: string
  noClient?: boolean
  search?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// createQuote — inserts a quote + N items.
//
// Atomicity strategy (Sprint 2): INSERT quote, then INSERT items. If the items
// insert fails, manually DELETE the quote we just created. This is a
// compensating action, not a real DB transaction — a real transaction would
// require a Postgres RPC function (`create_quote_with_items`). If we see
// partial-state bugs in production, Sprint 3 should add that RPC.
// ---------------------------------------------------------------------------

export async function createQuote(data: QuoteCreateData): Promise<QuoteCreateResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const validation = validateQuoteCreate(data)
    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    const { data: quoteRow, error: quoteErr } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        title: data.title.trim(),
        client_id: data.client_id,
        notes: data.notes?.trim() || null,
        status: 'draft' as const,
      })
      .select('*')
      .single()

    if (quoteErr || !quoteRow) {
      console.error('createQuote insert quote error:', quoteErr)
      return { success: false, error: 'Error al crear la cotización. Intentá de nuevo.' }
    }

    const itemsPayload = data.items.map((it) => ({
      quote_id: quoteRow.id,
      description: it.description.trim(),
      quantity: it.quantity,
      unit_price_ars: it.unit_price_ars,
      subtotal_ars: round2(it.unit_price_ars * it.quantity),
      printer_id: it.printer_id ?? null,
      material_id: it.material_id ?? null,
      filament_g: it.filament_g ?? null,
      print_hours: it.print_hours ?? null,
      cost_breakdown: it.cost_breakdown
        ? (it.cost_breakdown as unknown as Record<string, number>)
        : null,
      gcode_filename: it.gcode_filename ?? null,
    }))

    const { error: itemsErr } = await supabase
      .from('quote_items')
      .insert(itemsPayload)

    if (itemsErr) {
      console.error('createQuote insert items error:', itemsErr)
      // Compensating action: remove the orphan quote row we just created.
      await supabase.from('quotes').delete().eq('id', quoteRow.id).eq('user_id', user.id)
      return { success: false, error: 'Error al guardar los ítems de la cotización. Intentá de nuevo.' }
    }

    revalidatePath('/cotizaciones')
    revalidatePath('/cotizar')

    // The DB trigger trg_quotes_recompute_total has updated total_ars by now.
    return { success: true, quote: quoteRow as Quote }
  } catch (err) {
    console.error('createQuote unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// updateQuoteMetadata — title, client, notes only. Items are managed
// separately via updateQuoteItems.
// ---------------------------------------------------------------------------

export async function updateQuoteMetadata(
  id: string,
  data: QuoteMetadataUpdateData,
): Promise<QuoteActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const validation = validateQuoteMetadataUpdate(data)
    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    const { error } = await supabase
      .from('quotes')
      .update({
        title: data.title.trim(),
        client_id: data.client_id,
        notes: data.notes?.trim() || null,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateQuoteMetadata error:', error)
      return { success: false, error: 'Error al actualizar la cotización. Intentá de nuevo.' }
    }

    revalidatePath('/cotizaciones')
    revalidatePath(`/cotizaciones/${id}`)
    return { success: true }
  } catch (err) {
    console.error('updateQuoteMetadata unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// updateQuoteItems — replace ALL items of a quote (delete + insert).
// The trigger trg_quotes_recompute_total will recompute total_ars.
// ---------------------------------------------------------------------------

export async function updateQuoteItems(
  quoteId: string,
  items: QuoteItemInput[],
): Promise<QuoteActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    // Verify the quote belongs to the user (RLS would block otherwise, but the
    // explicit check yields a friendlier error path).
    const { data: existing, error: existingErr } = await supabase
      .from('quotes')
      .select('id')
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single()
    if (existingErr || !existing) {
      return { success: false, error: 'Cotización no encontrada' }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: 'La cotización debe tener al menos un ítem' }
    }
    for (let i = 0; i < items.length; i++) {
      const { validateQuoteItem } = await import('@/lib/validation/quotes')
      const r = validateQuoteItem(items[i], i)
      if ('error' in r) return { success: false, error: r.error }
    }

    const { error: delErr } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId)
    if (delErr) {
      console.error('updateQuoteItems delete error:', delErr)
      return { success: false, error: 'Error al actualizar los ítems. Intentá de nuevo.' }
    }

    const payload = items.map((it) => ({
      quote_id: quoteId,
      description: it.description.trim(),
      quantity: it.quantity,
      unit_price_ars: it.unit_price_ars,
      subtotal_ars: round2(it.unit_price_ars * it.quantity),
      printer_id: it.printer_id ?? null,
      material_id: it.material_id ?? null,
      filament_g: it.filament_g ?? null,
      print_hours: it.print_hours ?? null,
      cost_breakdown: it.cost_breakdown
        ? (it.cost_breakdown as unknown as Record<string, number>)
        : null,
      gcode_filename: it.gcode_filename ?? null,
    }))

    const { error: insErr } = await supabase.from('quote_items').insert(payload)
    if (insErr) {
      console.error('updateQuoteItems insert error:', insErr)
      return { success: false, error: 'Error al guardar los ítems. Intentá de nuevo.' }
    }

    revalidatePath(`/cotizaciones/${quoteId}`)
    revalidatePath('/cotizaciones')
    return { success: true }
  } catch (err) {
    console.error('updateQuoteItems unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// updateQuoteStatus — for the inline status toggle (draft → sent → accepted/rejected).
// ---------------------------------------------------------------------------

export async function updateQuoteStatus(
  formData: FormData,
): Promise<QuoteActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    const rawStatus = formData.get('status')?.toString()
    if (!id) return { success: false, error: 'ID de cotización requerido' }
    if (!rawStatus || !isValidStatus(rawStatus)) {
      return { success: false, error: 'Estado de cotización inválido' }
    }

    const { error } = await supabase
      .from('quotes')
      .update({ status: rawStatus })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('updateQuoteStatus error:', error)
      return { success: false, error: 'Error al actualizar el estado. Intentá de nuevo.' }
    }

    revalidatePath('/cotizaciones')
    revalidatePath(`/cotizaciones/${id}`)
    return { success: true }
  } catch (err) {
    console.error('updateQuoteStatus unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// deleteQuote — CASCADE removes items via FK.
// ---------------------------------------------------------------------------

export async function deleteQuote(formData: FormData): Promise<QuoteActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    if (!id) return { success: false, error: 'ID de cotización requerido' }

    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteQuote error:', error)
      return { success: false, error: 'Error al eliminar la cotización. Intentá de nuevo.' }
    }

    revalidatePath('/cotizaciones')
    return { success: true }
  } catch (err) {
    console.error('deleteQuote unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

// ---------------------------------------------------------------------------
// Queries: getQuote, listQuotes
// ---------------------------------------------------------------------------

export async function getQuote(id: string): Promise<QuoteWithItems | null> {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !quote) {
    if (error && error.code !== 'PGRST116') {
      console.error('getQuote error:', error)
    }
    return null
  }

  const { data: items } = await supabase
    .from('quote_items')
    .select('*, printer:printers(id, name), material:materials(id, name)')
    .eq('quote_id', id)
    .order('created_at', { ascending: true })

  let client: Client | null = null
  if (quote.client_id) {
    const { data: c } = await supabase
      .from('clients')
      .select('*')
      .eq('id', quote.client_id)
      .eq('user_id', user.id)
      .single()
    client = (c as Client | null) ?? null
  }

  return {
    ...(quote as Quote),
    items: (items ?? []) as QuoteItem[],
    client,
  }
}

export async function listQuotes(
  filters: ListQuotesFilters = {},
): Promise<Quote[]> {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('quotes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.noClient) {
    query = query.is('client_id', null)
  } else if (filters.clientId) {
    query = query.eq('client_id', filters.clientId)
  }
  if (filters.search && filters.search.trim()) {
    query = query.ilike('title', `%${filters.search.trim()}%`)
  }

  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200)
  const offset = Math.max(filters.offset ?? 0, 0)
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) {
    console.error('listQuotes error:', error)
    return []
  }
  return (data ?? []) as Quote[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
