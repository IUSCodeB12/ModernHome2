"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { calcInvoiceTotals, normalizeLineItems } from "@/lib/invoice/calc";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

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
      .select("id, status, booking_id")
      .eq("id", parsed.data.invoiceId)
      .single();
    if (!invoice) throw new Error("Invoice not found.");
    if (invoice.status === "paid") {
      throw new Error("This invoice is paid and can't be edited.");
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
