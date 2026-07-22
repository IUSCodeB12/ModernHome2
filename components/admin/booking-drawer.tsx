"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { CalendarClock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import {
  BOOKING_STATUS_LABELS,
  allowedTransitions,
  type BookingStatus,
} from "@/lib/bookings/status";
import {
  assignInstaller,
  rescheduleBooking,
  updateBookingStatus,
} from "@/app/(admin)/admin/(dashboard)/bookings/actions";
import type { AdminBookingRow } from "@/lib/admin/bookings-data";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

const toLocalInput = (iso: string | null) =>
  iso ? formatInTimeZone(new Date(iso), BUSINESS_TIME_ZONE, "yyyy-MM-dd'T'HH:mm") : "";

/** Assign an installer to the job (free-text, single-tradie for now). */
function AssignControl({ booking }: { booking: AdminBookingRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(booking.assigned_installer ?? "");

  function save() {
    startTransition(async () => {
      const res = await assignInstaller({ bookingId: booking.id, installer: name });
      if (res.ok) {
        toast.success(name.trim() ? `Assigned to ${name.trim()}.` : "Assignment cleared.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Assigned installer</p>
      <div className="flex gap-2">
        <Input
          value={name}
          placeholder="Installer name"
          onChange={(e) => setName(e.target.value)}
        />
        <Button size="sm" variant="outline" disabled={pending} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}

/** Two datetime inputs (Melbourne wall time) to set a new arrival window. */
function RescheduleControl({ booking }: { booking: AdminBookingRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [start, setStart] = useState(() => toLocalInput(booking.slot_start));
  const [end, setEnd] = useState(() => toLocalInput(booking.slot_end));

  function save() {
    if (!start || !end) return;
    const slotStart = fromZonedTime(start, BUSINESS_TIME_ZONE).toISOString();
    const slotEnd = fromZonedTime(end, BUSINESS_TIME_ZONE).toISOString();
    startTransition(async () => {
      const res = await rescheduleBooking({ bookingId: booking.id, slotStart, slotEnd });
      if (res.ok) {
        toast.success("Rescheduled — customer notified.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Reschedule</p>
      <div className="flex flex-wrap gap-2">
        <Input
          type="datetime-local"
          className="w-auto"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <Input
          type="datetime-local"
          className="w-auto"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <Button size="sm" variant="outline" disabled={pending} onClick={save}>
        Save new time
      </Button>
    </div>
  );
}

export function BookingDrawer({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: AdminBookingRow | null;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const status = (booking?.status as BookingStatus) ?? "enquiry";
  const transitions = booking ? allowedTransitions(status) : [];
  const invoice = booking?.invoices?.[0];

  function move(to: BookingStatus) {
    if (!booking) return;
    startTransition(async () => {
      const res = await updateBookingStatus({ bookingId: booking.id, toStatus: to });
      if (res.ok) {
        toast.success(`Moved to ${BOOKING_STATUS_LABELS[to]}.`);
        onStatusChange(booking.id, to);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Sheet open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        {booking && (
          <>
            <SheetHeader>
              <SheetTitle>{booking.quote_requests?.services?.name ?? "Job"}</SheetTitle>
              <SheetDescription>
                {booking.profiles?.full_name ?? "Customer"} · {booking.profiles?.phone ?? "—"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-6">
              <div className="flex items-center gap-2">
                <StatusBadge status={booking.status} />
              </div>

              {booking.reschedule_requested_at && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="flex items-center gap-1.5 font-medium">
                    <CalendarClock className="size-4" /> Reschedule requested
                  </p>
                  {booking.reschedule_note && (
                    <p className="mt-1 text-amber-800">“{booking.reschedule_note}”</p>
                  )}
                </div>
              )}

              <div className="divide-y rounded-lg border p-3">
                <Row
                  label="Slot"
                  value={
                    booking.slot_start && booking.slot_end
                      ? `${formatInTimeZone(new Date(booking.slot_start), BUSINESS_TIME_ZONE, "EEE d MMM, HH:mm")}–${formatInTimeZone(new Date(booking.slot_end), BUSINESS_TIME_ZONE, "HH:mm")}`
                      : "Unscheduled"
                  }
                />
                <Row
                  label="Address"
                  value={
                    booking.address_line1
                      ? `${booking.address_line1}, ${booking.suburb ?? ""} ${booking.postcode ?? ""}`
                      : "—"
                  }
                />
                {booking.access_notes && <Row label="Access" value={booking.access_notes} />}
                <Row
                  label="Quote"
                  value={
                    booking.quote_requests?.final_quote_cents != null
                      ? formatAud(booking.quote_requests.final_quote_cents)
                      : booking.quote_requests?.estimate_low_cents != null
                        ? `est. ${formatAud(booking.quote_requests.estimate_low_cents)}+`
                        : "—"
                  }
                />
                {booking.deposit_cents != null && (
                  <Row
                    label="Deposit"
                    value={`${formatAud(booking.deposit_cents)}${booking.deposit_paid_at ? " (paid)" : ""}`}
                  />
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {booking.quote_requests?.id && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/quotes/${booking.quote_requests.id}`}>
                      Quote <ExternalLink className="size-3.5" />
                    </Link>
                  </Button>
                )}
                {invoice && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/invoices">
                      {invoice.invoice_number} <ExternalLink className="size-3.5" />
                    </Link>
                  </Button>
                )}
              </div>

              <Separator />

              <AssignControl key={`assign-${booking.id}`} booking={booking} />

              <Separator />

              {booking.slot_start && (
                <>
                  <RescheduleControl key={booking.id} booking={booking} />
                  <Separator />
                </>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">Move to</p>
                <div className="flex flex-wrap gap-2">
                  {transitions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No further transitions.</p>
                  ) : (
                    transitions.map((to) => (
                      <Button
                        key={to}
                        size="sm"
                        variant={to === "cancelled" ? "outline" : "default"}
                        disabled={pending}
                        onClick={() => move(to)}
                        className={to === "cancelled" ? "text-destructive" : ""}
                      >
                        {BOOKING_STATUS_LABELS[to]}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
