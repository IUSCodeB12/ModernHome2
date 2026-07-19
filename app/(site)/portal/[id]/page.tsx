import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatAud, parseOptions, type Answers } from "@/lib/quote/estimate";
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
    .select("*, services(name, price_unit, service_questions(*)), bookings(*)")
    .eq("id", id)
    .maybeSingle();

  if (!quote) notFound();

  const questions = (quote.services?.service_questions ??
    []) as Tables<"service_questions">[];
  const answers = (quote.answers ?? {}) as Answers;
  const booking = quote.bookings;

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

      <section className="mt-6 rounded-xl border p-4">
        <h2 className="font-medium">Quote</h2>
        <div className="mt-2 divide-y">
          {quote.final_quote_cents ? (
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
        </section>
      )}
    </div>
  );
}
