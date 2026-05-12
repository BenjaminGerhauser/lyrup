-- =============================================================================
-- 005_security_hardening.sql
-- Fixes Supabase security linter warnings:
--   W1: function_search_path_mutable   → set_updated_at, handle_new_user
--   W2: anon/authenticated can call security-definer trigger functions via REST
--       → REVOKE EXECUTE on handle_new_user from anon + authenticated + PUBLIC
--       → REVOKE EXECUTE on complete_onboarding from anon + PUBLIC (keep authenticated)
--   W3: complete_onboarding search_path must be '' (empty) for SECURITY DEFINER
--       → CREATE OR REPLACE with SET search_path = '' and pg_catalog.now()
--   W4: rls_policy_always_true on waitlist
--       → COMMENT ON POLICY documents intentional anonymous insert
-- Does NOT modify 002 or 004 — they are already applied to remote.
-- All statements are idempotent (ALTER FUNCTION, REVOKE/GRANT, CREATE OR REPLACE).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- W1: Lock search_path for trigger helper functions
-- ---------------------------------------------------------------------------

-- set_updated_at uses NOW() inside its body — with an empty search_path this
-- must be called as pg_catalog.now().  We also recreate the function body here
-- to match, keeping the original signature and behaviour.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- handle_new_user: body only references public.users (already schema-qualified).
-- No bare function calls, so SET search_path = '' is safe without body changes.
ALTER FUNCTION public.handle_new_user() SET search_path = '';


-- ---------------------------------------------------------------------------
-- W2: REVOKE EXECUTE on trigger function — should never be callable via REST
-- ---------------------------------------------------------------------------

-- handle_new_user is a trigger function; it should only fire via the trigger,
-- never be invoked directly by any role through the REST API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;


-- ---------------------------------------------------------------------------
-- W2 + W3: Harden complete_onboarding
-- ---------------------------------------------------------------------------

-- Recreate with SET search_path = '' (empty) as required for SECURITY DEFINER
-- functions by the Supabase linter.  All internal references are already
-- schema-qualified (public.*).  NOW() → pg_catalog.now() to survive empty path.
-- The auth.uid() caller check was already present in 004; it is preserved here.
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_user_id              UUID,
  p_business_name        TEXT,
  p_phone                TEXT,
  p_province             TEXT,
  p_electricity_rate_kwh NUMERIC,
  p_printer_model_id     UUID,
  p_printer_name         TEXT,
  p_filament_id          UUID,
  p_filament_name        TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_calling_user UUID := auth.uid();
BEGIN
  -- Security: the calling user must be the target user.
  -- This prevents one authenticated user from completing onboarding for another.
  IF v_calling_user IS NULL THEN
    RAISE EXCEPTION 'complete_onboarding: caller is not authenticated';
  END IF;

  IF v_calling_user <> p_user_id THEN
    RAISE EXCEPTION 'complete_onboarding: caller % cannot act on behalf of %',
      v_calling_user, p_user_id;
  END IF;

  -- Idempotency guard: if onboarding is already completed, return early.
  -- This prevents duplicate rows if the function is called twice.
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND onboarding_completed = TRUE
  ) THEN
    RETURN;
  END IF;

  -- 1. UPDATE the users row with all onboarding data.
  --    The row was created automatically by handle_new_user() on signup;
  --    we UPDATE it here with business data.
  UPDATE public.users
  SET
    business_name        = p_business_name,
    phone                = p_phone,
    province             = p_province,
    electricity_rate_kwh = p_electricity_rate_kwh,
    onboarding_completed = TRUE,
    updated_at           = pg_catalog.now()
  WHERE id = p_user_id;

  -- Sanity check: the users row must exist (created by handle_new_user trigger).
  IF NOT FOUND THEN
    RAISE EXCEPTION 'complete_onboarding: users row not found for id %', p_user_id;
  END IF;

  -- 2. INSERT the user's first printer row.
  INSERT INTO public.printers (user_id, name, printer_model_id)
  VALUES (p_user_id, p_printer_name, p_printer_model_id);

  -- 3. INSERT the user's first material row.
  --    Copy material_type and density from the catalog for convenience.
  INSERT INTO public.materials (user_id, name, filament_id, material_type, density_g_cm3)
  SELECT
    p_user_id,
    p_filament_name,
    p_filament_id,
    rfc.material_type,
    rfc.density_g_cm3
  FROM public.ref_filament_catalog rfc
  WHERE rfc.id = p_filament_id;

  -- If the filament wasn't found in catalog, insert with just the name.
  IF NOT FOUND THEN
    INSERT INTO public.materials (user_id, name, filament_id)
    VALUES (p_user_id, p_filament_name, p_filament_id);
  END IF;

  -- All three operations share one implicit PL/pgSQL transaction.
  -- Any RAISE EXCEPTION above will roll back all changes automatically.
END;
$$;

-- Explicit REVOKE/GRANT for complete_onboarding.
-- 004 already did REVOKE ALL FROM PUBLIC + GRANT TO authenticated,
-- but we re-state it here to ensure the linter sees the correct final state
-- after the SET search_path = '' recreation above.
REVOKE ALL ON FUNCTION public.complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- W4: Document intentional always-true policy on waitlist
-- ---------------------------------------------------------------------------

-- The anon_insert_waitlist policy uses WITH CHECK (true) by design.
-- The waitlist must accept anonymous sign-ups before any user account exists.
-- Rate limiting and abuse prevention are handled at the Server Action layer
-- (Next.js route handler), not at the database level.
COMMENT ON POLICY "anon_insert_waitlist" ON public.waitlist IS
  'Intentional: waitlist must accept anonymous signups before users exist. Rate limiting handled at the Server Action level.';
