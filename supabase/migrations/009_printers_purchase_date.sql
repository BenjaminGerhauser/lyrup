-- =============================================================================
-- 009_printers_purchase_date.sql
-- Sprint 1 carry-over: add `purchase_date` to printers. The /impresoras date
-- picker is already wired to a `purchase_date` field in the form, but the
-- column was missing so values were silently dropped.
--
-- Additive, nullable, safe to apply at any time.
-- =============================================================================

ALTER TABLE printers
  ADD COLUMN IF NOT EXISTS purchase_date DATE;

COMMENT ON COLUMN printers.purchase_date IS
  'Date the user purchased this printer. Used to compute depreciation start. NULL = unknown.';
