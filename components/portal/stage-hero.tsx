import { CheckCircle2 } from "lucide-react";
import { ArrivalTicket } from "@/components/portal/arrival-ticket";
import { PortalStatus } from "@/components/portal/portal-status";
import { stageStyle } from "@/components/portal/stage-theme";
import type { Headline, Journey } from "@/lib/bookings/journey";
import type { BookingStatus } from "@/lib/bookings/status";
import { cn } from "@/lib/utils";

/** Pre-formatted in Australia/Melbourne by the caller. */
export type ArrivalParts = {
  weekday: string;
  day: string;
  month: string;
  window: string;
};

/**
 * The top of a job page, dressed for whichever stage the job is at.
 *
 * One layout with a swappable centrepiece rather than nine templates: the
 * furniture (eyebrow, status, headline, actions) is constant so the page stays
 * recognisable between visits, and the one object in the middle carries the
 * news. Whatever the customer most needs — a date, a price, a receipt — is the
 * biggest thing on screen, and nothing else competes with it.
 */
export function StageHero({
  status,
  journey,
  serviceName,
  headline,
  amount,
  arrival,
  slotStartMs,
  slotEndMs,
  installer,
  paidOn,
  actions,
}: {
  status: BookingStatus;
  journey: Journey;
  serviceName: string;
  headline: Headline;
  /** Pre-formatted money, e.g. "$836.00". */
  amount?: string | null;
  arrival?: ArrivalParts | null;
  slotStartMs?: number | null;
  slotEndMs?: number | null;
  installer?: string | null;
  /** Pre-formatted date the invoice was settled. */
  paidOn?: string | null;
  actions?: React.ReactNode;
}) {
  const style = stageStyle(status);

  return (
    <section
      className={cn(
        "animate-enter-up relative overflow-hidden rounded-2xl border p-5 sm:p-7",
        style.surface
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {serviceName}
        </p>
        <PortalStatus label={journey.label} tone={journey.tone} />
      </div>

      <h1 className="mt-4 max-w-2xl text-balance font-display text-3xl leading-[1.1] sm:text-[2.6rem]">
        {headline.title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {headline.body}
      </p>

      <Centrepiece
        status={status}
        amount={amount}
        arrival={arrival}
        slotStartMs={slotStartMs ?? null}
        slotEndMs={slotEndMs ?? null}
        installer={installer}
        paidOn={paidOn}
        accentText={style.text}
      />

      {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
    </section>
  );
}

function Centrepiece({
  status,
  amount,
  arrival,
  slotStartMs,
  slotEndMs,
  installer,
  paidOn,
  accentText,
}: {
  status: BookingStatus;
  amount?: string | null;
  arrival?: ArrivalParts | null;
  slotStartMs: number | null;
  slotEndMs: number | null;
  installer?: string | null;
  paidOn?: string | null;
  accentText: string;
}) {
  switch (status) {
    case "enquiry":
      return <Working label="Being priced by hand" />;

    case "quoted":
      return amount ? (
        <Money amount={amount} caption="Fixed price, GST included" accent={accentText} />
      ) : null;

    case "invoiced":
      return amount ? (
        <Money amount={amount} caption="Total due, GST included" accent={accentText} />
      ) : null;

    case "approved":
    case "booked":
    case "in_progress":
      return arrival ? (
        <ArrivalTicket
          {...arrival}
          installer={installer}
          slotStartMs={slotStartMs}
          slotEndMs={slotEndMs}
          className="mt-6"
        />
      ) : (
        // Accepted but no window locked in yet — the commonest resting state on
        // a busy portal, and the one that used to render a hero with nothing
        // in it at all.
        <Working label="Finding you a window" />
      );

    case "completed":
      return (
        <p
          className={cn(
            "mt-6 inline-flex items-center gap-2 text-sm font-medium",
            accentText
          )}
        >
          <CheckCircle2 className="size-5" />
          Work finished{installer ? ` by ${installer}` : ""}
        </p>
      );

    case "paid":
      return amount ? <Receipt amount={amount} paidOn={paidOn} /> : null;

    case "cancelled":
      return null;
  }
}

/** Big money, for the two stages that are entirely about a number. */
function Money({
  amount,
  caption,
  accent,
}: {
  amount: string;
  caption: string;
  accent: string;
}) {
  return (
    <div className="mt-6">
      <p className={cn("font-display text-4xl leading-none sm:text-5xl", accent)}>
        {amount}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {caption}
      </p>
    </div>
  );
}

/**
 * The paid state, stamped.
 *
 * A settled job is the one page a customer comes back to months later, looking
 * for proof. A stamp says "this is closed and here's the evidence" in a way a
 * green tick next to the word Paid never quite does.
 */
function Receipt({ amount, paidOn }: { amount: string; paidOn?: string | null }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
      <div>
        <p className="font-display text-4xl leading-none text-emerald-700 sm:text-5xl dark:text-emerald-500">
          {amount}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {paidOn ? `Settled ${paidOn}` : "Settled in full"}
        </p>
      </div>
      <span
        aria-hidden
        className="-rotate-[8deg] rounded-md border-2 border-emerald-600/50 px-3 py-1 font-display text-lg uppercase tracking-[0.22em] text-emerald-700/70 dark:border-emerald-500/55 dark:text-emerald-500/85"
      >
        Paid
      </span>
    </div>
  );
}

/**
 * A wait, made to look like work in progress rather than a stalled page.
 *
 * Pricing and slot-finding are both done by hand here, so there is genuinely
 * nothing to show yet — but a bare line of text reads as "nothing is
 * happening", and these two stages are where jobs sit longest.
 */
function Working({ label }: { label: string }) {
  return (
    <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border bg-background/70 px-3.5 py-2">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse rounded-full bg-brand"
            style={{ animationDelay: `${i * 220}ms`, animationDuration: "1.4s" }}
          />
        ))}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
