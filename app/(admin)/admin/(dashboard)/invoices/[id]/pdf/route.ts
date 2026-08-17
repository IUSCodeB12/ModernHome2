import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { assertAdmin, AdminAuthError } from "@/lib/admin/guard";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { ReceiptDocument } from "@/lib/invoice/receipt-pdf";
import { receiptAddress, toReceiptData } from "@/lib/invoice/receipt-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The admin's copy of a tax invoice, by invoice id.
 *
 * The PDF already existed, but only at `/portal/[id]/receipt` — keyed by *quote*
 * id and scoped by RLS to the customer who owns it. The tradie had no way to
 * open a bill they had issued, which made "what exactly did I send them?"
 * unanswerable from the dashboard.
 *
 * Renders through the same `toReceiptData` mapper as the customer route, so
 * this is the document the customer sees, not a lookalike.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return new Response("Not available", { status: 404 });
  }

  let admin;
  try {
    ({ admin } = await assertAdmin());
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return new Response("Unauthorised", { status: 401 });
    }
    throw err;
  }

  const { data: invoice } = await admin
    .from("invoices")
    .select(
      "*, bookings(address_line1, suburb, postcode, quote_requests(profiles(full_name), services(name)))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!invoice) return new Response("Invoice not found", { status: 404 });

  const quote = invoice.bookings?.quote_requests;
  const data = toReceiptData(invoice, {
    serviceName: quote?.services?.name ?? "Installation",
    customerName: quote?.profiles?.full_name ?? "Customer",
    address: receiptAddress(invoice.bookings),
  });

  const element = createElement(ReceiptDocument, { data }) as unknown as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
