import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, Clock, MapPin, KeyRound } from "lucide-react";
import { QuoteResponse } from "@/components/portal/quote-response";
import { PaymentPanel } from "@/components/portal/payment-panel";
import { RescheduleRequest } from "@/components/portal/reschedule-request";
import { JourneyRail } from "@/components/portal/journey-rail";
import { PortalStatus } from "@/components/portal/portal-status";
import { PhotoStrip } from "@/components/portal/photo-strip";
import { journeyFor, journeyHeadline, resolveStatus } from "@/lib/bookings/journey";
import { formatAud, parseOptions, type Answers } from "@/lib/quote/estimate";
import { calcInvoiceTotals, type LineItem } from "@/lib/invoice/calc";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function Fact({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Clock;
  title: string;
  detail?: string | null;
}) {
  return (
    <div className="flex gap-3 border-t py-3 first:border-t-0 first:pt-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

function answerLabel(
  question: Tables<"service_questions">,
  answers: Answers
): string | null {
  const value = answers[question.id];
  if (value === undefined || value === null || value === "") return null;
  const options = parseOptions(question.options);
  if (question.input_type === "single_select") {
    return options.find((o) => o.value === value)?.label ?? String(value);
  }
  if (question.input_type === "multi_select" && Array.isArray(value)) {
    return value.length
      ? value.map((v) => options.find((o) => o.value === v)?.label ?? v).join(", ")
      : null;
  }
  if (question.input_type === "boolean") {
    return value === true ? (options[0]?.label ?? "Yes") : "No";
  }
  return String(value);
}

export default async function PortalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) redirect("/portal");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/portal/${id}`);

  // RLS scopes this to the customer's own rows — anyone else's id 404s.
  const { data: quote } = await supabase
    .from("quote_requests")
    .select(
      "*, services(name, price_unit, service_questions(*)), bookings(*, invoices(id, status, total_cents))"
    )
    .eq("id", id)
    .maybeSingle();

  if (!quote) notFound();

  const questions = (quote.services?.service_questions ??
    []) as Tables<"service_questions">[];
  const answers = (quote.answers ?? {}) as Answers;
  const booking = quote.bookings;

  const status = resolveStatus(booking?.status, quote.status);

  const lineItems = (quote.quote_line_items ?? []) as LineItem[];
  const totals = lineItems.length ? calcInvoiceTotals(lineItems) : null;
  const invoice = booking?.invoices?.[0];

  // Photos live in a private bucket; the customer can sign their own folder.
  let photoUrls: string[] = [];
  if (quote.photo_urls?.length) {
    const { data: signed } = await supabase.storage
      .from("quote-photos")
      .createSignedUrls(quote.photo_urls, 3600);
    photoUrls = (signed ?? []).flatMap((s) => (s.signedUrl ? [s.signedUrl] : []));
  }

  const amountCents =
    invoice?.total_cents ?? totals?.total_cents ?? quote.final_quote_cents ?? null;

  const arrival =
    booking?.slot_start && booking?.slot_end
      ? `${formatInTimeZone(new Date(booking.slot_start), BUSINESS_TIME_ZONE, "EEE d MMM, h:mmaaa")} – ${formatInTimeZone(new Date(booking.slot_end), BUSINESS_TIME_ZONE, "h:mmaaa")}`
      : null;

  // The countdown only means something while the visit is still ahead — a
  // completed job reading "in 6 days" is nonsense.
  const slotStart = booking?.slot_start ? new Date(booking.slot_start) : null;
  const awaitingVisit =
    status === "approved" || status === "booked" || status === "in_progress";
  const relative =
    awaitingVisit && slotStart && slotStart.getTime() > Date.now()
      ? formatDistanceToNowStrict(slotStart, { addSuffix: true })
      : null;

  const journey = journeyFor(status);
  const headline = journeyHeadline({
    status,
    arrival,
    relative,
    amount: amountCents !== null ? formatAud(amountCents) : null,
    installer: booking?.assigned_installer,
  });

  const canReschedule = status === "approved" || status === "booked";
  const showInvoiceLink =
    status === "completed" || status === "invoiced" || status === "paid";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My bookings
      </Link>

      <header className="mt-5">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {quote.services?.name ?? "Quote request"}
        </p>
        <h1 className="mt-2 max-w-2xl text-balance text-3xl leading-[1.15] sm:text-4xl">
          {headline.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          {headline.body}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PortalStatus label={journey.label} tone={journey.tone} />
          {status === "quoted" && <QuoteResponse quoteId={quote.id} />}
          {showInvoiceLink && (
            <PaymentPanel
              quoteId={quote.id}
              paid={status === "paid" || invoice?.status === "paid"}
              hasInvoice={!!invoice}
            />
          )}
        </div>
      </header>

      <div className="mt-8">
        <JourneyRail
          journey={journey}
          requestedOn={formatInTimeZone(
            new Date(quote.created_at),
            BUSINESS_TIME_ZONE,
            "d MMM"
          )}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6">
        <div className="space-y-4">
          {booking && (arrival || booking.address_line1) && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-medium">Your visit</h2>
              {arrival && (
                <Fact
                  icon={Clock}
                  title={arrival}
                  detail={`2-hour arrival window${relative ? ` · ${relative}` : ""}`}
                />
              )}
              {booking.address_line1 && (
                <Fact
                  icon={MapPin}
                  title={`${booking.address_line1}, ${booking.suburb ?? ""} ${booking.postcode ?? ""}`.trim()}
                  detail={booking.assigned_installer
                    ? `${booking.assigned_installer} is on the job`
                    : null}
                />
              )}
              {booking.access_notes && (
                <Fact icon={KeyRound} title="Access notes" detail={booking.access_notes} />
              )}
              {canReschedule && (
                <div className="mt-4 border-t pt-4">
                  <RescheduleRequest
                    quoteId={quote.id}
                    alreadyRequested={!!booking.reschedule_requested_at}
                  />
                </div>
              )}
            </section>
          )}

          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-medium">Your quote</h2>

            {totals ? (
              <div className="mt-3 overflow-hidden rounded-lg border">
                <div className="flex items-center justify-between bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>What&apos;s included</span>
                  <span>Amount</span>
                </div>
                <ul className="divide-y">
                  {lineItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-4 px-3 py-2"
                    >
                      <span className="text-sm">
                        {item.description}
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground">
                            {" "}
                            × {item.quantity} @ {formatAud(item.unit_price_cents)}
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap text-sm font-medium">
                        {formatAud(item.total_cents)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="divide-y border-t bg-muted/30 px-3">
                  <div className="flex justify-between py-1.5 text-sm text-muted-foreground">
                    <span>Subtotal (ex GST)</span>
                    <span>{formatAud(totals.subtotal_cents)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-sm text-muted-foreground">
                    <span>GST (10%)</span>
                    <span>{formatAud(totals.gst_cents)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatAud(totals.total_cents)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1 divide-y">
                {quote.final_quote_cents ? (
                  <Row
                    label="Final quote"
                    value={formatAud(quote.final_quote_cents)}
                  />
                ) : quote.estimate_low_cents && quote.estimate_high_cents ? (
                  <Row
                    label="Estimate"
                    value={`${formatAud(quote.estimate_low_cents)} – ${formatAud(quote.estimate_high_cents)}`}
                  />
                ) : (
                  <Row label="Estimate" value="Pending review" />
                )}
              </div>
            )}

            {quote.admin_notes && (
              <div className="mt-4 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">Notes from us</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{quote.admin_notes}</p>
              </div>
            )}
          </section>

          <details className="group rounded-xl border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between font-medium">
              What you told us
              <span className="text-sm font-normal text-muted-foreground transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="mt-3 divide-y border-t pt-1">
              {questions
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((q) => {
                  const label = answerLabel(q, answers);
                  if (!label) return null;
                  // Free-text answers are paragraphs — give them their own block.
                  return q.input_type === "text" ? (
                    <div key={q.id} className="py-2">
                      <p className="text-sm text-muted-foreground">{q.question_text}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm font-medium">
                        {label}
                      </p>
                    </div>
                  ) : (
                    <Row key={q.id} label={q.question_text} value={label} />
                  );
                })}
            </div>
            {photoUrls.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-sm text-muted-foreground">
                  Photos you sent us
                </p>
                <PhotoStrip urls={photoUrls} />
              </div>
            )}
          </details>
        </div>

        <aside className="rounded-xl bg-muted/40 p-5 lg:sticky lg:top-24">
          <p className="text-xs text-muted-foreground">
            {status === "paid" ? "Paid" : amountCents !== null ? "Total" : "Estimate"}
          </p>
          <p className="mt-1 text-2xl font-medium">
            {amountCents !== null
              ? formatAud(amountCents)
              : quote.estimate_low_cents && quote.estimate_high_cents
                ? `${formatAud(quote.estimate_low_cents)} – ${formatAud(quote.estimate_high_cents)}`
                : "Pending"}
          </p>
          {amountCents !== null && (
            <p className="mt-0.5 text-xs text-muted-foreground">Includes GST</p>
          )}

          {booking?.deposit_cents ? (
            <p className="mt-3 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Deposit </span>
              {formatAud(booking.deposit_cents)}
              <span className="text-muted-foreground">
                {booking.deposit_paid_at ? " · paid" : " · unpaid"}
              </span>
            </p>
          ) : null}

          <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            Requested{" "}
            {formatInTimeZone(
              new Date(quote.created_at),
              BUSINESS_TIME_ZONE,
              "d MMM yyyy"
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}
