import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { LineItem } from "@/lib/invoice/calc";
import type { Enums } from "@/lib/database.types";

export type AdminInvoiceRow = {
  id: string;
  invoice_number: string;
  total_cents: number;
  status: Enums<"invoice_status">;
  created_at: string;
  paid_at: string | null;
  customerName: string;
  serviceName: string;
  lineItems: LineItem[];
};

export async function getInvoices(): Promise<{
  invoices: AdminInvoiceRow[];
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return {
      demo: true,
      invoices: [
        {
          id: "demo-inv-1",
          invoice_number: "INV-0001",
          total_cents: 130000,
          status: "paid",
          created_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          customerName: "Jordan Nguyen",
          serviceName: "TV Wall Mounting",
          lineItems: [
            { description: "TV Wall Mounting — installation", quantity: 1, unit_price_cents: 130000, total_cents: 130000 },
          ],
        },
        {
          id: "demo-inv-2",
          invoice_number: "INV-0002",
          total_cents: 61000,
          status: "sent",
          created_at: new Date().toISOString(),
          paid_at: null,
          customerName: "Priya Sharma",
          serviceName: "LED Strip Lighting",
          lineItems: [
            { description: "LED Strip Lighting — 6m", quantity: 6, unit_price_cents: 10167, total_cents: 61000 },
          ],
        },
      ],
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, total_cents, status, created_at, paid_at, line_items, bookings(quote_requests(profiles(full_name), services(name)))"
    )
    .order("created_at", { ascending: false });

  const invoices: AdminInvoiceRow[] = (data ?? []).map((inv) => {
    const quote = inv.bookings?.quote_requests;
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      total_cents: inv.total_cents,
      status: inv.status,
      created_at: inv.created_at,
      paid_at: inv.paid_at,
      customerName: quote?.profiles?.full_name ?? "Customer",
      serviceName: quote?.services?.name ?? "—",
      lineItems: (inv.line_items ?? []) as LineItem[],
    };
  });

  return { invoices, demo: false };
}
