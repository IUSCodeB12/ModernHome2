import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { ReceiptDocument } from "@/lib/invoice/receipt-pdf";
import { receiptAddress, toReceiptData } from "@/lib/invoice/receipt-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a freshly-rendered PDF receipt for the customer's own invoice.
 *
 * Scoped by `customer_id` as well as RLS. RLS alone is not enough here: the
 * admin policies grant staff every row, so relying on it let a signed-in admin
 * pull any customer's tax invoice through the customer route. Admins have their
 * own copy at /admin/invoices/[id]/pdf.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // `?download=1` forces a save instead of an in-tab preview. Viewing and
  // saving are genuinely different intents on a tax invoice — one is a glance,
  // the other is the copy they keep for their records.
  const download = new URL(req.url).searchParams.get("download") === "1";
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
    .eq("customer_id", user.id)
    .maybeSingle();

  const invoice = quote?.bookings?.invoices?.[0];
  if (!quote || !invoice) return new Response("No invoice yet", { status: 404 });

  const data = toReceiptData(invoice, {
    serviceName: quote.services?.name ?? "Installation",
    customerName: quote.profiles?.full_name ?? "Customer",
    address: receiptAddress(quote.bookings),
  });

  const element = createElement(ReceiptDocument, { data }) as unknown as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
