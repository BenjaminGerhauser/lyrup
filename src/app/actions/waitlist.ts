'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/welcome'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type WaitlistResult =
  | { success: true }
  | { error: 'duplicate' | 'invalid_email' | 'server_error' }

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  const email = formData.get('email')?.toString().trim().toLowerCase()
  const utmSource = formData.get('utm_source')?.toString() ?? 'landing'

  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'invalid_email' }
  }

  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('waitlist')
      .insert({ email, source: utmSource })

    if (error) {
      if (error.code === '23505') {
        return { error: 'duplicate' }
      }
      console.error('Waitlist insert error:', error)
      return { error: 'server_error' }
    }

    // Fire-and-forget welcome email
    sendWelcomeEmail(email).catch((err) =>
      console.error('Welcome email failed:', err)
    )

    return { success: true }
  } catch (err) {
    console.error('Waitlist action error:', err)
    return { error: 'server_error' }
  }
}
