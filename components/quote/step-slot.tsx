"use client";

import { useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_TIME_ZONE, getOpenSlots, type OpenSlot } from "@/lib/slots";
import type { QuoteWizardData } from "@/lib/quote/types";
import type { SlotSelection } from "@/lib/quote/wizard-state";
import { cn } from "@/lib/utils";

function toSelection(slot: OpenSlot): SlotSelection {
  return {
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    label: slot.label,
    localDate: slot.localDate,
  };
}

export function StepSlot({
  data,
  initial,
  onBack,
  onNext,
}: {
  data: QuoteWizardData;
  initial: SlotSelection | null;
  onBack: () => void;
  onNext: (slot: SlotSelection) => void;
}) {
  const slots = useMemo(
    () =>
      getOpenSlots({
        from: new Date(),
        days: 14,
        rules: data.rules,
        blockedDates: data.blockedDates,
        bookings: data.busy,
      }),
    [data]
  );

  const days = useMemo(() => {
    const byDate = new Map<string, OpenSlot[]>();
    for (const slot of slots) {
      byDate.set(slot.localDate, [...(byDate.get(slot.localDate) ?? []), slot]);
    }
    return [...byDate.entries()];
  }, [slots]);

  const [selectedDate, setSelectedDate] = useState<string | null>(
    initial?.localDate ?? days[0]?.[0] ?? null
  );
  const [selected, setSelected] = useState<SlotSelection | null>(initial);
  const [error, setError] = useState<string | null>(null);

  const daySlots = days.find(([date]) => date === selectedDate)?.[1] ?? [];
  const earliest = slots[0] ?? null;

  if (days.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-2xl tracking-tight">Pick a time</h2>
        <p className="text-sm text-muted-foreground">
          No open slots in the next two weeks — go back and submit without a time
          and we&apos;ll contact you to arrange one.
        </p>
        <Button type="button" variant="outline" onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">
          When suits you?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Melbourne times. We&apos;ll arrive inside your 2-hour window.
        </p>
      </div>

      {/* One-tap shortcut — most people just want the soonest slot. */}
      {earliest && (
        <button
          type="button"
          onClick={() => onNext(toSelection(earliest))}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-brand/40 bg-brand/10 p-4 text-left",
            "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-brand hover:shadow-elev-2 active:scale-[0.99]"
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Zap className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Earliest available</span>
            <span className="block truncate text-sm text-muted-foreground">
              {formatInTimeZone(earliest.start, BUSINESS_TIME_ZONE, "EEEE d MMM")}
              , {earliest.label}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-brand" />
        </button>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-elev-1 sm:p-5">
        <p className="text-sm font-medium">Or choose a day</p>

        <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
          <div className="flex w-max gap-2">
            {days.map(([date, list]) => {
              const d = list[0].start;
              const on = selectedDate === date;
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setSelectedDate(date);
                    setError(null);
                  }}
                  className={cn(
                    "flex min-w-[4.25rem] flex-col items-center rounded-xl border px-3 py-2.5",
                    "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97]",
                    on
                      ? "border-brand bg-brand text-brand-foreground shadow-elev-1"
                      : "border-border hover:border-brand/40 hover:bg-accent/40"
                  )}
                >
                  <span className="text-[0.7rem] uppercase tracking-wide opacity-70">
                    {formatInTimeZone(d, BUSINESS_TIME_ZONE, "EEE")}
                  </span>
                  <span className="text-xl font-semibold tabular-nums">
                    {formatInTimeZone(d, BUSINESS_TIME_ZONE, "d")}
                  </span>
                  <span className="text-[0.7rem] opacity-70">
                    {formatInTimeZone(d, BUSINESS_TIME_ZONE, "MMM")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {daySlots.map((slot) => {
            const on = selected?.start === slot.start.toISOString();
            return (
              <button
                key={slot.start.toISOString()}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setSelected(toSelection(slot));
                  setError(null);
                }}
                className={cn(
                  "min-h-12 rounded-xl border text-sm font-medium",
                  "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]",
                  on
                    ? "border-brand bg-brand text-brand-foreground shadow-elev-1"
                    : "border-border hover:border-brand/40 hover:bg-accent/40"
                )}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => {
            if (!selected) {
              setError("Pick a time window to continue.");
              return;
            }
            onNext(selected);
          }}
        >
          Continue <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
