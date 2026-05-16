-- =============================================================================
-- 011_quote_config_fields.sql
-- Sprint 3 — PDF generator config: per-user validity days, footer note,
-- and breakdown visibility toggle. All additive, all default-safe so existing
-- users keep working without any backfill.
--
-- Additive, nullable-or-defaulted, safe to apply at any time.
-- Requires: migrations 001–010 already applied.
-- =============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS quote_validity_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS quote_footer_note   TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pdf_show_breakdown  BOOLEAN NOT NULL DEFAULT TRUE;

-- Enforce sane bounds on validity days (positive, ≤ 365). Drop-then-add is
-- idempotent across re-runs.
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_quote_validity_days_check;
ALTER TABLE users
  ADD  CONSTRAINT users_quote_validity_days_check
       CHECK (quote_validity_days > 0 AND quote_validity_days <= 365);

COMMENT ON COLUMN users.quote_validity_days IS
  'Default validity period (in days) displayed on the quote PDF footer. 1–365.';
COMMENT ON COLUMN users.quote_footer_note IS
  'Free-form note rendered at the bottom of the quote PDF. NULL or empty = hidden.';
COMMENT ON COLUMN users.pdf_show_breakdown IS
  'Whether to render the per-item cost breakdown sub-table on the quote PDF.';

-- ---------------------------------------------------------------------------
-- Verification (manual):
-- SELECT quote_validity_days, quote_footer_note, pdf_show_breakdown
--   FROM users LIMIT 5;
-- Expected: all rows quote_validity_days=30, pdf_show_breakdown=TRUE, note NULL.
-- ---------------------------------------------------------------------------
