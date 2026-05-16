/**
 * src/lib/pdf/styles.ts
 * Shared StyleSheet for the quote PDF document.
 *
 * 4-colour palette (legible on white print):
 *   primary  — dark blue-grey  #1e293b  (headings, labels)
 *   secondary — medium grey   #475569  (body text)
 *   accent   — blue           #2563eb  (totals, highlights)
 *   muted    — light grey     #f1f5f9  (table row stripes, section BGs)
 */

import { StyleSheet } from '@react-pdf/renderer'

export const COLORS = {
  primary: '#1e293b',
  secondary: '#475569',
  accent: '#2563eb',
  muted: '#f1f5f9',
  white: '#ffffff',
  border: '#e2e8f0',
  watermark: '#94a3b8',
} as const

export const styles = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  // No fontFamily — defaults to react-pdf's built-in Helvetica.
  // Switch to 'Inter' once public/fonts/inter/Inter-{Regular,Bold}.ttf are vendored
  // and fonts.ts registers them (browser only — Node tests use Helvetica).
  page: {
    fontSize: 10,
    color: COLORS.secondary,
    backgroundColor: COLORS.white,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },

  // ── Section spacing ───────────────────────────────────────────────────────
  section: {
    marginBottom: 16,
  },

  // ── Typography ────────────────────────────────────────────────────────────
  heading1: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 4,
  },
  heading2: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  bodyText: {
    fontSize: 10,
    color: COLORS.secondary,
    lineHeight: 1.5,
  },
  smallText: {
    fontSize: 8,
    color: COLORS.secondary,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.muted,
  },

  // Breakdown sub-table
  breakdownContainer: {
    marginLeft: 12,
    marginBottom: 8,
    backgroundColor: COLORS.muted,
    padding: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  breakdownLabel: {
    fontSize: 8,
    color: COLORS.secondary,
  },
  breakdownValue: {
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: 700,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerSection: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.accent,
  },
  footerNote: {
    fontSize: 9,
    color: COLORS.secondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  validityText: {
    fontSize: 9,
    color: COLORS.secondary,
    marginBottom: 4,
  },

  // ── Watermark ─────────────────────────────────────────────────────────────
  watermark: {
    position: 'absolute',
    bottom: 24,
    right: 48,
    fontSize: 9,
    color: COLORS.watermark,
    opacity: 0.6,
  },
})
