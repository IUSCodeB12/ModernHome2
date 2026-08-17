import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { calcInvoiceBalance, type InvoiceBalance, type LineItem } from "@/lib/invoice/calc";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import type { Enums } from "@/lib/database.types";

export type AdminInvoiceRow = {
  id: string;
  invoice_number: string;
  total_cents: number;
  deposit_credit_cents: number;
  amount_paid_cents: number;
  due_date: string | null;
  status: Enums<"invoice_status">;
  created_at: string;
  paid_at: string | null;
  customerName: string;
  serviceName: string;
  lineItems: LineItem[];
  /** Derived payment state — balance, part-paid, overdue. */
  balance: InvoiceBalance;
};

/** Money still owed across every unsettled invoice, for the list header. */
export type InvoiceTotals = {
  outstandingCents: number;
  overdueCents: number;
  overdueCount: number;
};

function summarize(invoices: AdminInvoiceRow[]): InvoiceTotals {
  return invoices.reduce<InvoiceTotals>(
    (acc, inv) => {
      if (inv.balance.settled) return acc;
      acc.outstandingCents += inv.balance.balanceCents;
      if (inv.balance.overdue) {
        acc.overdueCents += inv.balance.balanceCents;
        acc.overdueCount += 1;
      }
      return acc;
    },
    { outstandingCents: 0, overdueCents: 0, overdueCount: 0 }
  );
}

export async function getInvoices(): Promise<{
  invoices: AdminInvoiceRow[];
  totals: InvoiceTotals;
  demo: boolean;
}> {
  // One "today" for the whole list, in the business time zone: rows compared
  // against different dates could disagree about what's overdue mid-render.
  const today = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const withBalance = (
    row: Omit<AdminInvoiceRow, "balance">
  ): AdminInvoiceRow => ({ ...row, balance: calcInvoiceBalance(row, today) });

  if (!isSupabaseConfigured()) {
    const invoices = [
      {
        id: "demo-inv-1",
        invoice_number: "INV-0001",
        total_cents: 130000,
        deposit_credit_cents: 26000,
        amount_paid_cents: 130000,
        due_date: today,
        status: "paid" as const,
        created_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        customerName: "Jordan Nguyen",
        serviceName: "TV Wall Mounting",
        lineItems: [
          { description: "TV Wall Mounting — installation", quantity: 1, unit_price_cents: 130000, total_cents: 130000 },
        ],
      },
      {
        // Part-paid: a deposit is credited, the balance is still owed.
        id: "demo-inv-2",
        invoice_number: "INV-0002",
        total_cents: 61000,
        deposit_credit_cents: 12200,
        amount_paid_cents: 12200,
        due_date: today,
        status: "sent" as const,
        created_at: new Date().toISOString(),
        paid_at: null,
        customerName: "Priya Sharma",
        serviceName: "LED Strip Lighting",
        lineItems: [
          { description: "LED Strip Lighting — 6m", quantity: 6, unit_price_cents: 10167, total_cents: 61000 },
        ],
      },
      {
        // Overdue, so the list's aging treatment has something to show.
        id: "demo-inv-3",
        invoice_number: "INV-0003",
        total_cents: 84500,
        deposit_credit_cents: 0,
        amount_paid_cents: 0,
        due_date: "2026-07-20",
        status: "sent" as const,
        created_at: "2026-07-20T02:00:00.000Z",
        paid_at: null,
        customerName: "Marco Rossi",
        serviceName: "Floating Cabinet",
        lineItems: [
          { description: "Floating cabinet — supply & install", quantity: 1, unit_price_cents: 84500, total_cents: 84500 },
        ],
      },
    ].map(withBalance);

    return { invoices, totals: summarize(invoices), demo: true };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, total_cents, deposit_credit_cents, amount_paid_cents, due_date, status, created_at, paid_at, line_items, bookings(quote_requests(profiles(full_name), services(name)))"
    )
    .order("created_at", { ascending: false });

  const invoices: AdminInvoiceRow[] = (data ?? []).map((inv) => {
    const quote = inv.bookings?.quote_requests;
    return withBalance({
      id: inv.id,
      invoice_number: inv.invoice_number,
      total_cents: inv.total_cents,
      deposit_credit_cents: inv.deposit_credit_cents,
      amount_paid_cents: inv.amount_paid_cents,
      due_date: inv.due_date,
      status: inv.status,
      created_at: inv.created_at,
      paid_at: inv.paid_at,
      customerName: quote?.profiles?.full_name ?? "Customer",
      serviceName: quote?.services?.name ?? "—",
      lineItems: (inv.line_items ?? []) as LineItem[],
    });
  });

  return { invoices, totals: summarize(invoices), demo: false };
}
