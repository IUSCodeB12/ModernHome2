import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft } from "lucide-react";
import { getAdminQuote } from "@/lib/admin/quotes-data";
import { answerLabel } from "@/lib/quote/answers";
import { formatAud, type Answers } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { StatusBadge } from "@/components/status-badge";
import { QuoteActions } from "@/components/admin/quote-actions";
import { QuotePhotos } from "@/components/admin/quote-photos";

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { quote, photoUrls } = await getAdminQuote(id);
  if (!quote) notFound();

  const answers = (quote.answers ?? {}) as Answers;
  const questions = [...(quote.services?.service_questions ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const booking = quote.bookings;
  const midpoint =
    quote.estimate_low_cents != null && quote.estimate_high_cents != null
      ? Math.round((quote.estimate_low_cents + quote.estimate_high_cents) / 2)
      : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/quotes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All quotes
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {quote.services?.name ?? "Quote"}
        </h1>
        <StatusBadge status={quote.status} />
        <span className="text-sm text-muted-foreground">
          {formatInTimeZone(new Date(quote.created_at), BUSINESS_TIME_ZONE, "d MMM yyyy, HH:mm")}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          {/* Customer */}
          <section className="rounded-xl border p-4">
            <h2 className="font-medium">Customer</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name</span>
                <p className="font-medium">{quote.profiles?.full_name ?? "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone</span>
                <p className="font-medium">{quote.profiles?.phone ?? "—"}</p>
              </div>
              {booking?.address_line1 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address</span>
                  <p className="font-medium">
                    {booking.address_line1}, {booking.suburb} {booking.postcode}
                  </p>
                </div>
              )}
              {booking?.access_notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Access notes</span>
                  <p className="font-medium">{booking.access_notes}</p>
                </div>
              )}
              {booking?.slot_start && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Requested slot</span>
                  <p className="font-medium">
                    {formatInTimeZone(new Date(booking.slot_start), BUSINESS_TIME_ZONE, "EEE d MMM, HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Answers */}
          <section className="rounded-xl border p-4">
            <h2 className="font-medium">Job details</h2>
            <div className="mt-2 divide-y">
              {questions.map((q) => {
                const label = answerLabel(q, answers);
                return label ? (
                  <div key={q.id} className="flex justify-between gap-4 py-1.5 text-sm">
                    <span className="text-muted-foreground">{q.question_text}</span>
                    <span className="text-right font-medium">{label}</span>
                  </div>
                ) : null;
              })}
            </div>
          </section>

          {/* Photos */}
          <section className="rounded-xl border p-4">
            <h2 className="font-medium">Photos</h2>
            <QuotePhotos paths={quote.photo_urls} urls={photoUrls} />
          </section>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <section className="rounded-xl border bg-muted/40 p-4">
            <h2 className="font-medium">Auto-estimate</h2>
            <p className="mt-1 text-lg font-semibold">
              {quote.estimate_low_cents != null && quote.estimate_high_cents != null
                ? `${formatAud(quote.estimate_low_cents)} – ${formatAud(quote.estimate_high_cents)}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Midpoint {formatAud(midpoint)}
            </p>
            {quote.final_quote_cents != null && (
              <p className="mt-2 text-sm">
                Final quote:{" "}
                <span className="font-semibold">{formatAud(quote.final_quote_cents)}</span>
              </p>
            )}
            {quote.admin_notes && (
              <p className="mt-2 text-sm text-muted-foreground">
                Note: {quote.admin_notes}
              </p>
            )}
          </section>

          <QuoteActions
            quoteId={quote.id}
            status={quote.status}
            estimateMidpointCents={midpoint}
          />
        </div>
      </div>
    </div>
  );
}
