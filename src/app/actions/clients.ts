'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { validateClient } from '@/lib/validation/clients'
import type { Client } from '@/types/domain'

export type ClientActionResult =
  | { success: true }
  | { success: false; error: string }

export type ClientCreateResult =
  | { success: true; client: Client }
  | { success: false; error: string }

function readClientFields(formData: FormData) {
  return {
    name: formData.get('name')?.toString() ?? null,
    whatsapp: formData.get('whatsapp')?.toString() ?? null,
    email: formData.get('email')?.toString()?.trim() || null,
    notes: formData.get('notes')?.toString()?.trim() || null,
  }
}

export async function addClient(formData: FormData): Promise<ClientCreateResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const fields = readClientFields(formData)
    const validation = validateClient(fields)
    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: fields.name!.trim(),
        whatsapp: fields.whatsapp!.trim(),
        email: fields.email,
        notes: fields.notes,
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('addClient error:', error)
      return { success: false, error: 'Error al crear el cliente. Intentá de nuevo.' }
    }

    revalidatePath('/cotizar')
    revalidatePath('/cotizaciones')
    return { success: true, client: data as Client }
  } catch (err) {
    console.error('addClient unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

export async function editClient(formData: FormData): Promise<ClientActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    if (!id) {
      return { success: false, error: 'ID de cliente requerido' }
    }

    const fields = readClientFields(formData)
    const validation = validateClient(fields)
    if ('error' in validation) {
      return { success: false, error: validation.error }
    }

    const { error } = await supabase
      .from('clients')
      .update({
        name: fields.name!.trim(),
        whatsapp: fields.whatsapp!.trim(),
        email: fields.email,
        notes: fields.notes,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('editClient error:', error)
      return { success: false, error: 'Error al editar el cliente. Intentá de nuevo.' }
    }

    revalidatePath('/cotizar')
    revalidatePath('/cotizaciones')
    return { success: true }
  } catch (err) {
    console.error('editClient unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

export async function deleteClient(formData: FormData): Promise<ClientActionResult> {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'UNAUTHENTICATED' }
    }

    const id = formData.get('id')?.toString()
    if (!id) {
      return { success: false, error: 'ID de cliente requerido' }
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('deleteClient error:', error)
      return { success: false, error: 'Error al eliminar el cliente. Intentá de nuevo.' }
    }

    revalidatePath('/cotizar')
    revalidatePath('/cotizaciones')
    return { success: true }
  } catch (err) {
    console.error('deleteClient unexpected error:', err)
    return { success: false, error: 'Error del servidor. Intentá de nuevo.' }
  }
}

export async function listClients(): Promise<Client[]> {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('listClients error:', error)
    return []
  }

  return (data ?? []) as Client[]
}
