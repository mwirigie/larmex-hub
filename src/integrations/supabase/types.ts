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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "house_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      house_plans: {
        Row: {
          area_sqm: number | null
          bathrooms: number
          bedrooms: number
          county: string | null
          created_at: string
          description: string | null
          features: string[] | null
          floors: number
          house_type: Database["public"]["Enums"]["house_type"]
          id: string
          images: string[] | null
          land_size: string | null
          pdf_url: string | null
          price_kes: number
          professional_id: string
          status: Database["public"]["Enums"]["plan_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          area_sqm?: number | null
          bathrooms?: number
          bedrooms?: number
          county?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          floors?: number
          house_type?: Database["public"]["Enums"]["house_type"]
          id?: string
          images?: string[] | null
          land_size?: string | null
          pdf_url?: string | null
          price_kes?: number
          professional_id: string
          status?: Database["public"]["Enums"]["plan_status"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          area_sqm?: number | null
          bathrooms?: number
          bedrooms?: number
          county?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          floors?: number
          house_type?: Database["public"]["Enums"]["house_type"]
          id?: string
          images?: string[] | null
          land_size?: string | null
          pdf_url?: string | null
          price_kes?: number
          professional_id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      plan_purchases: {
        Row: {
          amount_kes: number
          client_id: string
          created_at: string
          id: string
          payment_method: string | null
          payment_reference: string | null
          plan_id: string
          status: string
        }
        Insert: {
          amount_kes: number
          client_id: string
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_id: string
          status?: string
        }
        Update: {
          amount_kes?: number
          client_id?: string
          created_at?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_purchases_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "house_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          is_verified: boolean
          license_number: string | null
          service_counties: string[] | null
          specializations:
            | Database["public"]["Enums"]["specialization"][]
            | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
          years_experience: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          license_number?: string | null
          service_counties?: string[] | null
          specializations?:
            | Database["public"]["Enums"]["specialization"][]
            | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          is_verified?: boolean
          license_number?: string | null
          service_counties?: string[] | null
          specializations?:
            | Database["public"]["Enums"]["specialization"][]
            | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          county: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          county?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_requests: {
        Row: {
          budget_kes: number | null
          client_id: string
          county: string | null
          created_at: string
          description: string | null
          id: string
          land_size: string | null
          professional_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_kes?: number | null
          client_id: string
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          land_size?: string | null
          professional_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_kes?: number | null
          client_id?: string
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          land_size?: string | null
          professional_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          plan_id: string | null
          professional_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          plan_id?: string | null
          professional_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          plan_id?: string | null
          professional_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "house_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_kes: number
          commission_kes: number
          created_at: string
          id: string
          metadata: Json | null
          reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount_kes: number
          commission_kes?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount_kes?: number
          commission_kes?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_type: string
          document_url: string
          id: string
          professional_id: string
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          professional_id: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          professional_id?: string
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "professional" | "admin"
      house_type:
        | "bungalow"
        | "maisonette"
        | "apartment"
        | "villa"
        | "townhouse"
        | "mansion"
        | "other"
      plan_status: "draft" | "pending" | "approved" | "rejected"
      specialization:
        | "residential"
        | "commercial"
        | "structural"
        | "interior"
        | "landscape"
        | "urban_planning"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["client", "professional", "admin"],
      house_type: [
        "bungalow",
        "maisonette",
        "apartment",
        "villa",
        "townhouse",
        "mansion",
        "other",
      ],
      plan_status: ["draft", "pending", "approved", "rejected"],
      specialization: [
        "residential",
        "commercial",
        "structural",
        "interior",
        "landscape",
        "urban_planning",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
