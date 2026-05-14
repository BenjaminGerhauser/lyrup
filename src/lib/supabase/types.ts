/**
 * Hand-written Database type covering all Sprint-0 tables.
 * Replace with `supabase gen types typescript` output once schema is stable (Sprint 1).
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
          plan: string
          business_phone: string | null
        }
        Insert: {
          id: string
          email: string
          business_name?: string | null
          phone?: string | null
          province?: string | null
          electricity_rate_kwh?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          // Sprint 1 additions
          labor_rate_hour?: number | null
          default_margin_percent?: number | null
          default_labor_factor?: number | null
          logo_url?: string | null
          plan?: string
          business_phone?: string | null
        }
        Update: {
          id?: string
          email?: string
          business_name?: string | null
          phone?: string | null
          province?: string | null
          electricity_rate_kwh?: number | null
          onboarding_completed?: boolean
          updated_at?: string
          // Sprint 1 additions
          labor_rate_hour?: number | null
          default_margin_percent?: number | null
          default_labor_factor?: number | null
          logo_url?: string | null
          plan?: string
          business_phone?: string | null
        }
        Relationships: []
      }
      printers: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          printer_model_id?: string | null
          power_w?: number | null
          purchase_price_ars?: number | null
          depreciation_months?: number | null
          created_at?: string
          updated_at?: string
          // Sprint 1 additions
          life_hours_estimate?: number
          nozzle_diameter?: number
          accumulated_hours?: number
          // Sprint 2 additions
          purchase_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          printer_model_id?: string | null
          power_w?: number | null
          purchase_price_ars?: number | null
          depreciation_months?: number | null
          updated_at?: string
          // Sprint 1 additions
          life_hours_estimate?: number
          nozzle_diameter?: number
          accumulated_hours?: number
          // Sprint 2 additions
          purchase_date?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          filament_id?: string | null
          material_type?: string | null
          color?: string | null
          price_per_kg_ars?: number | null
          density_g_cm3?: number | null
          created_at?: string
          updated_at?: string
          // Sprint 1 additions
          filament_diameter?: number
          nozzle_temp?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          filament_id?: string | null
          material_type?: string | null
          color?: string | null
          price_per_kg_ars?: number | null
          density_g_cm3?: number | null
          updated_at?: string
          // Sprint 1 additions
          filament_diameter?: number
          nozzle_temp?: number | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          title: string
          status: 'draft' | 'sent' | 'accepted' | 'rejected'
          total_ars: number | null
          notes: string | null
          created_at: string
          updated_at: string
          // Sprint 2 additions
          client_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected'
          total_ars?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          // Sprint 2 additions
          client_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected'
          total_ars?: number | null
          notes?: string | null
          updated_at?: string
          // Sprint 2 additions
          client_id?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
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
          cost_breakdown: Record<string, number> | null
          gcode_filename: string | null
        }
        Insert: {
          id?: string
          quote_id: string
          description: string
          filament_g?: number | null
          print_hours?: number | null
          unit_price_ars?: number | null
          quantity?: number
          subtotal_ars?: number | null
          created_at?: string
          // Sprint 2 additions
          printer_id?: string | null
          material_id?: string | null
          cost_breakdown?: Record<string, number> | null
          gcode_filename?: string | null
        }
        Update: {
          id?: string
          quote_id?: string
          description?: string
          filament_g?: number | null
          print_hours?: number | null
          unit_price_ars?: number | null
          quantity?: number
          subtotal_ars?: number | null
          // Sprint 2 additions
          printer_id?: string | null
          material_id?: string | null
          cost_breakdown?: Record<string, number> | null
          gcode_filename?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          whatsapp: string
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          whatsapp: string
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          whatsapp?: string
          email?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ref_printer_models: {
        Row: {
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
        Insert: {
          id?: string
          brand: string
          model: string
          bed_x_mm?: number | null
          bed_y_mm?: number | null
          bed_z_mm?: number | null
          power_w?: number | null
          last_updated?: string
          // Sprint 1 additions
          gcode_identifiers?: string[] | null
          popularity_rank?: number
          estimated_life_hours?: number
          firmware_type?: string | null
          nozzle_diameter_default?: number | null
          full_name?: string | null
          reference_price_ars?: number | null
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          bed_x_mm?: number | null
          bed_y_mm?: number | null
          bed_z_mm?: number | null
          power_w?: number | null
          last_updated?: string
          // Sprint 1 additions
          gcode_identifiers?: string[] | null
          popularity_rank?: number
          estimated_life_hours?: number
          firmware_type?: string | null
          nozzle_diameter_default?: number | null
          full_name?: string | null
          reference_price_ars?: number | null
        }
        Relationships: []
      }
      ref_filament_catalog: {
        Row: {
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
        Insert: {
          id?: string
          brand: string
          material_type: string
          color?: string | null
          price_per_kg_ars: number
          density_g_cm3?: number
          last_updated?: string
          // Sprint 1 additions
          gcode_identifiers?: string[] | null
          popularity_rank?: number
          nozzle_temp_min?: number | null
          nozzle_temp_max?: number | null
          bed_temp_min?: number | null
          bed_temp_max?: number | null
          filament_diameter?: number
        }
        Update: {
          id?: string
          brand?: string
          material_type?: string
          color?: string | null
          price_per_kg_ars?: number
          density_g_cm3?: number
          last_updated?: string
          // Sprint 1 additions
          gcode_identifiers?: string[] | null
          popularity_rank?: number
          nozzle_temp_min?: number | null
          nozzle_temp_max?: number | null
          bed_temp_min?: number | null
          bed_temp_max?: number | null
          filament_diameter?: number
        }
        Relationships: []
      }
      ref_electricity_rates: {
        Row: {
          id: string
          province: string
          tier: string
          rate_kwh_ars: number
          last_updated: string
        }
        Insert: {
          id?: string
          province: string
          tier?: string
          rate_kwh_ars: number
          last_updated?: string
        }
        Update: {
          id?: string
          province?: string
          tier?: string
          rate_kwh_ars?: number
          last_updated?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      complete_onboarding: {
        Args: {
          p_user_id: string
          p_business_name: string
          p_phone: string | null
          p_province: string
          p_electricity_rate_kwh: number
          p_printer_model_id: string
          p_printer_name: string
          p_filament_id: string
          p_filament_name: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}
