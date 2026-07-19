"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
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
import { updateBookingStatus } from "@/app/(admin)/admin/(dashboard)/bookings/actions";
import type { AdminBookingRow } from "@/lib/admin/bookings-data";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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
