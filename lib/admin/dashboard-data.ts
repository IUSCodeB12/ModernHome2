import { addDays, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { demoQuotes } from "@/lib/admin/demo";
import type { Tables } from "@/lib/database.types";

export type DashboardStats = {
  newRequests: number;
  jobsThisWeek: number;
  revenueThisMonthCents: number;
  pendingQuotes: number;
};

export type UpcomingBooking = Pick<
  Tables<"bookings">,
  "id" | "slot_start" | "slot_end" | "status" | "suburb" | "address_line1"
> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "phone"> | null;
  quote_requests: { services: Pick<Tables<"services">, "name"> | null } | null;
};

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  today: UpcomingBooking[];
  tomorrow: UpcomingBooking[];
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    const quotes = demoQuotes();
    const demoBooking: UpcomingBooking = {
      id: "demo-booking-1",
      slot_start: new Date().toISOString(),
      slot_end: addDays(new Date(), 0).toISOString(),
      status: "quoted",
      suburb: "Richmond",
      address_line1: "12 Sample St",
      profiles: { full_name: "Jordan Nguyen", phone: "0400 111 222" },
      quote_requests: { services: { name: "TV Wall Mounting" } },
    };
    return {
      stats: {
        newRequests: quotes.filter((q) => q.status === "pending").length,
        jobsThisWeek: 2,
        revenueThisMonthCents: 128000,
        pendingQuotes: quotes.filter((q) => q.status === "pending").length,
      },
      today: [demoBooking],
      tomorrow: [],
      demo: true,
    };
  }

  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = addDays(todayStart, 1);
  const tomorrowEnd = addDays(todayStart, 2);

  const bookingSelect =
    "id, slot_start, slot_end, status, suburb, address_line1, profiles(full_name, phone), quote_requests(services(name))";

  const [pendingRes, weekRes, invoiceRes, todayRes, tomorrowRes] = await Promise.all([
    supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("slot_start", weekStart.toISOString())
      .lte("slot_start", weekEnd.toISOString())
      .neq("status", "cancelled"),
    supabase
      .from("invoices")
      .select("total_cents, paid_at")
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString()),
    supabase
      .from("bookings")
      .select(bookingSelect)
      .gte("slot_start", todayStart.toISOString())
      .lt("slot_start", todayEnd.toISOString())
      .neq("status", "cancelled")
      .order("slot_start"),
    supabase
      .from("bookings")
      .select(bookingSelect)
      .gte("slot_start", todayEnd.toISOString())
      .lt("slot_start", tomorrowEnd.toISOString())
      .neq("status", "cancelled")
      .order("slot_start"),
  ]);

  const revenueThisMonthCents = (invoiceRes.data ?? []).reduce(
    (sum, inv) => sum + (inv.total_cents ?? 0),
    0
  );

  return {
    stats: {
      newRequests: pendingRes.count ?? 0,
      jobsThisWeek: weekRes.count ?? 0,
      revenueThisMonthCents,
      pendingQuotes: pendingRes.count ?? 0,
    },
    today: (todayRes.data ?? []) as unknown as UpcomingBooking[],
    tomorrow: (tomorrowRes.data ?? []) as unknown as UpcomingBooking[],
    demo: false,
  };
}
