import { addDays, startOfWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoQuotes } from "@/lib/admin/demo";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import type { Tables } from "@/lib/database.types";

export type CalendarBooking = Pick<
  Tables<"bookings">,
  "id" | "slot_start" | "slot_end" | "status"
> & {
  profiles: Pick<Tables<"profiles">, "full_name"> | null;
  quote_requests: { services: Pick<Tables<"services">, "name"> | null } | null;
};

export type CalendarData = {
  weekStartISO: string;
  bookings: CalendarBooking[];
  rules: Tables<"availability_rules">[];
  blocked: Tables<"blocked_dates">[];
  demo: boolean;
};

export async function getCalendarData(weekOffset = 0): Promise<CalendarData> {
  // Anchor the week to the business timezone's current day.
  const todayLocal = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const base = new Date(`${todayLocal}T00:00:00`);
  const weekStart = addDays(startOfWeek(base, { weekStartsOn: 1 }), weekOffset * 7);
  const weekEnd = addDays(weekStart, 7);

  if (!isSupabaseConfigured()) {
    const bookings = demoQuotes()
      .filter((q) => q.bookings)
      .map((q) => ({
        id: q.bookings!.id,
        slot_start: q.bookings!.slot_start,
        slot_end: q.bookings!.slot_end,
        status: q.bookings!.status,
        profiles: q.profiles ? { full_name: q.profiles.full_name } : null,
        quote_requests: { services: { name: q.services.name } },
      })) as CalendarBooking[];
    return {
      weekStartISO: weekStart.toISOString(),
      bookings,
      rules: [1, 2, 3, 4, 5].map((d, i) => ({
        id: `demo-rule-${i}`, day_of_week: d, start_time: "09:00:00", end_time: "17:00:00",
        active: true, created_at: "", updated_at: "",
      })),
      blocked: [],
      demo: true,
    };
  }

  const supabase = await createClient();
  const [bookingsRes, rulesRes, blockedRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, slot_start, slot_end, status, profiles(full_name), quote_requests(services(name))")
      .gte("slot_start", weekStart.toISOString())
      .lt("slot_start", weekEnd.toISOString())
      .neq("status", "cancelled")
      .order("slot_start"),
    supabase.from("availability_rules").select("*").order("day_of_week").order("start_time"),
    supabase.from("blocked_dates").select("*").order("date"),
  ]);

  return {
    weekStartISO: weekStart.toISOString(),
    bookings: (bookingsRes.data ?? []) as unknown as CalendarBooking[],
    rules: rulesRes.data ?? [],
    blocked: blockedRes.data ?? [],
    demo: false,
  };
}
