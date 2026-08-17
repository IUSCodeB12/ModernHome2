"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { InvoicePaymentDialog } from "@/components/admin/invoice-payment-dialog";
import { invoiceStateLabel } from "@/lib/invoice/calc";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { cn } from "@/lib/utils";
import type { AdminInvoiceRow } from "@/lib/admin/invoices-data";

const FILTERS = [
  { id: "outstanding", label: "Outstanding" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
  { id: "all", label: "All" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function matches(inv: AdminInvoiceRow, filter: FilterId): boolean {
  switch (filter) {
    case "outstanding":
      return !inv.balance.settled;
    case "overdue":
      return inv.balance.overdue;
    case "paid":
      return inv.balance.settled;
    case "all":
      return true;
  }
}

const fmtDate = (iso: string) =>
  formatInTimeZone(new Date(iso), BUSINESS_TIME_ZONE, "d MMM yyyy");

/**
 * The invoice ledger.
 *
 * Defaults to **Outstanding** rather than everything: the question this page
 * answers day to day is "who still owes me money", and a reverse-chronological
 * list of all invoices buries that under the ones already settled.
 *
 * Filtering and search are client-side. The full set is already in memory
 * (a sole-trader ledger, not a general-purpose accounts package), so a round
 * trip per keystroke would cost more than it saves.
 */
export function InvoicesTable({ invoices }: { invoices: AdminInvoiceRow[] }) {
  const [filter, setFilter] = useState<FilterId>("outstanding");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<FilterId, number>>(
        (acc, f) => {
          acc[f.id] = invoices.filter((inv) => matches(inv, f.id)).length;
          return acc;
        },
        { outstanding: 0, overdue: 0, paid: 0, all: 0 }
      ),
    [invoices]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter(
      (inv) =>
        matches(inv, filter) &&
        (!q ||
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.serviceName.toLowerCase().includes(q))
    );
  }, [invoices, filter, query]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
              <span className="ml-1.5 tabular-nums opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search number, customer or service"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border p-8 text-center text-sm text-muted-foreground">
          {query
            ? `Nothing matching "${query}".`
            : filter === "overdue"
              ? "Nothing overdue — everything billed is within terms."
              : "No invoices in this view."}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-3xl text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Number</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Issued</th>
                <th className="px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 text-right font-medium">Owing</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-2">{inv.customerName}</td>
                  <td className="px-4 py-2 text-muted-foreground">{inv.serviceName}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {fmtDate(inv.created_at)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2 text-muted-foreground",
                      inv.balance.overdue && "font-medium text-red-700"
                    )}
                  >
                    {inv.due_date ? fmtDate(inv.due_date) : "On receipt"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatAud(inv.total_cents)}
                    {inv.deposit_credit_cents > 0 && (
                      <span className="block text-xs text-muted-foreground">
                        less {formatAud(inv.deposit_credit_cents)} deposit
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2 text-right font-medium tabular-nums",
                      inv.balance.overdue && "text-red-700",
                      inv.balance.settled && "text-muted-foreground"
                    )}
                  >
                    {formatAud(inv.balance.balanceCents)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={invoiceStateLabel(inv.status, inv.balance)} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener"
                        title={`Open ${inv.invoice_number} as a PDF`}
                        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <FileText className="size-4" />
                      </Link>
                      {!inv.balance.settled && (
                        <>
                          <InvoiceEditor
                            invoiceId={inv.id}
                            invoiceNumber={inv.invoice_number}
                            lineItems={inv.lineItems}
                            depositCreditCents={inv.deposit_credit_cents}
                          />
                          <InvoicePaymentDialog
                            invoiceId={inv.id}
                            invoiceNumber={inv.invoice_number}
                            balanceCents={inv.balance.balanceCents}
                            amountPaidCents={inv.amount_paid_cents}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
