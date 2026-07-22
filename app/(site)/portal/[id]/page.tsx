import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { QuoteResponse } from "@/components/portal/quote-response";
import { PaymentPanel } from "@/components/portal/payment-panel";
import { RescheduleRequest } from "@/components/portal/reschedule-request";
import { formatAud, parseOptions, type Answers } from "@/lib/quote/estimate";
import { calcInvoiceTotals, type LineItem } from "@/lib/invoice/calc";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
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

  const lineItems = (quote.quote_line_items ?? []) as LineItem[];
  const totals = lineItems.length ? calcInvoiceTotals(lineItems) : null;

  const invoice = booking?.invoices?.[0];
  const showPayment =
    booking?.status === "completed" ||
    booking?.status === "invoiced" ||
    booking?.status === "paid";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {quote.services?.name ?? "Quote request"}
        </h1>
        <StatusBadge status={booking?.status ?? quote.status} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Requested{" "}
        {formatInTimeZone(new Date(quote.created_at), BUSINESS_TIME_ZONE, "d MMM yyyy")}
      </p>

      {booking?.status === "quoted" && quote.final_quote_cents && (
        <div className="mt-6">
          <QuoteResponse
            quoteId={quote.id}
            amount={formatAud(quote.final_quote_cents)}
          />
        </div>
      )}

      {showPayment && (
        <div className="mt-6">
          <PaymentPanel
            quoteId={quote.id}
            amount={formatAud(invoice?.total_cents ?? quote.final_quote_cents ?? 0)}
            paid={booking?.status === "paid" || invoice?.status === "paid"}
            hasInvoice={!!invoice}
          />
        </div>
      )}

      <section className="mt-6 rounded-xl border p-4">
        <h2 className="font-medium">Quote</h2>

        {totals && (
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
        )}

        <div className="mt-2 divide-y">
          {totals ? null : quote.final_quote_cents ? (
            <Row label="Final quote" value={formatAud(quote.final_quote_cents)} />
          ) : quote.estimate_low_cents && quote.estimate_high_cents ? (
            <Row
              label="Estimate"
              value={`${formatAud(quote.estimate_low_cents)} – ${formatAud(quote.estimate_high_cents)}`}
            />
          ) : (
            <Row label="Estimate" value="Pending review" />
          )}
          {booking?.deposit_cents ? (
            <Row
              label="Deposit"
              value={`${formatAud(booking.deposit_cents)}${booking.deposit_paid_at ? " (paid)" : " (unpaid)"}`}
            />
          ) : null}
          {quote.admin_notes && <Row label="Notes from us" value={quote.admin_notes} />}
        </div>
      </section>

      <section className="mt-4 rounded-xl border p-4">
        <h2 className="font-medium">Job details</h2>
        <div className="mt-2 divide-y">
          {questions
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((q) => {
              const label = answerLabel(q, answers);
              return label ? <Row key={q.id} label={q.question_text} value={label} /> : null;
            })}
          {quote.photo_urls.length > 0 && (
            <Row label="Photos" value={`${quote.photo_urls.length} attached`} />
          )}
        </div>
      </section>

      {booking && (
        <section className="mt-4 rounded-xl border p-4">
          <h2 className="font-medium">Visit</h2>
          <div className="mt-2 divide-y">
            {booking.slot_start && booking.slot_end && (
              <Row
                label="Arrival window"
                value={`${formatInTimeZone(new Date(booking.slot_start), BUSINESS_TIME_ZONE, "EEE d MMM, HH:mm")} – ${formatInTimeZone(new Date(booking.slot_end), BUSINESS_TIME_ZONE, "HH:mm")}`}
              />
            )}
            {booking.address_line1 && (
              <Row
                label="Address"
                value={`${booking.address_line1}, ${booking.suburb ?? ""} ${booking.postcode ?? ""}`}
              />
            )}
            {booking.access_notes && (
              <Row label="Access notes" value={booking.access_notes} />
            )}
          </div>
          {(booking.status === "approved" || booking.status === "booked") && (
            <div className="mt-4 border-t pt-4">
              <RescheduleRequest
                quoteId={quote.id}
                alreadyRequested={!!booking.reschedule_requested_at}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
