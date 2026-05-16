/**
 * Domain types matching the DB schema (Sprint 0 → Sprint 2).
 * Derived from Database interface in lib/supabase/types.ts.
 */

import type { CostBreakdown } from './calculator'

export interface User {
  id: string
  email: string
  business_name: string | null
  phone: string | null
  province: string | null
  electricity_rate_kwh: number | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
  // Sprint 1 additions
  labor_rate_hour: number | null
  default_margin_percent: number | null
  default_labor_factor: number | null
  logo_url: string | null
  plan: 'free' | 'pro' | 'farm'
  business_phone: string | null
  // Sprint 3 additions — PDF config
  quote_validity_days: number          // NOT NULL DEFAULT 30; validated 1–365
  quote_footer_note: string | null
  pdf_show_breakdown: boolean          // NOT NULL DEFAULT true
}

export interface Printer {
  id: string
  user_id: string
  name: string
  printer_model_id: string | null
  power_w: number | null
  purchase_price_ars: number | null
  depreciation_months: number | null
  created_at: string
  updated_at: string
  // Sprint 1 additions
  life_hours_estimate: number
  nozzle_diameter: number
  accumulated_hours: number
  // Sprint 2 additions
  purchase_date: string | null
}

export interface Material {
  id: string
  user_id: string
  name: string
  filament_id: string | null
  material_type: string | null
  color: string | null
  price_per_kg_ars: number | null
  density_g_cm3: number | null
  created_at: string
  updated_at: string
  // Sprint 1 additions
  filament_diameter: number
  nozzle_temp: number | null
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'

export interface Quote {
  id: string
  user_id: string
  client_id: string | null
  title: string
  status: QuoteStatus
  total_ars: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface QuoteItem {
  id: string
  quote_id: string
  description: string
  filament_g: number | null
  print_hours: number | null
  unit_price_ars: number | null
  quantity: number
  subtotal_ars: number | null
  created_at: string
  // Sprint 2 additions
  printer_id: string | null
  material_id: string | null
  cost_breakdown: CostBreakdown | null
  gcode_filename: string | null
  // Optional embeds resolved by getQuote. Null when the FK is null
  // (printer/material was deleted — ON DELETE SET NULL).
  printer?: { id: string; name: string } | null
  material?: { id: string; name: string } | null
}

export interface Client {
  id: string
  user_id: string
  name: string
  whatsapp: string
  email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/** Quote with its items (and optionally its client) — used in detail/list views. */
export interface QuoteWithItems extends Quote {
  items: QuoteItem[]
  client: Client | null
}

export interface RefPrinterModel {
  id: string
  brand: string
  model: string
  bed_x_mm: number | null
  bed_y_mm: number | null
  bed_z_mm: number | null
  power_w: number | null
  last_updated: string
  // Sprint 1 additions
  gcode_identifiers: string[] | null
  popularity_rank: number
  estimated_life_hours: number
  firmware_type: string | null
  nozzle_diameter_default: number | null
  full_name: string | null
  reference_price_ars: number | null
}

export interface RefFilamentCatalog {
  id: string
  brand: string
  material_type: string
  color: string | null
  price_per_kg_ars: number
  density_g_cm3: number
  last_updated: string
  // Sprint 1 additions
  gcode_identifiers: string[] | null
  popularity_rank: number
  nozzle_temp_min: number | null
  nozzle_temp_max: number | null
  bed_temp_min: number | null
  bed_temp_max: number | null
  filament_diameter: number
}

export interface RefElectricityRate {
  id: string
  province: string
  tier: string
  rate_kwh_ars: number
  last_updated: string
}

/** Partial form data accumulated across onboarding steps 1–4 */
export interface OnboardingDraft {
  business_name: string
  phone: string
  printer_model_id: string
  printer_name: string
  filament_id: string
  filament_name: string
  province: string
  electricity_rate_kwh: number
}
