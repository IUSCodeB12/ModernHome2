// Database types for the ModernHome Supabase schema.
// Matches supabase/migrations. Regenerate after schema changes with:
//   pnpm supabase gen types typescript --linked > lib/database.types.ts
//
// Generation overwrites this header — paste it back on top afterwards.

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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      availability_rules: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          access_notes: string | null
          address_line1: string | null
          assigned_installer: string | null
          created_at: string
          customer_id: string
          deposit_cents: number | null
          deposit_paid_at: string | null
          id: string
          postcode: string | null
          quote_request_id: string | null
          reschedule_note: string | null
          reschedule_requested_at: string | null
          slot_end: string | null
          slot_start: string | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id: string | null
          suburb: string | null
          updated_at: string
        }
        Insert: {
          access_notes?: string | null
          address_line1?: string | null
          assigned_installer?: string | null
          created_at?: string
          customer_id: string
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          id?: string
          postcode?: string | null
          quote_request_id?: string | null
          reschedule_note?: string | null
          reschedule_requested_at?: string | null
          slot_end?: string | null
          slot_start?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          suburb?: string | null
          updated_at?: string
        }
        Update: {
          access_notes?: string | null
          address_line1?: string | null
          assigned_installer?: string | null
          created_at?: string
          customer_id?: string
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          id?: string
          postcode?: string | null
          quote_request_id?: string | null
          reschedule_note?: string | null
          reschedule_requested_at?: string | null
          slot_end?: string | null
          slot_start?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_checkout_session_id?: string | null
          suburb?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: true
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          booking_id: string | null
          created_at: string
          dedupe_key: string | null
          error: string | null
          id: string
          provider_id: string | null
          quote_request_id: string | null
          recipient: string
          status: Database["public"]["Enums"]["email_status"]
          template: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          id?: string
          provider_id?: string | null
          quote_request_id?: string | null
          recipient: string
          status?: Database["public"]["Enums"]["email_status"]
          template: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          error?: string | null
          id?: string
          provider_id?: string | null
          quote_request_id?: string | null
          recipient?: string
          status?: Database["public"]["Enums"]["email_status"]
          template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          after_image_url: string | null
          before_image_url: string
          created_at: string
          featured: boolean
          id: string
          service_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url: string
          created_at?: string
          featured?: boolean
          id?: string
          service_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string
          created_at?: string
          featured?: boolean
          id?: string
          service_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          active: boolean
          created_at: string
          headline: string | null
          id: string
          image_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          headline?: string | null
          id?: string
          image_url: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          headline?: string | null
          id?: string
          image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string
          created_at: string
          gst_cents: number
          id: string
          invoice_number: string
          line_items: Json
          paid_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          gst_cents?: number
          id?: string
          invoice_number?: string
          line_items?: Json
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          gst_cents?: number
          id?: string
          invoice_number?: string
          line_items?: Json
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          postcode: string | null
          role: Database["public"]["Enums"]["user_role"]
          suburb: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          postcode?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suburb?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          postcode?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          suburb?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          admin_notes: string | null
          answers: Json
          created_at: string
          customer_id: string
          estimate_high_cents: number | null
          estimate_low_cents: number | null
          expires_at: string | null
          final_quote_cents: number | null
          id: string
          photo_urls: string[]
          quote_line_items: Json
          service_id: string
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          answers?: Json
          created_at?: string
          customer_id: string
          estimate_high_cents?: number | null
          estimate_low_cents?: number | null
          expires_at?: string | null
          final_quote_cents?: number | null
          id?: string
          photo_urls?: string[]
          quote_line_items?: Json
          service_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          answers?: Json
          created_at?: string
          customer_id?: string
          estimate_high_cents?: number | null
          estimate_low_cents?: number | null
          expires_at?: string | null
          final_quote_cents?: number | null
          id?: string
          photo_urls?: string[]
          quote_line_items?: Json
          service_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_questions: {
        Row: {
          created_at: string
          id: string
          input_type: Database["public"]["Enums"]["question_input_type"]
          options: Json | null
          photo_guide_text: string | null
          question_text: string
          requires_photo: boolean
          service_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_type: Database["public"]["Enums"]["question_input_type"]
          options?: Json | null
          photo_guide_text?: string | null
          question_text: string
          requires_photo?: boolean
          service_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          input_type?: Database["public"]["Enums"]["question_input_type"]
          options?: Json | null
          photo_guide_text?: string | null
          question_text?: string
          requires_photo?: boolean
          service_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_questions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_showcase: {
        Row: {
          active: boolean
          body: string | null
          created_at: string
          eyebrow: string | null
          id: string
          image_url: string | null
          price_hint: string | null
          service_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body?: string | null
          created_at?: string
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          price_hint?: string | null
          service_id?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string | null
          created_at?: string
          eyebrow?: string | null
          id?: string
          image_url?: string | null
          price_hint?: string | null
          service_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_showcase_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          ar_model_glb_url: string | null
          ar_model_usdz_url: string | null
          base_price_cents: number
          created_at: string
          description: string | null
          hero_image_url: string | null
          id: string
          name: string
          price_unit: Database["public"]["Enums"]["price_unit"]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          ar_model_glb_url?: string | null
          ar_model_usdz_url?: string | null
          base_price_cents?: number
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          name: string
          price_unit?: Database["public"]["Enums"]["price_unit"]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          ar_model_glb_url?: string | null
          ar_model_usdz_url?: string | null
          base_price_cents?: number
          created_at?: string
          description?: string | null
          hero_image_url?: string | null
          id?: string
          name?: string
          price_unit?: Database["public"]["Enums"]["price_unit"]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "enquiry"
        | "quoted"
        | "approved"
        | "booked"
        | "in_progress"
        | "completed"
        | "invoiced"
        | "paid"
        | "cancelled"
      email_status: "pending" | "sent" | "failed" | "skipped"
      invoice_status: "draft" | "sent" | "paid"
      price_unit: "fixed" | "per_metre" | "per_hour"
      question_input_type:
        | "single_select"
        | "multi_select"
        | "number"
        | "boolean"
        | "text"
      quote_status: "pending" | "approved" | "adjusted" | "rejected" | "expired"
      user_role: "customer" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "enquiry",
        "quoted",
        "approved",
        "booked",
        "in_progress",
        "completed",
        "invoiced",
        "paid",
        "cancelled",
      ],
      email_status: ["pending", "sent", "failed", "skipped"],
      invoice_status: ["draft", "sent", "paid"],
      price_unit: ["fixed", "per_metre", "per_hour"],
      question_input_type: [
        "single_select",
        "multi_select",
        "number",
        "boolean",
        "text",
      ],
      quote_status: ["pending", "approved", "adjusted", "rejected", "expired"],
      user_role: ["customer", "admin"],
    },
  },
} as const
