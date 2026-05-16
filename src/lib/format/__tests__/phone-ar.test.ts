import { describe, it, expect } from 'vitest'
import { normalizeArWhatsApp } from '../phone-ar'

// ---------------------------------------------------------------------------
// All variants should normalize to "5491134567890"
// ---------------------------------------------------------------------------

const EXPECTED = '5491134567890'

describe('normalizeArWhatsApp — valid inputs → 5491134567890', () => {
  const validCases: Array<[string, string]> = [
    ['+5491134567890',   'international format with +, mobile 9'],
    ['5491134567890',    'already canonical — no +'],
    ['91134567890',      'starts with mobile 9, 11 digits'],
    ['1134567890',       'bare 10-digit local'],
    ['+541134567890',    'international +54 without mobile 9'],
    ['541134567890',     '54 prefix without + and without mobile 9'],
    ['11-3456-7890',     'local with dashes'],
    ['011 3456-7890',    'leading 0 domestic prefix + space/dash'],
    ['(011) 3456 7890',  'parens + spaces'],
    ['11 3456 7890',     'local with spaces'],
    ['+54 9 11 3456-7890', 'international with spaces and dashes'],
    ['+54911-3456-7890', 'international with partial dashes'],
  ]

  for (const [input, description] of validCases) {
    it(`${description}: "${input}" → "${EXPECTED}"`, () => {
      expect(normalizeArWhatsApp(input)).toBe(EXPECTED)
    })
  }
})

// ---------------------------------------------------------------------------
// Invalid inputs → null
// ---------------------------------------------------------------------------

describe('normalizeArWhatsApp — invalid inputs → null', () => {
  const invalidCases: Array<[string | null | undefined, string]> = [
    ['123',          'too short'],
    ['notaphone',    'no digits at all'],
    ['123456789012345', '15-digit number — too long'],
    ['',             'empty string'],
    [null,           'null'],
    [undefined,      'undefined'],
    ['  ',           'whitespace only'],
  ]

  for (const [input, description] of invalidCases) {
    it(`${description}: ${JSON.stringify(input)} → null`, () => {
      expect(normalizeArWhatsApp(input)).toBeNull()
    })
  }
})
