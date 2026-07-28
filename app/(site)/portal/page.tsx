import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PortalStatus } from "@/components/portal/portal-status";
import {
  attentionRank,
  journeyFor,
  journeyHeadline,
  resolveStatus,
  type Journey,
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

function CompactRow({
  id,
  service,
  journey,
  meta,
}: {
  id: string;
  service: string;
  journey: Journey;
  meta: string;
}) {
  return (
    <li>
      <Link
        href={`/portal/${id}`}
        className="group flex items-center justify-between gap-3 py-3"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{service}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PortalStatus
            label={journey.label}
            tone={journey.tone}
            className="hidden sm:inline-flex"
          />
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </li>
  );
}

export default async function PortalPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <h1 className="text-3xl">My bookings</h1>
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

  const rows = (quotes ?? []).map((quote) => {
    const booking = quote.bookings;
    const status = resolveStatus(booking?.status, quote.status);
    const journey = journeyFor(status);

    const arrival =
      booking?.slot_start && booking?.slot_end
        ? `${formatInTimeZone(new Date(booking.slot_start), BUSINESS_TIME_ZONE, "EEE d MMM, h:mmaaa")} – ${formatInTimeZone(new Date(booking.slot_end), BUSINESS_TIME_ZONE, "h:mmaaa")}`
        : null;

    // The countdown only means something while the visit is still ahead — a
    // completed job reading "in 6 days" is nonsense.
    const slotMs = booking?.slot_start ? new Date(booking.slot_start).getTime() : null;
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
      requestedOn: formatInTimeZone(
        new Date(quote.created_at),
        BUSINESS_TIME_ZONE,
        "d MMM yyyy"
      ),
      status,
      journey,
      relative,
      amount,
      slotMs,
      headline: journeyHeadline({
        status,
        arrival,
        relative,
        amount: quote.final_quote_cents ? formatAud(quote.final_quote_cents) : null,
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

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">My bookings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your quotes and jobs, all in one place.
      </p>

      {!rows.length && (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <p className="text-lg">Start your first job</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
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
        <Link
          href={`/portal/${feature.id}`}
          className="card-lift group mt-8 block rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {feature.service}
            </p>
            <PortalStatus label={feature.journey.label} tone={feature.journey.tone} />
          </div>

          <p className="mt-3 text-balance text-xl leading-snug sm:text-2xl">
            {feature.headline.title}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {feature.relative && <span>{feature.relative}</span>}
            {feature.amount && !feature.headline.showsAmount && (
              <span>{feature.amount}</span>
            )}
            <span className="inline-flex items-center gap-1 font-medium text-foreground transition-transform group-hover:translate-x-0.5">
              View job <ChevronRight className="size-4" />
            </span>
          </div>
        </Link>
      )}

      {alsoOpen.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Also open</h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <ul className="mt-1 divide-y">
            {alsoOpen.map((r) => (
              <CompactRow
                key={r.id}
                id={r.id}
                service={r.service}
                journey={r.journey}
                meta={[r.relative, r.amount].filter(Boolean).join(" · ") || r.requestedOn}
              />
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Earlier</h2>
            <span className="h-px flex-1 bg-border" />
          </div>
          <ul className="mt-1 divide-y">
            {past.map((r) => (
              <CompactRow
                key={r.id}
                id={r.id}
                service={r.service}
                journey={r.journey}
                meta={[r.amount, r.requestedOn].filter(Boolean).join(" · ")}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
