/**
 * Admin Supabase client — service_role key, bypasses RLS.
 * Use ONLY for server-side admin operations (e.g. waitlist inserts).
 * Import createAdminClient; never import createServerClient from server.ts
 * in new files to avoid naming collision with @supabase/ssr's createServerClient.
 */
export { createServerClient as createAdminClient } from './server'
