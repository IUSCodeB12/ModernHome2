"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { canSendQuote } from "@/lib/bookings/status";
import { calcInvoiceTotals, normalizeLineItems, type LineItem } from "@/lib/invoice/calc";
import { notifyCustomer } from "@/lib/email/notify";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const idSchema = z.object({
  quoteId: z.string().min(1),
  /** Opt-in to discarding an existing custom line-item quote (see approveQuote). */
  replaceCustomQuote: z.boolean().optional(),
});

const lineItemSchema = z.object({
  description: z.string().min(1, "Description required").max(200),
  quantity: z.coerce.number().positive().max(1000),
  // Negative unit prices are legitimate — discounts and goodwill adjustments
  // are ordinary quote lines. The total is what has to stay above zero, and
  // that's checked across the whole set below.
  unit_price_cents: z.coerce
    .number()
    .int()
    .min(-100_000_000)
    .max(100_000_000),
});

const adjustSchema = z.object({
  quoteId: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
}).refine(
  (v) =>
    v.lineItems.reduce(
      (sum, it) => sum + Math.round(it.quantity * it.unit_price_cents),
      0
    ) > 0,
  { message: "The quote total has to be more than $0.", path: ["lineItems"] }
);

const rejectSchema = z.object({
  quoteId: z.string().min(1),
  reason: z.string().min(3, "Give a short reason").max(1000),
});

function demoOk<T extends object>(data: T): ActionResult<T> {
  return { ok: true, data } as ActionResult<T>;
}

/** Approve at the estimate midpoint; move booking to 'quoted'; email customer. */
export async function approveQuote(
  input: z.input<typeof idSchema>
): Promise<ActionResult<{ finalQuoteCents: number; warning?: string }>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  if (!isSupabaseConfigured()) return demoOk({ finalQuoteCents: 34000 });

  return adminAction(async ({ admin }) => {
    const { data: quote } = await admin
      .from("quote_requests")
      .select("id, customer_id, estimate_low_cents, estimate_high_cents, quote_line_items, profiles(full_name), services(name)")
      .eq("id", parsed.data.quoteId)
      .single();
    if (!quote) throw new Error("Quote not found.");

    // Approving at the midpoint discards any custom line-item quote already
    // built for this request. That's real work to lose, so make it explicit
    // rather than silently clobbering it.
    const existingItems = (quote.quote_line_items ?? []) as LineItem[];
    if (existingItems.length > 0 && !parsed.data.replaceCustomQuote) {
      throw new Error(
        "This quote already has a custom breakdown — approving as-is would discard it."
      );
    }

    // No auto-estimate (custom job) means there's no midpoint to approve at —
    // approving would quote the customer $0. Force the line-item builder.
    if (quote.estimate_low_cents == null || quote.estimate_high_cents == null) {
      throw new Error(
        "This request has no auto-estimate — use Adjust price to build the quote."
      );
    }

    const finalQuoteCents = Math.round(
      (quote.estimate_low_cents + quote.estimate_high_cents) / 2
    );

    const { error } = await admin
      .from("quote_requests")
      .update({
        status: "approved",
        final_quote_cents: finalQuoteCents,
        quote_line_items: [],
      })
      .eq("id", quote.id);
    if (error) throw new Error(error.message);

    const moved = await moveBookingToQuoted(admin, quote.id);
    // Price is in the key: re-approving at the same number is a no-op the
    // customer doesn't need to hear about, a new number is a new quote.
    await notifyCustomer(
      admin,
      quote.customer_id,
      "quote_ready",
      { service: quote.services?.name, amountCents: finalQuoteCents },
      {
        quoteRequestId: quote.id,
        dedupeKey: `quote_ready:${quote.id}:${finalQuoteCents}`,
      }
    );

    revalidatePath("/admin/quotes");
    revalidatePath("/admin/bookings");
    return { finalQuoteCents, warning: requoteWarning(moved) };
  });
}

/** Adjust with a line-item editor; recompute totals; status 'adjusted'. */
export async function adjustQuote(
  input: z.input<typeof adjustSchema>
): Promise<ActionResult<{ finalQuoteCents: number; warning?: string }>> {
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid line items." };
  }
  const items = normalizeLineItems(parsed.data.lineItems);
  const totals = calcInvoiceTotals(items);

  if (!isSupabaseConfigured()) return demoOk({ finalQuoteCents: totals.total_cents });

  return adminAction(async ({ admin }) => {
    const { data: quote } = await admin
      .from("quote_requests")
      .select("id, customer_id, services(name)")
      .eq("id", parsed.data.quoteId)
      .single();
    if (!quote) throw new Error("Quote not found.");

    const { error } = await admin
      .from("quote_requests")
      .update({
        status: "adjusted",
        final_quote_cents: totals.total_cents,
        quote_line_items: items,
      })
      .eq("id", quote.id);
    if (error) throw new Error(error.message);

    const moved = await moveBookingToQuoted(admin, quote.id);
    await notifyCustomer(
      admin,
      quote.customer_id,
      "quote_adjusted",
      { service: quote.services?.name, amountCents: totals.total_cents },
      {
        quoteRequestId: quote.id,
        dedupeKey: `quote_adjusted:${quote.id}:${totals.total_cents}`,
      }
    );

    revalidatePath("/admin/quotes");
    revalidatePath("/admin/bookings");
    return { finalQuoteCents: totals.total_cents, warning: requoteWarning(moved) };
  });
}

export async function rejectQuote(
  input: z.input<typeof rejectSchema>
): Promise<ActionResult<object>> {
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reason." };
  }

  if (!isSupabaseConfigured()) return demoOk({});

  return adminAction(async ({ admin }) => {
    const { data: quote } = await admin
      .from("quote_requests")
      .select("id, customer_id, admin_notes, services(name)")
      .eq("id", parsed.data.quoteId)
      .single();
    if (!quote) throw new Error("Quote not found.");

    const { error } = await admin
      .from("quote_requests")
      .update({ status: "rejected", admin_notes: parsed.data.reason })
      .eq("id", quote.id);
    if (error) throw new Error(error.message);

    // Cancel the linked booking, if any.
    await admin.from("bookings").update({ status: "cancelled" }).eq("quote_request_id", quote.id);
    // The reject dialog tells the admin "the customer will be notified with
    // this reason" — so it has to actually reach them, not just admin_notes.
    await notifyCustomer(
      admin,
      quote.customer_id,
      "quote_rejected",
      {
        service: quote.services?.name ?? "your request",
        reason: parsed.data.reason,
      },
      { quoteRequestId: quote.id, dedupeKey: `quote_rejected:${quote.id}` }
    );

    revalidatePath("/admin/quotes");
    revalidatePath("/admin/bookings");
    return {};
  });
}

// --- helpers ---------------------------------------------------------------

type Admin = Awaited<ReturnType<typeof import("@/lib/admin/guard").assertAdmin>>["admin"];

type MoveResult =
  | { moved: true }
  | { moved: false; reason: "no_booking" | "too_late"; status?: string };

async function moveBookingToQuoted(
  admin: Admin,
  quoteId: string
): Promise<MoveResult> {
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status")
    .eq("quote_request_id", quoteId)
    .maybeSingle();
  if (!booking) return { moved: false, reason: "no_booking" };

  if (!canSendQuote(booking.status)) {
    return { moved: false, reason: "too_late", status: booking.status };
  }

  const { error } = await admin
    .from("bookings")
    .update({ status: "quoted" })
    .eq("id", booking.id);
  if (error) throw new Error(error.message);
  return { moved: true };
}

/** Tells the admin when a saved quote won't actually surface to the customer. */
function requoteWarning(move: MoveResult): string | undefined {
  if (move.moved) return undefined;
  if (move.reason === "no_booking") {
    return "Saved, but this request has no booking, so the customer has nothing to accept.";
  }
  return `Saved, but the booking is already ${move.status} — the customer won't see an accept/decline prompt.`;
}

