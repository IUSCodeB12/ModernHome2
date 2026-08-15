"use client";

import { CalendarClock } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

/**
 * The arrival window, as a ticket stub.
 *
 * This is the answer to the only question most customers open the portal to
 * ask, so it gets the largest object on the page and a clock that keeps
 * running. The stub shape — torn edge, date block on the left — is doing real
 * work: it reads as something issued to you, which a bordered box of text with
 * a calendar icon does not.
 *
 * Dates arrive pre-formatted from the server. They have to be rendered in
 * Australia/Melbourne whatever timezone the browser is sitting in, and the
 * server is the only place that knows that for certain.
 */
export function ArrivalTicket({
  weekday,
  day,
  month,
  window: windowLabel,
  installer,
  slotStartMs,
  slotEndMs,
  className,
}: {
  /** "THU" */
  weekday: string;
  /** "14" */
  day: string;
  /** "AUG" */
  month: string;
  /** "8:00am – 10:00am" */
  window: string;
  installer?: string | null;
  slotStartMs: number | null;
  slotEndMs: number | null;
  className?: string;
}) {
  const countdown = useCountdown(slotStartMs, slotEndMs);
  const arriving = countdown?.phase === "arriving";

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-xl border bg-background/70 backdrop-blur-sm",
        className
      )}
    >
      {/* Date block — the stub half. */}
      <div className="flex shrink-0 flex-col items-center justify-center px-4 py-4 sm:px-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {weekday}
        </span>
        <span className="font-display text-3xl leading-none sm:text-4xl">{day}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {month}
        </span>
      </div>

      {/*
       * The tear. Two notches punched out of the page ground with a dashed rule
       * between them — the same trick a printed ticket uses, and cheaper than an
       * SVG mask.
       */}
      <div className="relative shrink-0" aria-hidden>
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-background" />
        <span className="block h-full border-l border-dashed border-border" />
        <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-background" />
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-base font-medium sm:text-lg">{windowLabel}</p>
          {/* Wraps rather than truncates — on a phone this line ends in the
              installer's name, and "Ravi is on…" is worse than two lines. */}
          <p className="mt-0.5 text-xs text-muted-foreground">
            2-hour arrival window
            {installer ? ` · ${installer} is on the job` : ""}
          </p>
        </div>

        {/*
         * Reserved on the server render and filled a paint later — the label
         * depends on the clock at read time, so rendering it server-side would
         * ship a countdown that was already stale.
         */}
        <div className="min-h-[2.25rem] shrink-0 text-right">
          {countdown && countdown.phase !== "elapsed" && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
                arriving
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {arriving ? (
                <span className="size-1.5 animate-pulse rounded-full bg-brand-foreground" />
              ) : (
                <CalendarClock className="size-3.5" />
              )}
              {countdown.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
