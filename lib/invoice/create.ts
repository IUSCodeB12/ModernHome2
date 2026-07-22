import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { calcInvoiceTotals, type LineItem } from "@/lib/invoice/calc";

type Admin = SupabaseClient<Database>;

/**
 * Ensure an invoice exists for a booking. Built from the accepted
 * `quote_line_items` (adjusted quote); falls back to a single line for the
 * final quote total. Idempotent — a booking never gets two invoices.
 * Returns the invoice id, or null when there's nothing to bill.
 */
export async function ensureInvoiceForBooking(
  admin: Admin,
  bookingId: string
): Promise<string | null> {
  const { data: existing } = await admin
    .from("invoices")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, quote_requests(final_quote_cents, quote_line_items, services(name))"
    )
    .eq("id", bookingId)
    .single();

  const quote = booking?.quote_requests;
  if (!quote) return null;

  const stored = (quote.quote_line_items ?? []) as LineItem[];
  const serviceName = quote.services?.name ?? "Installation";
  const final = quote.final_quote_cents ?? 0;

  const items: LineItem[] = stored.length
    ? stored
    : final > 0
      ? [
          {
            description: `${serviceName} — installation`,
            quantity: 1,
            unit_price_cents: final,
            total_cents: final,
          },
        ]
      : [];
  if (!items.length) return null;

  const totals = calcInvoiceTotals(items);
  const { data: created, error } = await admin
    .from("invoices")
    .insert({
      booking_id: bookingId,
      line_items: items,
      subtotal_cents: totals.subtotal_cents,
      gst_cents: totals.gst_cents,
      total_cents: totals.total_cents,
      status: "sent",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}

/** Mark a booking's invoice as paid (offline payment recorded by admin). */
export async function markInvoicePaidForBooking(admin: Admin, bookingId: string) {
  await admin
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .neq("status", "paid");
}
