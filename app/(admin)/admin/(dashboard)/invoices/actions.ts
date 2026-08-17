"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { calcInvoiceTotals, normalizeLineItems } from "@/lib/invoice/calc";
import { formatAud } from "@/lib/quote/estimate";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { updateBookingStatus } from "@/app/(admin)/admin/(dashboard)/bookings/actions";

const schema = z.object({
  invoiceId: z.string().min(1),
  lineItems: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Add a description"),
        quantity: z.number().positive(),
        unit_price_cents: z.number().int().nonnegative(),
      })
    )
    .min(1, "At least one line is required"),
});

/**
 * Replace an invoice's line items (e.g. adding extra on-site work agreed on the
 * day) and recompute totals. Paid invoices are locked.
 */
export async function updateInvoiceItems(
  input: z.input<typeof schema>
): Promise<ActionResult<{ totalCents: number }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid line items." };
  }

  const items = normalizeLineItems(parsed.data.lineItems);
  const totals = calcInvoiceTotals(items);

  if (!isSupabaseConfigured()) {
    return { ok: true, data: { totalCents: totals.total_cents } };
  }

  return adminAction(async ({ admin }) => {
    const { data: invoice } = await admin
      .from("invoices")
      .select("id, status, booking_id, deposit_credit_cents")
      .eq("id", parsed.data.invoiceId)
      .single();
    if (!invoice) throw new Error("Invoice not found.");
    if (invoice.status === "paid") {
      throw new Error("This invoice is paid and can't be edited.");
    }
    // Below the credited deposit the bill would owe the customer money, which
    // is a refund — there's no path for that here, and a DB check constraint
    // would otherwise reject the write with an unreadable Postgres error.
    if (totals.total_cents < invoice.deposit_credit_cents) {
      throw new Error(
        `Total can't be less than the ${formatAud(invoice.deposit_credit_cents)} deposit already paid. Refund the difference separately.`
      );
    }

    const { error } = await admin
      .from("invoices")
      .update({
        line_items: items,
        subtotal_cents: totals.subtotal_cents,
        gst_cents: totals.gst_cents,
        total_cents: totals.total_cents,
      })
      .eq("id", invoice.id);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/invoices");
    revalidatePath("/portal");
    return { totalCents: totals.total_cents };
  });
}

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  /** Dollars from the form, converted to cents by the caller. */
  amountCents: z.number().int().positive("Enter an amount greater than zero."),
});

/**
 * Record money received against an invoice.
 *
 * Payment is offline — cash or card to the installer on site, or a bank
 * transfer — so the admin is the only thing that knows it happened. Accepts a
 * part payment: the invoice settles only once the balance reaches zero, at
 * which point the booking follows it to `paid` so the customer's portal, the
 * receipt email and the dashboard's revenue figure all agree.
 */
export async function recordInvoicePayment(
  input: z.input<typeof paymentSchema>
): Promise<ActionResult<{ balanceCents: number; settled: boolean }>> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payment." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true, data: { balanceCents: 0, settled: true } };
  }

  return adminAction(async ({ admin }) => {
    const { data: invoice } = await admin
      .from("invoices")
      .select("id, booking_id, status, total_cents, amount_paid_cents, bookings(status)")
      .eq("id", parsed.data.invoiceId)
      .single();
    if (!invoice) throw new Error("Invoice not found.");
    if (invoice.status === "paid") {
      throw new Error("This invoice is already settled.");
    }

    // Clamp rather than reject: taking $500 against a $480 balance is a
    // rounding-up tip or a miskey, and refusing to record the payment at all
    // would leave the invoice looking unpaid. The overpayment isn't invented
    // as a credit — the invoice simply reads settled.
    const amountPaid = Math.min(
      invoice.total_cents,
      invoice.amount_paid_cents + parsed.data.amountCents
    );
    const settled = amountPaid >= invoice.total_cents;

    const { error } = await admin
      .from("invoices")
      .update({
        amount_paid_cents: amountPaid,
        ...(settled ? { status: "paid" as const, paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", invoice.id);
    if (error) throw new Error(error.message);

    // Settling the bill moves the job. Routed through the booking transition so
    // the receipt email and its dedupe key behave exactly as they do when an
    // admin marks the job paid from the bookings board.
    //
    // Guarded by the state machine rather than assumed: a booking dragged back
    // to 'completed' after its invoice was raised can't legally jump to 'paid',
    // and letting that throw here would roll the admin's payment record back
    // over a bookkeeping technicality. The money is the fact worth keeping; the
    // board can be moved by hand.
    if (settled && invoice.bookings?.status === "invoiced") {
      await updateBookingStatus({ bookingId: invoice.booking_id, toStatus: "paid" });
    }

    revalidatePath("/admin/invoices");
    revalidatePath("/admin");
    revalidatePath("/portal");
    return { balanceCents: invoice.total_cents - amountPaid, settled };
  });
}
