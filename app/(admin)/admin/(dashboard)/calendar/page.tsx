import { getCalendarData } from "@/lib/admin/calendar-data";
import { CalendarWeek } from "@/components/admin/calendar-week";
import { AvailabilityManager } from "@/components/admin/availability-manager";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const weekOffset = Number(week ?? 0) || 0;
  const data = await getCalendarData(weekOffset);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          This week&apos;s jobs, plus your working hours and blocked days.
          {data.demo && " (Demo data — Supabase not configured.)"}
        </p>
      </div>

      <CalendarWeek
        weekStartISO={data.weekStartISO}
        weekOffset={weekOffset}
        bookings={data.bookings}
        blocked={data.blocked}
      />

      <AvailabilityManager rules={data.rules} blocked={data.blocked} />
    </div>
  );
}
