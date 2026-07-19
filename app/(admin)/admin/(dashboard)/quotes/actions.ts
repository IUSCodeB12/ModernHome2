"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { calcInvoiceTotals, normalizeLineItems } from "@/lib/invoice/calc";
import { sendEmail } from "@/lib/email/send";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const idSchema = z.object({ quoteId: z.string().min(1) });

const lineItemSchema = z.object({
  description: z.string().min(1, "Description required").max(200),
  quantity: z.coerce.number().positive().max(1000),
  unit_price_cents: z.coerce.number().int().min(0).max(100_000_000),
});

const adjustSchema = z.object({
  quoteId: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
});

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
): Promise<ActionResult<{ finalQuoteCents: number }>> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  if (!isSupabaseConfigured()) return demoOk({ finalQuoteCents: 34000 });

  return adminAction(async ({ admin }) => {
    const { data: quote } = await admin
      .from("quote_requests")
      .select("id, customer_id, estimate_low_cents, estimate_high_cents, profiles(full_name), services(name)")
      .eq("id", parsed.data.quoteId)
      .single();
    if (!quote) throw new Error("Quote not found.");

    const low = quote.estimate_low_cents ?? 0;
    const high = quote.estimate_high_cents ?? 0;
    const finalQuoteCents = Math.round((low + high) / 2);

    const { error } = await admin
      .from("quote_requests")
      .update({ status: "approved", final_quote_cents: finalQuoteCents })
      .eq("id", quote.id);
    if (error) throw new Error(error.message);

    await moveBookingToQuoted(admin, quote.id);
    await notifyCustomer(admin, quote.customer_id, "quote_ready", {
      service: quote.services?.name,
      amountCents: finalQuoteCents,
    });

    revalidatePath("/admin/quotes");
    revalidatePath("/admin/bookings");
    return { finalQuoteCents };
  });
}

/** Adjust with a line-item editor; recompute totals; status 'adjusted'. */
export async function adjustQuote(
  input: z.input<typeof adjustSchema>
): Promise<ActionResult<{ finalQuoteCents: number }>> {
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
      .update({ status: "adjusted", final_quote_cents: totals.total_cents })
      .eq("id", quote.id);
    if (error) throw new Error(error.message);

    await moveBookingToQuoted(admin, quote.id);
    await notifyCustomer(admin, quote.customer_id, "quote_adjusted", {
      service: quote.services?.name,
      amountCents: totals.total_cents,
      lineItems: items,
    });

    revalidatePath("/admin/quotes");
    revalidatePath("/admin/bookings");
    return { finalQuoteCents: totals.total_cents };
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
      .select("id, customer_id, admin_notes")
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
    await notifyCustomer(admin, quote.customer_id, "quote_rejected", {
      reason: parsed.data.reason,
    });

    revalidatePath("/admin/quotes");
    revalidatePath("/admin/bookings");
    return {};
  });
}

// --- helpers ---------------------------------------------------------------

type Admin = Awaited<ReturnType<typeof import("@/lib/admin/guard").assertAdmin>>["admin"];

async function moveBookingToQuoted(admin: Admin, quoteId: string) {
  await admin
    .from("bookings")
    .update({ status: "quoted" })
    .eq("quote_request_id", quoteId)
    .eq("status", "enquiry");
}

async function notifyCustomer(
  admin: Admin,
  customerId: string,
  template: Parameters<typeof sendEmail>[0]["template"],
  data: Record<string, unknown>
) {
  const { data: authUser } = await admin.auth.admin.getUserById(customerId);
  const to = authUser?.user?.email;
  if (!to) return;
  // TODO(resend): sendEmail is a stub until Phase 4.
  await sendEmail({
    to,
    template,
    subject:
      template === "quote_rejected"
        ? "An update on your ModernHome quote"
        : "Your ModernHome quote is ready",
    data,
  });
}
