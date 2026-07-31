export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          country_code: string
          id: string
          lat: number
          lng: number
          name: string
        }
        Insert: {
          country_code: string
          id?: string
          lat: number
          lng: number
          name: string
        }
        Update: {
          country_code?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          name_de: string
          name_en: string
          name_sq: string
          region: string
        }
        Insert: {
          code: string
          name_de: string
          name_en: string
          name_sq: string
          region?: string
        }
        Update: {
          code?: string
          name_de?: string
          name_en?: string
          name_sq?: string
          region?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          active: boolean
          attributes: Json
          category: Database["public"]["Enums"]["listing_category"]
          city_id: string | null
          country_code: string
          currency: string
          description: string | null
          external_id: string
          fetched_at: string
          id: string
          images: Json
          lat: number | null
          lng: number | null
          posted_at: string
          price_band: Database["public"]["Enums"]["price_band"] | null
          price_eur: number
          price_score: number | null
          segment_key: string | null
          source_id: string
          title: string
          url: string
        }
        Insert: {
          active?: boolean
          attributes?: Json
          category: Database["public"]["Enums"]["listing_category"]
          city_id?: string | null
          country_code: string
          currency?: string
          description?: string | null
          external_id: string
          fetched_at?: string
          id?: string
          images?: Json
          lat?: number | null
          lng?: number | null
          posted_at?: string
          price_band?: Database["public"]["Enums"]["price_band"] | null
          price_eur: number
          price_score?: number | null
          segment_key?: string | null
          source_id: string
          title: string
          url: string
        }
        Update: {
          active?: boolean
          attributes?: Json
          category?: Database["public"]["Enums"]["listing_category"]
          city_id?: string | null
          country_code?: string
          currency?: string
          description?: string | null
          external_id?: string
          fetched_at?: string
          id?: string
          images?: Json
          lat?: number | null
          lng?: number | null
          posted_at?: string
          price_band?: Database["public"]["Enums"]["price_band"] | null
          price_eur?: number
          price_score?: number | null
          segment_key?: string | null
          source_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "listings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      price_stats: {
        Row: {
          category: Database["public"]["Enums"]["listing_category"]
          id: string
          mad: number
          median_eur: number
          n: number
          p25: number
          p75: number
          segment_key: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["listing_category"]
          id?: string
          mad: number
          median_eur: number
          n: number
          p25: number
          p75: number
          segment_key: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["listing_category"]
          id?: string
          mad?: number
          median_eur?: number
          n?: number
          p25?: number
          p75?: number
          segment_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          body: string | null
          created_at: string
          id: string
          published: boolean
          rating: number
          user_id: string
        }
        Insert: {
          author_name: string
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          rating: number
          user_id: string
        }
        Update: {
          author_name?: string
          body?: string | null
          created_at?: string
          id?: string
          published?: boolean
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          label: string
          last_notified_at: string | null
          notify: boolean
          query: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          last_notified_at?: string | null
          notify?: boolean
          query?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          last_notified_at?: string | null
          notify?: boolean
          query?: Json
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          base_url: string
          categories: Database["public"]["Enums"]["listing_category"][]
          country_codes: string[]
          enabled: boolean
          health: string
          id: string
          last_run_at: string | null
          legal_mode: string
          name: string
          slug: string
        }
        Insert: {
          base_url: string
          categories?: Database["public"]["Enums"]["listing_category"][]
          country_codes?: string[]
          enabled?: boolean
          health?: string
          id?: string
          last_run_at?: string | null
          legal_mode?: string
          name: string
          slug: string
        }
        Update: {
          base_url?: string
          categories?: Database["public"]["Enums"]["listing_category"][]
          country_codes?: string[]
          enabled?: boolean
          health?: string
          id?: string
          last_run_at?: string | null
          legal_mode?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          filters: Json
          language: string
          push_enabled: boolean
          sort: string
          source_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          filters?: Json
          language?: string
          push_enabled?: boolean
          sort?: string
          source_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          filters?: Json
          language?: string
          push_enabled?: boolean
          sort?: string
          source_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recompute_price_stats: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      listing_category: "real_estate" | "apartments" | "cars" | "motorcycles"
      price_band: "great" | "good" | "fair" | "high" | "check"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      listing_category: ["real_estate", "apartments", "cars", "motorcycles"],
      price_band: ["great", "good", "fair", "high", "check"],
    },
  },
} as const
