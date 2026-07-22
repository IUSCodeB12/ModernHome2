import Link from "next/link";
import { CheckCircle2, CreditCard, Download } from "lucide-react";

/**
 * Post-job payment state for the customer. Payment itself is offline (paid to
 * the installer on site / bank transfer); the app records status and serves a
 * receipt PDF once an invoice exists.
 */
export function PaymentPanel({
  quoteId,
  amount,
  paid,
  hasInvoice,
}: {
  quoteId: string;
  amount: string;
  paid: boolean;
  hasInvoice: boolean;
}) {
  if (paid) {
    return (
      <div className="rounded-xl border border-green-600/30 bg-green-600/10 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-green-800">
          <CheckCircle2 className="size-5" /> Paid in full — thank you!
        </div>
        {hasInvoice && (
          <Link
            href={`/portal/${quoteId}/receipt`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:border-foreground/20"
          >
            <Download className="size-4" /> Download receipt
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <CreditCard className="size-5 text-muted-foreground" />
        <h2 className="font-medium">Payment due — {amount}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Your job is complete. Payment can be made to the installer on site (card or
        cash) or by bank transfer. Any extra work agreed on the day is added to your
        final total.
      </p>
      {hasInvoice && (
        <Link
          href={`/portal/${quoteId}/receipt`}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:border-foreground/20"
        >
          <Download className="size-4" /> View tax invoice
        </Link>
      )}
    </div>
  );
}
