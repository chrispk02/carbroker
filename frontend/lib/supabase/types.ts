export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'buyer' | 'seller'
          avatar_url: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'buyer' | 'seller'
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          role?: 'buyer' | 'seller'
          avatar_url?: string | null
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      cars: {
        Row: {
          id: string
          seller_id: string
          slug: string
          title: string
          brand: string
          model: string
          variant: string | null
          price_vnd: number
          year: number
          mileage_km: number | null
          fuel: string | null
          transmission: string | null
          color: string | null
          location: string | null
          description: string | null
          status: 'draft' | 'active' | 'sold' | 'hidden'
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          slug: string
          title: string
          brand: string
          model: string
          variant?: string | null
          price_vnd: number
          year: number
          mileage_km?: number | null
          fuel?: string | null
          transmission?: string | null
          color?: string | null
          location?: string | null
          description?: string | null
          status?: 'draft' | 'active' | 'sold' | 'hidden'
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          title?: string
          brand?: string
          model?: string
          variant?: string | null
          price_vnd?: number
          year?: number
          mileage_km?: number | null
          fuel?: string | null
          transmission?: string | null
          color?: string | null
          location?: string | null
          description?: string | null
          status?: 'draft' | 'active' | 'sold' | 'hidden'
          verified?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      car_images: {
        Row: {
          id: string
          car_id: string
          storage_path: string
          url: string | null
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          car_id: string
          storage_path: string
          url?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          is_primary?: boolean
          sort_order?: number
          url?: string | null
        }
        Relationships: []
      }
      car_features: {
        Row: {
          id: string
          car_id: string
          feature: string
        }
        Insert: {
          id?: string
          car_id: string
          feature: string
        }
        Update: {
          feature?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: { id: string; phone: string; otp_hash: string; expires_at: string; used: boolean; created_at: string }
        Insert: { id?: string; phone: string; otp_hash: string; expires_at?: string; used?: boolean; created_at?: string }
        Update: { used?: boolean }
        Relationships: []
      }
      car_views: {
        Row: {
          id: string
          car_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          car_id: string
          viewed_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      site_config: {
        Row: { key: string; value: Record<string, unknown>; updated_at: string }
        Insert: { key: string; value: Record<string, unknown>; updated_at?: string }
        Update: { value?: Record<string, unknown>; updated_at?: string }
        Relationships: []
      }
      seller_kyc: {
        Row: {
          id: string
          user_id: string
          seller_type: 'individual' | 'business'
          cccd_number: string | null
          cccd_name: string | null
          cccd_dob: string | null
          cccd_address: string | null
          cccd_front_path: string | null
          cccd_back_path: string | null
          business_name: string | null
          business_tax_id: string | null
          business_address: string | null
          business_license_path: string | null
          status: 'pending' | 'reviewing' | 'approved' | 'rejected'
          reject_reason: string | null
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          seller_type: 'individual' | 'business'
          cccd_number?: string | null
          cccd_name?: string | null
          cccd_dob?: string | null
          cccd_address?: string | null
          cccd_front_path?: string | null
          cccd_back_path?: string | null
          business_name?: string | null
          business_tax_id?: string | null
          business_address?: string | null
          business_license_path?: string | null
          status?: 'pending' | 'reviewing' | 'approved' | 'rejected'
          reject_reason?: string | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          seller_type?: 'individual' | 'business'
          cccd_number?: string | null
          cccd_name?: string | null
          cccd_dob?: string | null
          cccd_address?: string | null
          cccd_front_path?: string | null
          cccd_back_path?: string | null
          business_name?: string | null
          business_tax_id?: string | null
          business_address?: string | null
          business_license_path?: string | null
          status?: 'pending' | 'reviewing' | 'approved' | 'rejected'
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
