/**
 * Auth and form validation utilities.
 * Pure functions — no side effects, no external dependencies.
 */

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export type EmailErrorCode =
  | 'INVALID_EMAIL_FORMAT'
  | 'EMAIL_TOO_LONG'

export type PasswordErrorCode =
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_NO_UPPERCASE'
  | 'PASSWORD_NO_LOWERCASE'
  | 'PASSWORD_NO_DIGIT'
  | 'PASSWORD_NO_SPECIAL'

export type PhoneErrorCode =
  | 'PHONE_INVALID_FORMAT'

// ---------------------------------------------------------------------------
// Regexes
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_AR_REGEX = /^\+?549?\d{10}$|^\+?54\s?9?\s?\d{2,4}\s?\d{6,8}$/

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Validates an email address.
 * @returns error message string or null if valid
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim()

  if (trimmed.length > 254) {
    return 'El email es demasiado largo'
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return 'El formato del email no es válido'
  }

  return null
}

/**
 * Validates a password against Supabase default strength requirements.
 * Min 8 chars, at least one uppercase, lowercase, digit, and special char.
 * @returns error message string or null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres'
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una mayúscula'
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe contener al menos una minúscula'
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número'
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un carácter especial'
  }

  return null
}

/**
 * Validates an Argentine WhatsApp / phone number.
 * Accepts formats like: +5491112345678, 1112345678, +54 9 11 1234-5678
 * @returns error message string or null if valid
 */
export function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-().]/g, '')

  if (!PHONE_AR_REGEX.test(cleaned)) {
    return 'El número de WhatsApp no es válido (ej: +5491112345678)'
  }

  return null
}
