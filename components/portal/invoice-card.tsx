import Link from "next/link";
import { Download, ExternalLink, FileText } from "lucide-react";
import { formatAud } from "@/lib/quote/estimate";
import type { LineItem } from "@/lib/invoice/calc";

export type PortalInvoice = {
  invoiceNumber: string;
  issuedOn: string;
  dueOn: string | null;
  paidOn: string | null;
  lineItems: LineItem[];
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  depositCreditCents: number;
  balanceCents: number;
  paid: boolean;
};

function Row({
  label,
  value,
  muted = false,
  strong = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        strong ? "font-semibold" : muted ? "text-muted-foreground" : ""
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/**
 * The customer's bill, on the page rather than behind a link.
 *
 * The portal used to offer a single "View tax invoice" link in the hero, and
 * nothing at all when the invoice row was missing — so a job marked paid said
 * "your receipt is here whenever you need it" above no receipt and no
 * explanation. The document itself is still the PDF; this is the summary that
 * tells the customer what they're being charged before they open it, and what
 * to do when there's nothing to open yet.
 */
export function InvoiceCard({
  quoteId,
  invoice,
  phone,
}: {
  quoteId: string;
  invoice: PortalInvoice | null;
  /** Shown in the empty state — the only channel that reaches a human. */
  phone: string | null;
}) {
  if (!invoice) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-serif text-lg">Your invoice</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We haven&apos;t raised the invoice for this job yet. It appears here — and lands
          in your inbox — as soon as we do.
        </p>
        {phone && (
          <p className="mt-2 text-sm text-muted-foreground">
            Need it now? Call{" "}
            <a href={`tel:${phone}`} className="font-medium text-foreground underline">
              {phone}
            </a>
            .
          </p>
        )}
      </section>
    );
  }

  const label = invoice.paid ? "Receipt" : "Tax invoice";

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg">Your {label.toLowerCase()}</h2>
        <span className="text-sm text-muted-foreground">{invoice.invoiceNumber}</span>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Issued {invoice.issuedOn}
        {invoice.paid
          ? invoice.paidOn
            ? ` · paid ${invoice.paidOn}`
            : " · paid"
          : invoice.dueOn
            ? ` · due ${invoice.dueOn}`
            : ""}
      </p>

      <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
        {invoice.lineItems.map((item, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4">
            <span className="min-w-0">
              {item.description}
              {item.quantity !== 1 && (
                <span className="text-muted-foreground"> × {item.quantity}</span>
              )}
            </span>
            <span className="tabular-nums">{formatAud(item.total_cents)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
        <Row label="Subtotal (ex GST)" value={formatAud(invoice.subtotalCents)} muted />
        <Row label="GST (10%)" value={formatAud(invoice.gstCents)} muted />
        <Row label="Total" value={formatAud(invoice.totalCents)} strong />
        {invoice.depositCreditCents > 0 && (
          <Row
            label="Less deposit paid"
            value={`−${formatAud(invoice.depositCreditCents)}`}
            muted
          />
        )}
        {!invoice.paid && (
          <Row label="Balance due" value={formatAud(invoice.balanceCents)} strong />
        )}
      </div>

      {!invoice.paid && (
        <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          Pay the installer on site by card or cash, or by bank transfer using the
          details on your invoice.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/portal/${quoteId}/receipt`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-foreground/25"
        >
          <FileText className="size-4" />
          View {label.toLowerCase()}
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </Link>
        <Link
          href={`/portal/${quoteId}/receipt?download=1`}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-foreground/25"
        >
          <Download className="size-4" />
          Download PDF
        </Link>
      </div>
    </section>
  );
}
