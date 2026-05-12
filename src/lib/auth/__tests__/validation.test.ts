import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validatePhone } from '../validation'

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  it('valid email → null (no error)', () => {
    expect(validateEmail('user@example.com')).toBeNull()
  })

  it('valid email with subdomain → null', () => {
    expect(validateEmail('user@mail.example.com')).toBeNull()
  })

  it('valid email with plus alias → null', () => {
    expect(validateEmail('user+tag@example.com')).toBeNull()
  })

  it('trims whitespace before validating', () => {
    expect(validateEmail('  user@example.com  ')).toBeNull()
  })

  it('no @ sign → error message', () => {
    expect(validateEmail('notanemail')).toBe('El formato del email no es válido')
  })

  it('no domain → error message', () => {
    expect(validateEmail('user@')).toBe('El formato del email no es válido')
  })

  it('no TLD or TLD too short → error message', () => {
    expect(validateEmail('user@example.c')).toBe('El formato del email no es válido')
  })

  it('spaces in email → error message', () => {
    expect(validateEmail('user @example.com')).toBe('El formato del email no es válido')
  })

  it('empty string → error message', () => {
    expect(validateEmail('')).toBe('El formato del email no es válido')
  })

  it('email longer than 254 chars → "demasiado largo" error', () => {
    const longLocal = 'a'.repeat(250)
    expect(validateEmail(`${longLocal}@b.com`)).toBe('El email es demasiado largo')
  })

  it('exactly 254 chars → null (valid boundary)', () => {
    // local(248) + @ + b.com(5) = 254 chars total
    const local = 'a'.repeat(248)
    expect(validateEmail(`${local}@b.com`)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validatePassword
// ---------------------------------------------------------------------------

describe('validatePassword', () => {
  it('strong password → null (no error)', () => {
    expect(validatePassword('ValidPass1!')).toBeNull()
  })

  it('exactly 8 chars with all requirements → null', () => {
    expect(validatePassword('Abc1!xyz')).toBeNull()
  })

  it('too short (7 chars) → "al menos 8 caracteres" error', () => {
    expect(validatePassword('Abc1!xy')).toBe('La contraseña debe tener al menos 8 caracteres')
  })

  it('empty string → "al menos 8 caracteres" error (length < 8)', () => {
    expect(validatePassword('')).toBe('La contraseña debe tener al menos 8 caracteres')
  })

  it('no uppercase → "al menos una mayúscula" error', () => {
    expect(validatePassword('validpass1!')).toBe('La contraseña debe contener al menos una mayúscula')
  })

  it('no lowercase → "al menos una minúscula" error', () => {
    expect(validatePassword('VALIDPASS1!')).toBe('La contraseña debe contener al menos una minúscula')
  })

  it('no digit → "al menos un número" error', () => {
    expect(validatePassword('ValidPass!')).toBe('La contraseña debe contener al menos un número')
  })

  it('no special char → "al menos un carácter especial" error', () => {
    expect(validatePassword('ValidPass1')).toBe('La contraseña debe contener al menos un carácter especial')
  })

  it('long valid password with many special chars → null', () => {
    expect(validatePassword('SuperStr0ng!@#$Password')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validatePhone
// ---------------------------------------------------------------------------

describe('validatePhone', () => {
  it('+5491112345678 → null (valid AR mobile)', () => {
    expect(validatePhone('+5491112345678')).toBeNull()
  })

  it('+54 9 11 1234 5678 (spaces) → null', () => {
    expect(validatePhone('+54 9 11 1234 5678')).toBeNull()
  })

  it('+5493512345678 (Córdoba) → null', () => {
    expect(validatePhone('+5493512345678')).toBeNull()
  })

  it('+549351 000 0000 → null', () => {
    expect(validatePhone('+549351 000 0000')).toBeNull()
  })

  it('empty string → error message', () => {
    expect(validatePhone('')).toBe('El número de WhatsApp no es válido (ej: +5491112345678)')
  })

  it('random text → error message', () => {
    expect(validatePhone('hello world')).toBe('El número de WhatsApp no es válido (ej: +5491112345678)')
  })

  it('US number → error message (not AR format)', () => {
    expect(validatePhone('+15551234567')).toBe('El número de WhatsApp no es válido (ej: +5491112345678)')
  })

  it('too short number → error message', () => {
    expect(validatePhone('1234')).toBe('El número de WhatsApp no es válido (ej: +5491112345678)')
  })

  it('strips hyphens and parens before validating', () => {
    // Hyphens/parens are cleaned per the implementation
    expect(validatePhone('+549-11-1234-5678')).toBeNull()
  })
})
