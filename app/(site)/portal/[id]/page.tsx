import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { QuoteResponse } from "@/components/portal/quote-response";
import { JourneyRail } from "@/components/portal/journey-rail";
import { StageHero } from "@/components/portal/stage-hero";
import { VisitCard } from "@/components/portal/visit-card";
import { QuoteSummary } from "@/components/portal/quote-summary";
import { EnquiryDetails } from "@/components/portal/enquiry-details";
import { JobAside } from "@/components/portal/job-aside";
import { journeyFor, journeyHeadline, resolveStatus } from "@/lib/bookings/journey";
import { formatAud, type Answers } from "@/lib/quote/estimate";
import { calcInvoiceTotals, type LineItem } from "@/lib/invoice/calc";
import { InvoiceCard } from "@/components/portal/invoice-card";
import { BUSINESS } from "@/lib/business";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

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
      "*, services(name, price_unit, service_questions(*)), bookings(*, invoices(id, invoice_number, status, line_items, subtotal_cents, gst_cents, total_cents, amount_paid_cents, deposit_credit_cents, due_date, created_at, paid_at))"
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

  // What to actually ask for. On an unsettled invoice that's the balance, not
  // the total — a customer who has already paid a deposit was being shown the
  // full quoted price under a "Payment due" headline, i.e. asked for the
  // deposit twice. Falls back to the total whenever there's no invoice yet.
  const dueCents =
    invoice && invoice.status !== "paid"
      ? Math.max(0, invoice.total_cents - invoice.amount_paid_cents)
      : amountCents;

  // Every date is formatted in Australia/Melbourne here rather than in the
  // components: the browser is in whatever timezone it's in, and an arrival
  // window that shifts by two hours in Perth is worse than no window at all.
  const slotStart = booking?.slot_start ? new Date(booking.slot_start) : null;
  const slotEnd = booking?.slot_end ? new Date(booking.slot_end) : null;
  const inZone = (d: Date, fmt: string) =>
    formatInTimeZone(d, BUSINESS_TIME_ZONE, fmt);

  const arrival =
    slotStart && slotEnd
      ? `${inZone(slotStart, "EEE d MMM, h:mmaaa")} – ${inZone(slotEnd, "h:mmaaa")}`
      : null;

  const arrivalParts =
    slotStart && slotEnd
      ? {
          weekday: inZone(slotStart, "EEE"),
          day: inZone(slotStart, "d"),
          month: inZone(slotStart, "MMM"),
          window: `${inZone(slotStart, "h:mmaaa")} – ${inZone(slotEnd, "h:mmaaa")}`,
        }
      : null;

  const journey = journeyFor(status);
  const headline = journeyHeadline({
    status,
    arrivalDay: slotStart ? inZone(slotStart, "EEEE") : null,
    installer: booking?.assigned_installer,
    hasInvoice: !!invoice,
  });

  const canReschedule = status === "approved" || status === "booked";
  const settled = status === "paid";
  // The bill belongs to the two stages where one exists. A `completed` job has
  // been done but not yet billed, and showing an invoice card there just tells
  // the customer about a document nobody has raised.
  const billed = status === "invoiced" || settled;
  // Where the visit sits relative to now decides how the page is stacked: a
  // visit still to come is the headline, a visit already done is the record.
  const visitDone = status === "completed" || status === "invoiced" || settled;
  const pricingStage = status === "enquiry" || status === "quoted";

  const visitCard = (
    <VisitCard
      key="visit"
      arrival={arrival}
      past={visitDone}
      address={
        booking?.address_line1
          ? `${booking.address_line1}, ${booking.suburb ?? ""} ${booking.postcode ?? ""}`.trim()
          : null
      }
      installer={booking?.assigned_installer ?? null}
      accessNotes={booking?.access_notes ?? null}
      quoteId={quote.id}
      canReschedule={canReschedule}
      rescheduleRequested={!!booking?.reschedule_requested_at}
    />
  );

  const quoteCard = (
    <QuoteSummary
      key="quote"
      lineItems={lineItems}
      estimateLowCents={quote.estimate_low_cents}
      estimateHighCents={quote.estimate_high_cents}
      finalQuoteCents={quote.final_quote_cents}
      adminNotes={quote.admin_notes}
      settled={settled}
    />
  );

  const detailsCard = (
    <EnquiryDetails
      key="details"
      questions={questions}
      answers={answers}
      photoUrls={photoUrls}
      defaultOpen={pricingStage}
    />
  );

  const invoiceCard = (
    <InvoiceCard
      key="invoice"
      quoteId={quote.id}
      phone={BUSINESS.phone}
      invoice={
        invoice
          ? {
              invoiceNumber: invoice.invoice_number,
              issuedOn: inZone(new Date(invoice.created_at), "d MMM yyyy"),
              dueOn: invoice.due_date
                ? inZone(new Date(invoice.due_date), "d MMM yyyy")
                : null,
              paidOn: invoice.paid_at
                ? inZone(new Date(invoice.paid_at), "d MMM yyyy")
                : null,
              lineItems: (invoice.line_items ?? []) as LineItem[],
              subtotalCents: invoice.subtotal_cents,
              gstCents: invoice.gst_cents,
              totalCents: invoice.total_cents,
              depositCreditCents: invoice.deposit_credit_cents,
              balanceCents: Math.max(
                0,
                invoice.total_cents - invoice.amount_paid_cents
              ),
              paid: invoice.status === "paid",
            }
          : null
      }
    />
  );

  // Whatever the customer came for goes first. While the price is being
  // decided that's the money; once a date exists it's the visit; afterwards
  // it's the receipt. A cancelled job drops the visit card altogether —
  // "Where we're coming" is a promise, and nobody is coming.
  //
  // Once the job is billable the invoice leads: at that point the page exists
  // to answer "what do I owe / what did I pay", and it's the only card that
  // carries a document the customer may need to keep.
  const sections = journey.cancelled
    ? [quoteCard, detailsCard]
    : visitDone
      ? [...(billed ? [invoiceCard] : []), quoteCard, visitCard, detailsCard]
      : pricingStage
        ? [quoteCard, detailsCard]
        : [visitCard, quoteCard, detailsCard];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My bookings
      </Link>

      <div className="mt-5">
        <StageHero
          status={status}
          journey={journey}
          serviceName={quote.services?.name ?? "Quote request"}
          headline={headline}
          amount={dueCents !== null ? formatAud(dueCents) : null}
          arrival={arrivalParts}
          slotStartMs={slotStart?.getTime() ?? null}
          slotEndMs={slotEnd?.getTime() ?? null}
          installer={booking?.assigned_installer}
          paidOn={
            invoice?.paid_at ? inZone(new Date(invoice.paid_at), "d MMM yyyy") : null
          }
          actions={
            <>
              {status === "quoted" && <QuoteResponse quoteId={quote.id} />}
              {/* The body invites them to start again; without this it was an
                  invitation with nothing to click. */}
              {journey.cancelled && (
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Start a new quote <ArrowRight className="size-4" />
                </Link>
              )}
            </>
          }
        />
      </div>

      {/* A cancelled job has no progress to report, and a rail full of empty
          circles reads as a job that stalled rather than one that was called off. */}
      {!journey.cancelled && (
        <div className="mt-8">
          <JourneyRail
            journey={journey}
            status={status}
            requestedOn={inZone(new Date(quote.created_at), "d MMM")}
          />
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6">
        <div className="space-y-4">{sections}</div>

        <JobAside
          amountCents={amountCents}
          estimateLowCents={quote.estimate_low_cents}
          estimateHighCents={quote.estimate_high_cents}
          // The hero already leads with the figure on these three.
          showAmount={!(status === "quoted" || status === "invoiced" || settled)}
          settled={settled}
          depositCents={booking?.deposit_cents ?? null}
          depositPaid={!!booking?.deposit_paid_at}
          requestedOn={inZone(new Date(quote.created_at), "d MMM yyyy")}
        />
      </div>
    </div>
  );
}
