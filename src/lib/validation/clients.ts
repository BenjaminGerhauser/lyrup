/**
 * Pure validation functions for client CRUD forms.
 * No Zod, no throws — returns discriminated union { valid: true } | { error: string }.
 *
 * Matches the DB CHECK constraints on `public.clients`:
 *   whatsapp ~ '^[0-9+\s()\-]+$'
 *   email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
 */

export interface ClientData {
  name: string | null
  whatsapp: string | null
  email: string | null
  notes: string | null
}

export type ValidationResult = { valid: true } | { error: string }

const WHATSAPP_RE = /^[0-9+\s()\-]+$/
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function validateClient(data: ClientData): ValidationResult {
  const name = data.name?.trim() ?? ''
  if (!name) {
    return { error: 'El nombre del cliente es obligatorio' }
  }
  if (name.length > 100) {
    return { error: 'El nombre no puede superar los 100 caracteres' }
  }

  const whatsapp = data.whatsapp?.trim() ?? ''
  if (!whatsapp) {
    return { error: 'El WhatsApp del cliente es obligatorio' }
  }
  if (!WHATSAPP_RE.test(whatsapp)) {
    return {
      error:
        'El WhatsApp solo admite números, espacios, +, ( ) y -. Ej: +54 9 11 1234-5678',
    }
  }
  const digits = whatsapp.replace(/[^0-9]/g, '')
  if (digits.length < 8) {
    return { error: 'El WhatsApp debe tener al menos 8 dígitos' }
  }
  if (digits.length > 20) {
    return { error: 'El WhatsApp no puede tener más de 20 dígitos' }
  }

  const email = data.email?.trim() ?? ''
  if (email && !EMAIL_RE.test(email)) {
    return { error: 'El email no es válido' }
  }

  const notes = data.notes ?? ''
  if (notes.length > 500) {
    return { error: 'Las notas no pueden superar los 500 caracteres' }
  }

  return { valid: true }
}
