// Database types for the ModernHome Supabase schema.
// Matches supabase/migrations. Regenerate after schema changes with:
//   pnpm supabase gen types typescript --linked > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          suburb: string | null;
          postcode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          suburb?: string | null;
          postcode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          suburb?: string | null;
          postcode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          base_price_cents: number;
          price_unit: Database["public"]["Enums"]["price_unit"];
          active: boolean;
          sort_order: number;
          ar_model_glb_url: string | null;
          ar_model_usdz_url: string | null;
          hero_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          base_price_cents?: number;
          price_unit?: Database["public"]["Enums"]["price_unit"];
          active?: boolean;
          sort_order?: number;
          ar_model_glb_url?: string | null;
          ar_model_usdz_url?: string | null;
          hero_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          base_price_cents?: number;
          price_unit?: Database["public"]["Enums"]["price_unit"];
          active?: boolean;
          sort_order?: number;
          ar_model_glb_url?: string | null;
          ar_model_usdz_url?: string | null;
          hero_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_questions: {
        Row: {
          id: string;
          service_id: string;
          question_text: string;
          input_type: Database["public"]["Enums"]["question_input_type"];
          options: Json | null;
          requires_photo: boolean;
          photo_guide_text: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          question_text: string;
          input_type: Database["public"]["Enums"]["question_input_type"];
          options?: Json | null;
          requires_photo?: boolean;
          photo_guide_text?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          question_text?: string;
          input_type?: Database["public"]["Enums"]["question_input_type"];
          options?: Json | null;
          requires_photo?: boolean;
          photo_guide_text?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_questions_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_requests: {
        Row: {
          id: string;
          customer_id: string;
          service_id: string;
          answers: Json;
          photo_urls: string[];
          estimate_low_cents: number | null;
          estimate_high_cents: number | null;
          status: Database["public"]["Enums"]["quote_status"];
          admin_notes: string | null;
          final_quote_cents: number | null;
          quote_line_items: Json;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          service_id: string;
          answers?: Json;
          photo_urls?: string[];
          estimate_low_cents?: number | null;
          estimate_high_cents?: number | null;
          status?: Database["public"]["Enums"]["quote_status"];
          admin_notes?: string | null;
          final_quote_cents?: number | null;
          quote_line_items?: Json;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          service_id?: string;
          answers?: Json;
          photo_urls?: string[];
          estimate_low_cents?: number | null;
          estimate_high_cents?: number | null;
          status?: Database["public"]["Enums"]["quote_status"];
          admin_notes?: string | null;
          final_quote_cents?: number | null;
          quote_line_items?: Json;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_requests_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_requests_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          quote_request_id: string | null;
          customer_id: string;
          slot_start: string | null;
          slot_end: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          deposit_cents: number | null;
          deposit_paid_at: string | null;
          reschedule_requested_at: string | null;
          reschedule_note: string | null;
          assigned_installer: string | null;
          stripe_checkout_session_id: string | null;
          address_line1: string | null;
          suburb: string | null;
          postcode: string | null;
          access_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_request_id?: string | null;
          customer_id: string;
          slot_start?: string | null;
          slot_end?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          deposit_cents?: number | null;
          deposit_paid_at?: string | null;
          reschedule_requested_at?: string | null;
          reschedule_note?: string | null;
          assigned_installer?: string | null;
          stripe_checkout_session_id?: string | null;
          address_line1?: string | null;
          suburb?: string | null;
          postcode?: string | null;
          access_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_request_id?: string | null;
          customer_id?: string;
          slot_start?: string | null;
          slot_end?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          deposit_cents?: number | null;
          deposit_paid_at?: string | null;
          reschedule_requested_at?: string | null;
          reschedule_note?: string | null;
          assigned_installer?: string | null;
          stripe_checkout_session_id?: string | null;
          address_line1?: string | null;
          suburb?: string | null;
          postcode?: string | null;
          access_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_quote_request_id_fkey";
            columns: ["quote_request_id"];
            isOneToOne: true;
            referencedRelation: "quote_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocked_dates: {
        Row: {
          id: string;
          date: string;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          booking_id: string;
          invoice_number: string;
          line_items: Json;
          subtotal_cents: number;
          gst_cents: number;
          total_cents: number;
          status: Database["public"]["Enums"]["invoice_status"];
          pdf_url: string | null;
          paid_at: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          invoice_number?: string;
          line_items?: Json;
          subtotal_cents?: number;
          gst_cents?: number;
          total_cents?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          pdf_url?: string | null;
          paid_at?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          invoice_number?: string;
          line_items?: Json;
          subtotal_cents?: number;
          gst_cents?: number;
          total_cents?: number;
          status?: Database["public"]["Enums"]["invoice_status"];
          pdf_url?: string | null;
          paid_at?: string | null;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_items: {
        Row: {
          id: string;
          title: string;
          service_id: string | null;
          before_image_url: string;
          after_image_url: string | null;
          featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          service_id?: string | null;
          before_image_url: string;
          after_image_url?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          service_id?: string | null;
          before_image_url?: string;
          after_image_url?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "customer" | "admin";
      price_unit: "fixed" | "per_metre" | "per_hour";
      question_input_type:
        | "single_select"
        | "multi_select"
        | "number"
        | "boolean";
      quote_status: "pending" | "approved" | "adjusted" | "rejected" | "expired";
      booking_status:
        | "enquiry"
        | "quoted"
        | "approved"
        | "booked"
        | "in_progress"
        | "completed"
        | "invoiced"
        | "paid"
        | "cancelled";
      invoice_status: "draft" | "sent" | "paid";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
