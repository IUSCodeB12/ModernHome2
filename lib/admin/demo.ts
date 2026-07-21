import { addDays } from "date-fns";
import type { Answers } from "@/lib/quote/estimate";
import type { Tables } from "@/lib/database.types";

/**
 * Demo fixtures for the admin dashboard when Supabase env vars aren't set.
 * Enough to exercise the quote → adjust → approve → calendar walkthrough in
 * a local preview. Mutations in demo mode are not persisted.
 */

export type AdminQuoteRow = Tables<"quote_requests"> & {
  services: Pick<Tables<"services">, "name" | "price_unit" | "base_price_cents"> & {
    service_questions: Tables<"service_questions">[];
  };
  profiles: Pick<Tables<"profiles">, "full_name" | "phone" | "suburb" | "postcode"> | null;
  bookings: Tables<"bookings"> | null;
};

const now = new Date();

const tvQuestions: Tables<"service_questions">[] = [
  {
    id: "d1-size", service_id: "svc-tv", question_text: "What size is your TV?",
    input_type: "single_select",
    options: [
      { label: 'Up to 43"', value: "43", price_modifier_cents: 0, price_modifier_pct: null },
      { label: '55"', value: "55", price_modifier_cents: 2000, price_modifier_pct: null },
      { label: '65"', value: "65", price_modifier_cents: 4000, price_modifier_pct: null },
      { label: '75" or larger', value: "75plus", price_modifier_cents: 7000, price_modifier_pct: null },
    ],
    requires_photo: false, photo_guide_text: null, sort_order: 1, created_at: "", updated_at: "",
  },
  {
    id: "d1-wall", service_id: "svc-tv", question_text: "What type of wall?",
    input_type: "single_select",
    options: [
      { label: "Plasterboard", value: "plasterboard", price_modifier_cents: 0, price_modifier_pct: null },
      { label: "Brick", value: "brick", price_modifier_cents: 5000, price_modifier_pct: null },
      { label: "Concrete", value: "concrete", price_modifier_cents: 8000, price_modifier_pct: null },
    ],
    requires_photo: true, photo_guide_text: "Photo of the wall.", sort_order: 2, created_at: "", updated_at: "",
  },
  {
    id: "d1-cables", service_id: "svc-tv", question_text: "Conceal the cables?",
    input_type: "boolean",
    options: [{ label: "Yes, hide my cables", value: "yes", price_modifier_cents: 12000, price_modifier_pct: null }],
    requires_photo: false, photo_guide_text: null, sort_order: 3, created_at: "", updated_at: "",
  },
];

export function demoQuotes(): AdminQuoteRow[] {
  const answers: Answers = { "d1-size": "65", "d1-wall": "brick", "d1-cables": true };
  return [
    {
      id: "demo-quote-1",
      customer_id: "demo-cust-1",
      service_id: "svc-tv",
      answers,
      photo_urls: ["demo-cust-1/demo-quote-1/d1-wall-0.jpg"],
      estimate_low_cents: 29000,
      estimate_high_cents: 39000,
      status: "pending",
      admin_notes: null,
      final_quote_cents: null,
      quote_line_items: [],
      expires_at: addDays(now, 14).toISOString(),
      created_at: addDays(now, -1).toISOString(),
      updated_at: addDays(now, -1).toISOString(),
      services: {
        name: "TV Wall Mounting", price_unit: "fixed", base_price_cents: 14900,
        service_questions: tvQuestions,
      },
      profiles: { full_name: "Jordan Nguyen", phone: "0400 111 222", suburb: "Richmond", postcode: "3121" },
      bookings: {
        id: "demo-booking-1", quote_request_id: "demo-quote-1", customer_id: "demo-cust-1",
        slot_start: addDays(now, 2).toISOString(), slot_end: addDays(now, 2).toISOString(),
        status: "enquiry", deposit_cents: 6780, deposit_paid_at: null,
        stripe_checkout_session_id: null, address_line1: "12 Sample St", suburb: "Richmond",
        postcode: "3121", access_notes: "Side gate, mind the dog.",
        created_at: addDays(now, -1).toISOString(), updated_at: addDays(now, -1).toISOString(),
      },
    },
    {
      id: "demo-quote-2",
      customer_id: "demo-cust-2",
      service_id: "svc-led",
      answers: { "d4-length": 6 } as Answers,
      photo_urls: [],
      estimate_low_cents: 45000,
      estimate_high_cents: 61000,
      status: "approved",
      admin_notes: null,
      final_quote_cents: 53000,
      quote_line_items: [],
      expires_at: addDays(now, 14).toISOString(),
      created_at: addDays(now, -3).toISOString(),
      updated_at: addDays(now, -2).toISOString(),
      services: { name: "LED Strip Lighting", price_unit: "per_metre", base_price_cents: 8500, service_questions: [] },
      profiles: { full_name: "Priya Sharma", phone: "0400 333 444", suburb: "Carlton", postcode: "3053" },
      bookings: {
        id: "demo-booking-2", quote_request_id: "demo-quote-2", customer_id: "demo-cust-2",
        slot_start: addDays(now, 1).toISOString(), slot_end: addDays(now, 1).toISOString(),
        status: "quoted", deposit_cents: 10600, deposit_paid_at: null,
        stripe_checkout_session_id: null, address_line1: "5 Example Rd", suburb: "Carlton",
        postcode: "3053", access_notes: null,
        created_at: addDays(now, -3).toISOString(), updated_at: addDays(now, -2).toISOString(),
      },
    },
  ];
}
