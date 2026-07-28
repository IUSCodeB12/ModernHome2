import Link from "next/link";
import { Download } from "lucide-react";

/**
 * Link to the customer's tax invoice / receipt PDF.
 *
 * Payment itself is offline — paid to the installer on site or by bank
 * transfer — so there's nothing to click through to. The amount and the "how
 * to pay" explanation live in the page headline; this is the document link.
 */
export function PaymentPanel({
  quoteId,
  paid,
  hasInvoice,
}: {
  quoteId: string;
  paid: boolean;
  hasInvoice: boolean;
}) {
  if (!hasInvoice) return null;

  return (
    <Link
      href={`/portal/${quoteId}/receipt`}
      className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition-colors hover:border-foreground/25"
    >
      <Download className="size-4" />
      {paid ? "Download receipt" : "View tax invoice"}
    </Link>
  );
}
