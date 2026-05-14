-- =============================================================================
-- 008_sprint2_quotes.sql
-- Sprint 2 — Quotes flow end-to-end:
--   1. New table `clients` (one client per row, owned by user).
--   2. Extend `quotes`:
--        - `client_id` FK to clients (NULL allowed; ON DELETE SET NULL).
--        - status CHECK constraint (draft|sent|accepted|rejected).
--   3. Extend `quote_items`:
--        - `printer_id`, `material_id` FK to the user's printers/materials
--          (NULL allowed; ON DELETE SET NULL so deleting a printer/material
--          does NOT cascade and wipe the historical quote).
--        - `cost_breakdown` JSONB — full CostBreakdown snapshot at quote time.
--        - `gcode_filename` TEXT — name of the uploaded G-code for audit.
--   4. Trigger `trg_quotes_recompute_total` — re-aggregates `quotes.total_ars`
--      whenever a row in `quote_items` is inserted, updated, or deleted.
--
-- Requires: migrations 001-007 already applied.
-- All operations are additive and idempotent (IF NOT EXISTS / CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. clients
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  whatsapp    TEXT NOT NULL,
  email       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  clients_whatsapp_format CHECK (whatsapp ~ '^[0-9+\s()\-]+$'),
  CONSTRAINT  clients_email_format CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_owner_all" ON clients;
CREATE POLICY "clients_owner_all" ON clients
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE clients IS
  'End customers a Lyrup user invoices. WhatsApp is mandatory for PDF auto-send (Sprint 3).';

-- ---------------------------------------------------------------------------
-- 2. quotes — extend
-- ---------------------------------------------------------------------------

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);

ALTER TABLE quotes
  DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected'));

-- ---------------------------------------------------------------------------
-- 3. quote_items — extend
-- ---------------------------------------------------------------------------

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS printer_id      UUID REFERENCES printers(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS material_id     UUID REFERENCES materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_breakdown  JSONB,
  ADD COLUMN IF NOT EXISTS gcode_filename  TEXT;

CREATE INDEX IF NOT EXISTS idx_quote_items_printer_id  ON quote_items(printer_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_material_id ON quote_items(material_id);

-- ---------------------------------------------------------------------------
-- 4. Trigger: recompute quotes.total_ars from quote_items.subtotal_ars
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recompute_quote_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  -- Determine which quote_id was affected (different between TG_OPs).
  IF TG_OP = 'DELETE' THEN
    v_quote_id := OLD.quote_id;
  ELSE
    v_quote_id := NEW.quote_id;
  END IF;

  -- If an UPDATE moved an item between quotes, refresh the old quote too.
  IF TG_OP = 'UPDATE' AND OLD.quote_id IS DISTINCT FROM NEW.quote_id THEN
    UPDATE public.quotes
       SET total_ars = COALESCE(
             (SELECT SUM(subtotal_ars) FROM public.quote_items WHERE quote_id = OLD.quote_id),
             0
           )
     WHERE id = OLD.quote_id;
  END IF;

  UPDATE public.quotes
     SET total_ars = COALESCE(
           (SELECT SUM(subtotal_ars) FROM public.quote_items WHERE quote_id = v_quote_id),
           0
         )
   WHERE id = v_quote_id;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;

DROP TRIGGER IF EXISTS trg_quotes_recompute_total ON quote_items;
CREATE TRIGGER trg_quotes_recompute_total
  AFTER INSERT OR UPDATE OR DELETE ON quote_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_quote_total();

COMMENT ON FUNCTION public.recompute_quote_total() IS
  'AFTER trigger that keeps quotes.total_ars in sync with SUM(quote_items.subtotal_ars). Owner-checked via RLS on the quotes table — no SECURITY DEFINER needed.';

-- ---------------------------------------------------------------------------
-- Verification queries (run manually after apply):
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'clients' ORDER BY ordinal_position;
--   -- expect: id, user_id, name, whatsapp, email, notes, created_at, updated_at
--
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'quote_items' AND column_name IN
--       ('printer_id','material_id','cost_breakdown','gcode_filename');
--   -- expect: 4 rows
--
--   SELECT conname FROM pg_constraint WHERE conrelid = 'quotes'::regclass
--     AND contype = 'c';
--   -- expect: quotes_status_check
-- ---------------------------------------------------------------------------
