import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoQuotes } from "@/lib/admin/demo";
import type { Tables } from "@/lib/database.types";

export type CustomerRow = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "phone" | "suburb" | "postcode" | "created_at"
> & {
  quote_requests: { id: string; status: string; final_quote_cents: number | null }[];
  bookings: { id: string; status: string; slot_start: string | null }[];
};

export async function getCustomers(): Promise<{ customers: CustomerRow[]; demo: boolean }> {
  if (!isSupabaseConfigured()) {
    const quotes = demoQuotes();
    const customers: CustomerRow[] = [
      {
        id: "demo-cust-1", full_name: "Jordan Nguyen", phone: "0400 111 222",
        suburb: "Richmond", postcode: "3121", created_at: quotes[0].created_at,
        quote_requests: [{ id: quotes[0].id, status: quotes[0].status, final_quote_cents: quotes[0].final_quote_cents }],
        bookings: [{ id: "demo-booking-1", status: "enquiry", slot_start: quotes[0].bookings?.slot_start ?? null }],
      },
      {
        id: "demo-cust-2", full_name: "Priya Sharma", phone: "0400 333 444",
        suburb: "Carlton", postcode: "3053", created_at: quotes[1].created_at,
        quote_requests: [{ id: quotes[1].id, status: quotes[1].status, final_quote_cents: quotes[1].final_quote_cents }],
        bookings: [{ id: "demo-booking-2", status: "quoted", slot_start: quotes[1].bookings?.slot_start ?? null }],
      },
    ];
    return { customers, demo: true };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, suburb, postcode, created_at, quote_requests(id, status, final_quote_cents), bookings(id, status, slot_start)"
    )
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  return { customers: (data ?? []) as unknown as CustomerRow[], demo: false };
}
