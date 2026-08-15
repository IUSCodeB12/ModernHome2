import { formatAud } from "@/lib/quote/estimate";
import { calcInvoiceTotals, type LineItem } from "@/lib/invoice/calc";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

/**
 * What the job costs, itemised.
 *
 * Once it's settled the same table is titled and framed as a receipt. The
 * numbers don't change — but "Your quote", present tense, on a job you paid for
 * last month is the page telling you it hasn't been keeping up.
 */
export function QuoteSummary({
  lineItems,
  estimateLowCents,
  estimateHighCents,
  finalQuoteCents,
  adminNotes,
  settled,
}: {
  lineItems: LineItem[];
  estimateLowCents: number | null;
  estimateHighCents: number | null;
  finalQuoteCents: number | null;
  adminNotes: string | null;
  settled: boolean;
}) {
  const totals = lineItems.length ? calcInvoiceTotals(lineItems) : null;

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-medium">{settled ? "What you paid for" : "Your quote"}</h2>

      {totals ? (
        <div className="mt-3 overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>What&apos;s included</span>
            <span>Amount</span>
          </div>
          <ul className="divide-y">
            {lineItems.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-4 px-3 py-2">
                <span className="text-sm">
                  {item.description}
                  {item.quantity > 1 && (
                    <span className="text-muted-foreground">
                      {" "}
                      × {item.quantity} @ {formatAud(item.unit_price_cents)}
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap text-sm font-medium tabular-nums">
                  {formatAud(item.total_cents)}
                </span>
              </li>
            ))}
          </ul>
          <div className="divide-y border-t bg-muted/30 px-3">
            <div className="flex justify-between py-1.5 text-sm text-muted-foreground">
              <span>Subtotal (ex GST)</span>
              <span className="tabular-nums">{formatAud(totals.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm text-muted-foreground">
              <span>GST (10%)</span>
              <span className="tabular-nums">{formatAud(totals.gst_cents)}</span>
            </div>
            <div
              className={cn(
                "flex justify-between py-2 text-sm font-semibold",
                settled && "text-emerald-700 dark:text-emerald-500"
              )}
            >
              <span>{settled ? "Paid" : "Total"}</span>
              <span className="tabular-nums">{formatAud(totals.total_cents)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-1 divide-y">
          {finalQuoteCents ? (
            <Row label="Final quote" value={formatAud(finalQuoteCents)} />
          ) : estimateLowCents && estimateHighCents ? (
            <Row
              label="Estimate"
              value={`${formatAud(estimateLowCents)} – ${formatAud(estimateHighCents)}`}
            />
          ) : (
            <Row label="Estimate" value="Pending review" />
          )}
        </div>
      )}

      {adminNotes && (
        <div className="mt-4 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Notes from us</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{adminNotes}</p>
        </div>
      )}
    </section>
  );
}
