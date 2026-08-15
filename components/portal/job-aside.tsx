import { Phone } from "lucide-react";
import { BUSINESS } from "@/lib/business";
import { formatAud } from "@/lib/quote/estimate";

/**
 * The rail beside the job: the figure, then a way to reach a human.
 *
 * The amount is suppressed on the stages whose hero already leads with it.
 * Printing $836 twice, 200px apart, in two different sizes, invites the reader
 * to work out why the page is saying it twice — and there's no answer.
 */
export function JobAside({
  amountCents,
  estimateLowCents,
  estimateHighCents,
  showAmount,
  settled,
  depositCents,
  depositPaid,
  requestedOn,
}: {
  amountCents: number | null;
  estimateLowCents: number | null;
  estimateHighCents: number | null;
  showAmount: boolean;
  settled: boolean;
  depositCents: number | null;
  depositPaid: boolean;
  requestedOn: string;
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      {showAmount && (
        <div className="rounded-xl bg-muted/40 p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {settled ? "Paid" : amountCents !== null ? "Total" : "Estimate"}
          </p>
          <p className="mt-1.5 font-display text-2xl tabular-nums">
            {amountCents !== null
              ? formatAud(amountCents)
              : estimateLowCents && estimateHighCents
                ? `${formatAud(estimateLowCents)} – ${formatAud(estimateHighCents)}`
                : "Pending"}
          </p>
          {amountCents !== null && (
            <p className="mt-0.5 text-xs text-muted-foreground">Includes GST</p>
          )}

          {depositCents ? (
            <p className="mt-3 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Deposit </span>
              <span className="tabular-nums">{formatAud(depositCents)}</span>
              <span className="text-muted-foreground">
                {depositPaid ? " · paid" : " · unpaid"}
              </span>
            </p>
          ) : null}

          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            Requested {requestedOn}
          </p>
        </div>
      )}

      {!showAmount && (
        <p className="text-xs text-muted-foreground">Requested {requestedOn}</p>
      )}

      {/*
       * One tradie, one mobile. Anything that goes wrong here — wrong address,
       * wrong day, a question about the price — is fixed by a phone call, so
       * the number belongs on the page rather than behind a contact form.
       */}
      {BUSINESS.phone && (
        <div className="rounded-xl border border-dashed p-5">
          <p className="text-sm font-medium">Something not right?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Call us and we&apos;ll sort it — no phone tree, it rings the person doing
            the job.
          </p>
          <a
            href={`tel:${BUSINESS.phone}`}
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand"
          >
            <Phone className="size-4" />
            {BUSINESS.phone}
          </a>
        </div>
      )}
    </aside>
  );
}
