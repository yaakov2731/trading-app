// Auto-generated types from Supabase schema
// Run: npm run db:types to regenerate

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          code: string
          prefix: string
          name: string
          description: string | null
          color: string
          icon: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      locations: {
        Row: {
          id: string
          code: string
          name: string
          type: string
          address: string | null
          phone: string | null
          timezone: string
          color: string
          is_active: boolean
          sort_order: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          category_id: string
          unit_id: string
          cost_price: number | null
          sale_price: number | null
          min_stock: number
          max_stock: number | null
          reorder_point: number | null
          image_url: string | null
          barcode: string | null
          is_active: boolean
          is_legacy: boolean
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'sku' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['products']['Row'], 'id' | 'sku'>>
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          location_id: string
          movement_type: string
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          reference_type: string | null
          reference_id: string | null
          reference_code: string | null
          running_balance: number | null
          notes: string | null
          performed_by: string
          performed_at: string
          idempotency_key: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'total_cost' | 'created_at'>
        Update: never
      }
      stock_balances: {
        Row: {
          id: string
          product_id: string
          location_id: string
          current_stock: number
          last_movement_at: string | null
          last_updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_balances']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['stock_balances']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      transfers: {
        Row: {
          id: string
          code: string
          from_location_id: string
          to_location_id: string
          status: string
          transfer_date: string
          notes: string | null
          created_by: string
          approved_by: string | null
          approved_at: string | null
          sent_by: string | null
          sent_at: string | null
          received_by: string | null
          received_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transfers']['Row'], 'id' | 'code' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transfers']['Insert']>
      }
      physical_counts: {
        Row: {
          id: string
          code: string
          location_id: string
          status: string
          count_date: string
          notes: string | null
          total_items: number
          items_counted: number
          total_variance: number | null
          created_by: string
          reviewed_by: string | null
          reviewed_at: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['physical_counts']['Row'], 'id' | 'code' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['physical_counts']['Insert']>
      }
    }
    Views: {
      v_current_stock: {
        Row: {
          product_id: string
          sku: string
          product_name: string
          category_id: string
          category_name: string
          category_color: string
          unit_symbol: string
          location_id: string
          location_name: string
          location_code: string
          location_color: string
          current_stock: number
          min_stock: number
          reorder_point: number | null
          cost_price: number | null
          stock_value: number
          last_movement_at: string | null
          stock_status: string
        }
      }
      v_movement_history: {
        Row: {
          id: string
          performed_at: string
          movement_type: string
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          running_balance: number | null
          reference_type: string | null
          reference_code: string | null
          notes: string | null
          product_id: string
          sku: string
          product_name: string
          category_name: string
          unit_symbol: string
          location_id: string
          location_name: string
          performed_by_name: string
        }
      }
    }
    Functions: {
      generate_sku: {
        Args: { p_category_id: string }
        Returns: string
      }
      get_current_stock: {
        Args: { p_product_id: string; p_location_id: string }
        Returns: number
      }
      record_movement: {
        Args: {
          p_product_id: string
          p_location_id: string
          p_movement_type: string
          p_quantity: number
          p_performed_by: string
          p_unit_cost?: number
          p_reference_type?: string
          p_reference_id?: string
          p_reference_code?: string
          p_notes?: string
          p_idempotency_key?: string
        }
        Returns: Database['public']['Tables']['stock_movements']['Row']
      }
    }
  }
}
