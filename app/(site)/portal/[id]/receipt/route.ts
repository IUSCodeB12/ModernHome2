import { createElement } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { renderToBuffer } from "@react-pdf/renderer";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { ReceiptDocument, type ReceiptData } from "@/lib/invoice/receipt-pdf";
import type { LineItem } from "@/lib/invoice/calc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a freshly-rendered PDF receipt for the customer's own invoice.
 * RLS (invoices_select_own) scopes the read to the signed-in customer, so
 * no service-role access is needed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return new Response("Not available", { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorised", { status: 401 });

  const { data: quote } = await supabase
    .from("quote_requests")
    .select(
      "id, services(name), profiles(full_name), bookings(address_line1, suburb, postcode, invoices(*))"
    )
    .eq("id", id)
    .maybeSingle();

  const invoice = quote?.bookings?.invoices?.[0];
  if (!quote || !invoice) return new Response("No invoice yet", { status: 404 });

  const booking = quote.bookings;
  const fmt = (iso: string) =>
    formatInTimeZone(new Date(iso), BUSINESS_TIME_ZONE, "d MMM yyyy");

  const data: ReceiptData = {
    invoiceNumber: invoice.invoice_number,
    status: invoice.status,
    paidAt: invoice.paid_at ? fmt(invoice.paid_at) : null,
    issuedAt: fmt(invoice.created_at),
    serviceName: quote.services?.name ?? "Installation",
    customerName: quote.profiles?.full_name ?? "Customer",
    address: booking?.address_line1
      ? `${booking.address_line1}, ${booking.suburb ?? ""} ${booking.postcode ?? ""}`.trim()
      : null,
    lineItems: (invoice.line_items ?? []) as LineItem[],
    subtotalCents: invoice.subtotal_cents,
    gstCents: invoice.gst_cents,
    totalCents: invoice.total_cents,
  };

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
