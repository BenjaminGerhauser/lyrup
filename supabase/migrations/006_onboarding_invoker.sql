-- =============================================================================
-- 006_onboarding_invoker.sql
-- Switched from SECURITY DEFINER to SECURITY INVOKER for complete_onboarding.
--
-- Why: Supabase linter flags complete_onboarding as a privilege-escalation risk
-- because SECURITY DEFINER allows the function to run as the owner regardless of
-- who calls it. SECURITY INVOKER is sufficient here because:
--   1. RLS policies on public.users, public.printers, and public.materials already
--      enforce user_id = auth.uid() — no operation can touch another user's rows.
--   2. The internal auth.uid() == p_user_id check is kept as defence-in-depth.
--   3. The authenticated role already has USAGE on the public schema and
--      SELECT/INSERT/UPDATE/DELETE on all public tables (default Supabase grants),
--      so the function body needs no elevated permissions.
--   4. auth.uid() is a stable Supabase helper that is available under any role;
--      it reads the JWT claim set by the connection — not the auth schema internals.
--
-- Result: least-privilege is fully satisfied with SECURITY INVOKER.
-- =============================================================================

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
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_calling_user UUID := auth.uid();
BEGIN
  -- Security: the calling user must be the target user.
  -- This prevents one authenticated user from completing onboarding for another.
  -- (Defence-in-depth: RLS policies on the tables below enforce the same rule.)
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

-- Re-state grants explicitly: CREATE OR REPLACE may reset grants in some
-- Postgres configurations. Ensure the final state is always correct.
REVOKE ALL ON FUNCTION public.complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) TO authenticated;
