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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          role?: 'buyer' | 'seller'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          role?: 'buyer' | 'seller'
          avatar_url?: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
