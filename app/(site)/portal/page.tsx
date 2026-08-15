import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowRight } from "lucide-react";
import { JobCard } from "@/components/portal/job-card";
import { JobRow } from "@/components/portal/job-row";
import {
  attentionRank,
  journeyFor,
  journeyHeadline,
  resolveStatus,
} from "@/lib/bookings/journey";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My bookings",
  robots: { index: false, follow: false },
};

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default async function PortalPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="font-display text-3xl">My bookings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Supabase isn&apos;t configured yet — bookings will appear here once
          it&apos;s connected.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal");

  const { data: quotes } = await supabase
    .from("quote_requests")
    .select(
      "id, status, estimate_low_cents, estimate_high_cents, final_quote_cents, created_at, services(name), bookings(id, status, slot_start, slot_end, deposit_cents, assigned_installer)"
    )
    .order("created_at", { ascending: false });

  const inZone = (d: Date, fmt: string) =>
    formatInTimeZone(d, BUSINESS_TIME_ZONE, fmt);

  const rows = (quotes ?? []).map((quote) => {
    const booking = quote.bookings;
    const status = resolveStatus(booking?.status, quote.status);
    const journey = journeyFor(status);

    const slotStart = booking?.slot_start ? new Date(booking.slot_start) : null;
    const slotEnd = booking?.slot_end ? new Date(booking.slot_end) : null;

    // The countdown only means something while the visit is still ahead — a
    // completed job reading "in 6 days" is nonsense.
    const slotMs = slotStart?.getTime() ?? null;
    const awaitingVisit =
      status === "approved" || status === "booked" || status === "in_progress";
    const relative =
      awaitingVisit && slotMs && slotMs > Date.now()
        ? formatDistanceToNowStrict(new Date(slotMs), { addSuffix: true })
        : null;

    const amount = quote.final_quote_cents
      ? formatAud(quote.final_quote_cents)
      : quote.estimate_low_cents && quote.estimate_high_cents
        ? `${formatAud(quote.estimate_low_cents)} – ${formatAud(quote.estimate_high_cents)}`
        : null;

    return {
      id: quote.id,
      service: quote.services?.name ?? "Service",
      requestedOn: inZone(new Date(quote.created_at), "d MMM yyyy"),
      status,
      journey,
      relative,
      amount,
      slotMs,
      slotEndMs: slotEnd?.getTime() ?? null,
      installer: booking?.assigned_installer ?? null,
      arrivalParts:
        slotStart && slotEnd
          ? {
              weekday: inZone(slotStart, "EEE"),
              day: inZone(slotStart, "d"),
              month: inZone(slotStart, "MMM"),
              window: `${inZone(slotStart, "h:mmaaa")} – ${inZone(slotEnd, "h:mmaaa")}`,
            }
          : null,
      headline: journeyHeadline({
        status,
        arrivalDay: slotStart ? inZone(slotStart, "EEEE") : null,
        installer: booking?.assigned_installer,
      }),
      // Anything not paid off or cancelled still wants the customer's attention.
      active: !journey.complete && !journey.cancelled,
    };
  });

  // Whatever needs the customer first gets the big card; soonest visit breaks ties.
  const live = rows
    .filter((r) => r.active)
    .sort(
      (a, b) =>
        attentionRank(a.journey) - attentionRank(b.journey) ||
        (a.slotMs ?? Infinity) - (b.slotMs ?? Infinity)
    );
  const [feature, ...alsoOpen] = live;
  const past = rows.filter((r) => !r.active);

  // The subtitle reports the state of play rather than describing the page.
  // "Your quotes and jobs, all in one place" is true of an empty portal too,
  // which is how you can tell it wasn't telling anyone anything.
  const subtitle = !rows.length
    ? "Everything you book with us lives here."
    : feature?.journey.tone === "action"
      ? "One of these is waiting on you."
      : feature?.relative
        ? `Your next visit is ${feature.relative}.`
        : feature
          ? "We'll keep this updated as your job moves."
          : `${past.length} job${past.length === 1 ? "" : "s"} completed. Ready for the next one?`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl">My bookings</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

      {!rows.length && (
        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center">
          <p className="font-display text-xl">Start your first job</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Answer a few questions and you&apos;ll have a fixed price in a couple of
            minutes — no site visit needed.
          </p>
          <Link
            href="/quote"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get an instant quote <ArrowRight className="size-4" />
          </Link>
        </div>
      )}

      {feature && (
        <div className="mt-8">
          <JobCard
            id={feature.id}
            serviceName={feature.service}
            status={feature.status}
            journey={feature.journey}
            title={feature.headline.title}
            amount={feature.amount}
            arrival={feature.arrivalParts}
            slotStartMs={feature.slotMs}
            slotEndMs={feature.slotEndMs}
            installer={feature.installer}
          />
        </div>
      )}

      {alsoOpen.length > 0 && (
        <section className="mt-10">
          <Divider label="Also open" />
          <ul className="mt-2 divide-y">
            {alsoOpen.map((r) => (
              <JobRow
                key={r.id}
                id={r.id}
                serviceName={r.service}
                status={r.status}
                journey={r.journey}
                meta={r.relative ?? r.requestedOn}
                amount={r.amount}
              />
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-10">
          <Divider label="Earlier" />
          <ul className="mt-2 divide-y">
            {past.map((r) => (
              <JobRow
                key={r.id}
                id={r.id}
                serviceName={r.service}
                status={r.status}
                journey={r.journey}
                meta={r.requestedOn}
                amount={r.amount}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
