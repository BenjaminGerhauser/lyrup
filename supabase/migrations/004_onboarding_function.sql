-- =============================================================================
-- 004_onboarding_function.sql
-- Atomic onboarding completion via SECURITY DEFINER PL/pgSQL function.
-- Performs: UPSERT users + INSERT printers + INSERT materials in one transaction.
-- Requires: 002_cotizador_schema.sql already applied.
-- =============================================================================

CREATE OR REPLACE FUNCTION complete_onboarding(
  p_user_id            UUID,
  p_business_name      TEXT,
  p_phone              TEXT,
  p_province           TEXT,
  p_electricity_rate_kwh NUMERIC,
  p_printer_model_id   UUID,
  p_printer_name       TEXT,
  p_filament_id        UUID,
  p_filament_name      TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- 1. UPSERT the users row with all onboarding data.
  --    The row was created automatically by handle_new_user() on signup;
  --    we UPDATE it here with business data.
  UPDATE public.users
  SET
    business_name        = p_business_name,
    phone                = p_phone,
    province             = p_province,
    electricity_rate_kwh = p_electricity_rate_kwh,
    onboarding_completed = TRUE,
    updated_at           = NOW()
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

  -- All three operations are in one implicit PL/pgSQL transaction.
  -- Any RAISE EXCEPTION above will roll back all changes automatically.
END;
$$;

-- Grant execute permission to the authenticated role so anon/service_role
-- cannot invoke this function directly; only cookie-authenticated users can.
REVOKE ALL ON FUNCTION complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_onboarding(UUID, TEXT, TEXT, TEXT, NUMERIC, UUID, TEXT, UUID, TEXT) TO authenticated;
