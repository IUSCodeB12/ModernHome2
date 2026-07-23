import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { BellRing, CalendarClock, FileClock, TrendingUp, Wrench } from "lucide-react";
import { getDashboardData, type UpcomingBooking } from "@/lib/admin/dashboard-data";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { StatusBadge } from "@/components/ui/status-badge";
import { NewRequestsWatcher } from "@/components/admin/new-requests-watcher";

export const dynamic = "force-dynamic";

function BookingList({ bookings }: { bookings: UpcomingBooking[] }) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No bookings scheduled.</p>;
  }
  return (
    <ul className="space-y-2">
      {bookings.map((b) => (
        <li key={b.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <p className="font-medium">
              {b.quote_requests?.services?.name ?? "Job"} — {b.profiles?.full_name ?? "Customer"}
            </p>
            <p className="text-sm text-muted-foreground">
              {b.slot_start
                ? formatInTimeZone(new Date(b.slot_start), BUSINESS_TIME_ZONE, "HH:mm")
                : "—"}
              {b.suburb ? ` · ${b.suburb}` : ""}
            </p>
          </div>
          <StatusBadge status={b.status} />
        </li>
      ))}
    </ul>
  );
}

export default async function AdminDashboardPage() {
  const { stats, today, tomorrow, demo } = await getDashboardData();

  const cards = [
    { label: "New requests", value: stats.newRequests, icon: FileClock },
    { label: "Jobs this week", value: stats.jobsThisWeek, icon: CalendarClock },
    { label: "Revenue this month", value: formatAud(stats.revenueThisMonthCents), icon: TrendingUp },
    { label: "Pending quotes", value: stats.pendingQuotes, icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {demo ? "Demo data — Supabase not configured." : "Live overview of your business."}
          </p>
        </div>
        {!demo && <NewRequestsWatcher />}
      </div>

      {stats.awaitingConfirmation > 0 && (
        <Link
          href="/admin/bookings"
          className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 transition-colors hover:bg-amber-100"
        >
          <BellRing className="size-5 shrink-0" />
          <span className="text-sm font-medium">
            {stats.awaitingConfirmation} customer
            {stats.awaitingConfirmation > 1 ? "s" : ""} accepted their quote — take
            the deposit and move the job to <span className="font-semibold">Booked</span>{" "}
            to confirm.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-medium">Today</h2>
          <BookingList bookings={today} />
        </section>
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-medium">Tomorrow</h2>
          <BookingList bookings={tomorrow} />
        </section>
      </div>
    </div>
  );
}
