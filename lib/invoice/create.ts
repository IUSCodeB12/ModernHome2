import { addDays, formatISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { calcInvoiceTotals, PAYMENT_TERMS_DAYS, type LineItem } from "@/lib/invoice/calc";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";

type Admin = SupabaseClient<Database>;

/**
 * What the deposit knocks off this bill.
 *
 * Only a deposit that has actually been *paid* is credited — `deposit_cents`
 * on its own is the amount we asked for, and crediting an unpaid ask would
 * hand the customer money they never sent. Capped at the invoice total: a
 * deposit larger than the final bill is a refund, not a negative invoice, and
 * this codepath has no way to move money back.
 */
export function depositCreditCents(
  depositCents: number | null | undefined,
  depositPaidAt: string | null | undefined,
  invoiceTotalCents: number
): number {
  if (!depositPaidAt) return 0;
  const deposit = depositCents ?? 0;
  if (deposit <= 0) return 0;
  return Math.min(deposit, invoiceTotalCents);
}

/**
 * The date an invoice raised now falls due, as a plain `YYYY-MM-DD`.
 *
 * Computed in Australia/Melbourne: a job invoiced at 9pm Melbourne time is due
 * that day, not the UTC day before it.
 */
export function dueDateFor(issuedAt: Date): string {
  const local = toZonedTime(issuedAt, BUSINESS_TIME_ZONE);
  return formatISO(addDays(local, PAYMENT_TERMS_DAYS), { representation: "date" });
}

/**
 * Decide what to bill for a job. Prefers the itemised breakdown the admin sent
 * with the adjusted quote; falls back to a single line at the final quoted
 * price. Returns [] when there's nothing to bill (no breakdown, no price).
 *
 * Pure and separated from the DB read so the billing decision — the part that
 * decides what a customer is charged — is unit-testable.
 */
export function buildInvoiceItems(
  storedLineItems: LineItem[] | null | undefined,
  finalQuoteCents: number | null | undefined,
  serviceName: string
): LineItem[] {
  const stored = storedLineItems ?? [];
  if (stored.length) return stored;

  const final = finalQuoteCents ?? 0;
  if (final <= 0) return [];

  return [
    {
      description: `${serviceName} — installation`,
      quantity: 1,
      unit_price_cents: final,
      total_cents: final,
    },
  ];
}

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
      "id, deposit_cents, deposit_paid_at, quote_requests(final_quote_cents, quote_line_items, services(name))"
    )
    .eq("id", bookingId)
    .single();

  const quote = booking?.quote_requests;
  if (!quote) return null;

  const items = buildInvoiceItems(
    quote.quote_line_items as LineItem[] | null,
    quote.final_quote_cents,
    quote.services?.name ?? "Installation"
  );
  if (!items.length) return null;

  const totals = calcInvoiceTotals(items);
  // The deposit is credited at issue time and stored on the invoice, rather
  // than joined through to the booking on every read. A bill the customer has
  // been sent must not restate itself later because a booking column moved.
  const depositCredit = depositCreditCents(
    booking.deposit_cents,
    booking.deposit_paid_at,
    totals.total_cents
  );

  const { data: created, error } = await admin
    .from("invoices")
    .insert({
      booking_id: bookingId,
      line_items: items,
      subtotal_cents: totals.subtotal_cents,
      gst_cents: totals.gst_cents,
      total_cents: totals.total_cents,
      deposit_credit_cents: depositCredit,
      // The deposit is money already received, so it counts as paid from the
      // moment the invoice exists — that's what makes the balance correct.
      amount_paid_cents: depositCredit,
      due_date: dueDateFor(new Date()),
      status: "sent",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}

/**
 * Mark a booking's invoice as paid in full (offline payment recorded by admin).
 *
 * Settles the balance as well as the status: `amount_paid_cents` is raised to
 * the total, so a part-paid invoice being closed out records the remainder
 * instead of leaving a balance that disagrees with its own status.
 */
export async function markInvoicePaidForBooking(admin: Admin, bookingId: string) {
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, total_cents")
    .eq("booking_id", bookingId)
    .neq("status", "paid")
    .maybeSingle();
  if (!invoice) return;

  await admin
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      amount_paid_cents: invoice.total_cents,
    })
    .eq("id", invoice.id);
}
