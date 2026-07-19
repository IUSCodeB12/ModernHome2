"use client";

import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import type { CalendarBooking } from "@/lib/admin/calendar-data";
import type { Tables } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function CalendarWeek({
  weekStartISO,
  weekOffset,
  bookings,
  blocked,
}: {
  weekStartISO: string;
  weekOffset: number;
  bookings: CalendarBooking[];
  blocked: Tables<"blocked_dates">[];
}) {
  const router = useRouter();
  const weekStart = new Date(weekStartISO);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const blockedSet = new Set(blocked.map((b) => b.date));

  const byDay = (day: Date) => {
    const key = formatInTimeZone(day, BUSINESS_TIME_ZONE, "yyyy-MM-dd");
    return bookings
      .filter(
        (b) =>
          b.slot_start &&
          formatInTimeZone(new Date(b.slot_start), BUSINESS_TIME_ZONE, "yyyy-MM-dd") === key
      )
      .sort((a, b) => (a.slot_start ?? "").localeCompare(b.slot_start ?? ""));
  };

  const go = (offset: number) => router.push(`/admin/calendar?week=${offset}`);

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="font-medium">
          {formatInTimeZone(weekStart, BUSINESS_TIME_ZONE, "d MMM")} –{" "}
          {formatInTimeZone(addDays(weekStart, 6), BUSINESS_TIME_ZONE, "d MMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => go(weekOffset - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => go(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => go(weekOffset + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 divide-x">
        {days.map((day) => {
          const key = formatInTimeZone(day, BUSINESS_TIME_ZONE, "yyyy-MM-dd");
          const isBlocked = blockedSet.has(key);
          const dayBookings = byDay(day);
          return (
            <div key={key} className={cn("min-h-40 p-2", isBlocked && "bg-muted/60")}>
              <div className="mb-2 text-center">
                <div className="text-xs uppercase text-muted-foreground">
                  {formatInTimeZone(day, BUSINESS_TIME_ZONE, "EEE")}
                </div>
                <div className="text-lg font-semibold">
                  {formatInTimeZone(day, BUSINESS_TIME_ZONE, "d")}
                </div>
              </div>
              {isBlocked && (
                <p className="mb-1 rounded bg-muted px-1 py-0.5 text-center text-[10px] uppercase text-muted-foreground">
                  Blocked
                </p>
              )}
              <div className="space-y-1">
                {dayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded bg-primary/10 px-1.5 py-1 text-[11px] leading-tight"
                    title={`${b.quote_requests?.services?.name} — ${b.profiles?.full_name}`}
                  >
                    <div className="font-medium">
                      {b.slot_start
                        ? formatInTimeZone(new Date(b.slot_start), BUSINESS_TIME_ZONE, "HH:mm")
                        : ""}
                    </div>
                    <div className="truncate">{b.quote_requests?.services?.name ?? "Job"}</div>
                    <div className="truncate text-muted-foreground">{b.profiles?.full_name}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
