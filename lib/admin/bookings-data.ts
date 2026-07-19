import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoQuotes } from "@/lib/admin/demo";
import type { Tables } from "@/lib/database.types";

export type AdminBookingRow = Tables<"bookings"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "phone"> | null;
  quote_requests:
    | (Pick<Tables<"quote_requests">, "id" | "status" | "final_quote_cents" | "estimate_low_cents" | "estimate_high_cents"> & {
        services: Pick<Tables<"services">, "name"> | null;
      })
    | null;
  invoices: Pick<Tables<"invoices">, "id" | "invoice_number" | "status" | "total_cents">[];
};

export async function getAdminBookings(): Promise<{
  bookings: AdminBookingRow[];
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    const quotes = demoQuotes();
    const bookings = quotes
      .filter((q) => q.bookings)
      .map((q) => ({
        ...q.bookings!,
        profiles: q.profiles ? { full_name: q.profiles.full_name, phone: q.profiles.phone } : null,
        quote_requests: {
          id: q.id,
          status: q.status,
          final_quote_cents: q.final_quote_cents,
          estimate_low_cents: q.estimate_low_cents,
          estimate_high_cents: q.estimate_high_cents,
          services: { name: q.services.name },
        },
        invoices: [],
      })) as AdminBookingRow[];
    return { bookings, demo: true };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "*, profiles(full_name, phone), quote_requests(id, status, final_quote_cents, estimate_low_cents, estimate_high_cents, services(name)), invoices(id, invoice_number, status, total_cents)"
    )
    .order("slot_start", { ascending: true, nullsFirst: false });
  return { bookings: (data ?? []) as unknown as AdminBookingRow[], demo: false };
}
