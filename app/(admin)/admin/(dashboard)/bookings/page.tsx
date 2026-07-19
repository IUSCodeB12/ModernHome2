import { getAdminBookings } from "@/lib/admin/bookings-data";
import { BookingsView } from "@/components/admin/bookings-view";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const { bookings, demo } = await getAdminBookings();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Drag jobs through the pipeline, or switch to the table view.
          {demo && " (Demo data — Supabase not configured.)"}
        </p>
      </div>
      <BookingsView bookings={bookings} />
    </div>
  );
}
