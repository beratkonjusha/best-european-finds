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
          population: number | null
          postal_code: string | null
          region_id: string | null
        }
        Insert: {
          country_code: string
          id?: string
          lat: number
          lng: number
          name: string
          population?: number | null
          postal_code?: string | null
          region_id?: string | null
        }
        Update: {
          country_code?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          population?: number | null
          postal_code?: string | null
          region_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
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
          snapshot: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          snapshot?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          snapshot?: Json
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
      listing_translations: {
        Row: {
          attributes: Json
          created_at: string
          description: string | null
          id: string
          lang: string
          listing_id: string
          title: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          description?: string | null
          id?: string
          lang: string
          listing_id: string
          title: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          description?: string | null
          id?: string
          lang?: string
          listing_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_translations_listing_id_fkey"
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
          last_seen_at: string
          lat: number | null
          lng: number | null
          posted_at: string
          price_band: Database["public"]["Enums"]["price_band"] | null
          price_eur: number
          price_score: number | null
          region_id: string | null
          segment_key: string | null
          source_id: string
          source_lang: string | null
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
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          posted_at?: string
          price_band?: Database["public"]["Enums"]["price_band"] | null
          price_eur: number
          price_score?: number | null
          region_id?: string | null
          segment_key?: string | null
          source_id: string
          source_lang?: string | null
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
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          posted_at?: string
          price_band?: Database["public"]["Enums"]["price_band"] | null
          price_eur?: number
          price_score?: number | null
          region_id?: string | null
          segment_key?: string | null
          source_id?: string
          source_lang?: string | null
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
            foreignKeyName: "listings_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          language: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          language?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          language?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_deliveries: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          saved_search_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          saved_search_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          saved_search_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_deliveries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_deliveries_saved_search_id_fkey"
            columns: ["saved_search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      push_dispatch_runs: {
        Row: {
          created_at: string
          dispatch_key: string
          id: string
          notified: number
          saved_search_id: string
        }
        Insert: {
          created_at?: string
          dispatch_key: string
          id?: string
          notified?: number
          saved_search_id: string
        }
        Update: {
          created_at?: string
          dispatch_key?: string
          id?: string
          notified?: number
          saved_search_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_dispatch_runs_saved_search_id_fkey"
            columns: ["saved_search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          last_success_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys?: Json
          last_success_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          last_success_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string
          country_code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          country_code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          country_code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
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
          last_checked_at: string | null
          last_notified_at: string | null
          last_notified_listing_at: string | null
          notify: boolean
          query: Json
          throttle_minutes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          last_checked_at?: string | null
          last_notified_at?: string | null
          last_notified_listing_at?: string | null
          notify?: boolean
          query?: Json
          throttle_minutes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          last_checked_at?: string | null
          last_notified_at?: string | null
          last_notified_listing_at?: string | null
          notify?: boolean
          query?: Json
          throttle_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      source_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          level: string
          message: string | null
          meta: Json
          source_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          level?: string
          message?: string | null
          meta?: Json
          source_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          level?: string
          message?: string | null
          meta?: Json
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          backoff_seconds: number
          base_url: string
          categories: Database["public"]["Enums"]["listing_category"][]
          country_codes: string[]
          enabled: boolean
          fail_count: number
          fallback_slug: string | null
          health: string
          id: string
          last_error: string | null
          last_run_at: string | null
          last_success_at: string | null
          legal_mode: string
          name: string
          next_retry_at: string | null
          slug: string
        }
        Insert: {
          backoff_seconds?: number
          base_url: string
          categories?: Database["public"]["Enums"]["listing_category"][]
          country_codes?: string[]
          enabled?: boolean
          fail_count?: number
          fallback_slug?: string | null
          health?: string
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          legal_mode?: string
          name: string
          next_retry_at?: string | null
          slug: string
        }
        Update: {
          backoff_seconds?: number
          base_url?: string
          categories?: Database["public"]["Enums"]["listing_category"][]
          country_codes?: string[]
          enabled?: boolean
          fail_count?: number
          fallback_slug?: string | null
          health?: string
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          legal_mode?: string
          name?: string
          next_retry_at?: string | null
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
