"use client";

import { useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import {
  BUSINESS_TIME_ZONE,
  getOpenSlots,
  type OpenSlot,
} from "@/lib/slots";
import type { QuoteWizardData } from "@/lib/quote/types";
import type { SlotSelection } from "@/lib/quote/wizard-state";
import { cn } from "@/lib/utils";

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

  if (days.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Pick a time</h2>
        <p className="text-sm text-muted-foreground">
          No open slots in the next two weeks — submit without a time and
          we&apos;ll contact you to arrange one.
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pick an arrival window</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Times shown for Melbourne. We&apos;ll arrive within your 2-hour window.
        </p>
      </div>

      {/* Horizontal day picker */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex w-max gap-2">
          {days.map(([date, list]) => {
            const d = list[0].start;
            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setError(null);
                }}
                className={cn(
                  "flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 transition-colors",
                  selectedDate === date
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-foreground/30"
                )}
              >
                <span className="text-xs uppercase opacity-70">
                  {formatInTimeZone(d, BUSINESS_TIME_ZONE, "EEE")}
                </span>
                <span className="text-lg font-semibold">
                  {formatInTimeZone(d, BUSINESS_TIME_ZONE, "d")}
                </span>
                <span className="text-xs opacity-70">
                  {formatInTimeZone(d, BUSINESS_TIME_ZONE, "MMM")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot buttons */}
      <div className="grid grid-cols-2 gap-2">
        {daySlots.map((slot) => {
          const isSelected = selected?.start === slot.start.toISOString();
          return (
            <button
              key={slot.start.toISOString()}
              type="button"
              onClick={() => {
                setSelected({
                  start: slot.start.toISOString(),
                  end: slot.end.toISOString(),
                  label: slot.label,
                  localDate: slot.localDate,
                });
                setError(null);
              }}
              className={cn(
                "min-h-11 rounded-lg border text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-foreground/30"
              )}
            >
              {slot.label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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
          Continue
        </Button>
      </div>
    </div>
  );
}
