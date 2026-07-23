"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { formatInTimeZone } from "date-fns-tz";
import { KanbanSquare, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookingDrawer } from "@/components/admin/booking-drawer";
import { formatAud } from "@/lib/quote/estimate";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import {
  BOOKING_STATUS_LABELS,
  PIPELINE_COLUMNS,
  canTransition,
  type BookingStatus,
} from "@/lib/bookings/status";
import { updateBookingStatus } from "@/app/(admin)/admin/(dashboard)/bookings/actions";
import type { AdminBookingRow } from "@/lib/admin/bookings-data";
import { cn } from "@/lib/utils";

function bookingTitle(b: AdminBookingRow): string {
  return b.quote_requests?.services?.name ?? "Job";
}

function bookingAmount(b: AdminBookingRow): string {
  const q = b.quote_requests;
  if (q?.final_quote_cents != null) return formatAud(q.final_quote_cents);
  if (q?.estimate_low_cents != null && q?.estimate_high_cents != null) {
    return `~${formatAud(Math.round((q.estimate_low_cents + q.estimate_high_cents) / 2))}`;
  }
  return "—";
}

function Card({ booking, onOpen }: { booking: AdminBookingRow; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "cursor-grab rounded-lg border bg-background p-3 text-left shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <p className="text-sm font-medium">{bookingTitle(booking)}</p>
      <p className="text-xs text-muted-foreground">{booking.profiles?.full_name ?? "Customer"}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {booking.slot_start
            ? formatInTimeZone(new Date(booking.slot_start), BUSINESS_TIME_ZONE, "d MMM, HH:mm")
            : "Unscheduled"}
        </span>
        <span className="text-xs font-medium">{bookingAmount(booking)}</span>
      </div>
    </div>
  );
}

function Column({
  status,
  bookings,
  activeStatus,
  onOpen,
}: {
  status: BookingStatus;
  bookings: AdminBookingRow[];
  activeStatus: BookingStatus | null;
  onOpen: (b: AdminBookingRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const isValidTarget = activeStatus ? canTransition(activeStatus, status) : false;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-xl border bg-muted/30",
        activeStatus && isValidTarget && "ring-2 ring-primary/50",
        isOver && isValidTarget && "ring-2 ring-primary bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{BOOKING_STATUS_LABELS[status]}</span>
        <span className="text-xs text-muted-foreground">{bookings.length}</span>
      </div>
      <div className="flex-1 space-y-2 p-2">
        {bookings.map((b) => (
          <Card key={b.id} booking={b} onOpen={() => onOpen(b)} />
        ))}
      </div>
    </div>
  );
}

export function BookingsView({ bookings: initial }: { bookings: AdminBookingRow[] }) {
  const [view, setView] = useState<"board" | "table">("board");
  const [bookings, setBookings] = useState(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<AdminBookingRow | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStatus = useMemo(() => {
    const map = new Map<BookingStatus, AdminBookingRow[]>();
    for (const col of PIPELINE_COLUMNS) map.set(col, []);
    for (const b of bookings) {
      const s = b.status as BookingStatus;
      if (map.has(s)) map.get(s)!.push(b);
    }
    return map;
  }, [bookings]);

  const activeBooking = bookings.find((b) => b.id === activeId) ?? null;
  const activeStatus = (activeBooking?.status as BookingStatus) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const bookingId = String(e.active.id);
    const to = e.over ? (String(e.over.id) as BookingStatus) : null;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!to || !booking) return;

    const from = booking.status as BookingStatus;
    if (from === to) return;
    if (!canTransition(from, to)) {
      toast.error(`Can't move a ${from} job to ${to}.`);
      return;
    }

    // Optimistic update.
    const prev = bookings;
    setBookings((bs) => bs.map((b) => (b.id === bookingId ? { ...b, status: to } : b)));

    startTransition(async () => {
      const res = await updateBookingStatus({ bookingId, toStatus: to });
      if (res.ok) {
        toast.success(`Moved to ${BOOKING_STATUS_LABELS[to]}.`);
      } else {
        toast.error(res.error);
        setBookings(prev); // rollback
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant={view === "board" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("board")}
        >
          <KanbanSquare /> Board
        </Button>
        <Button
          variant={view === "table" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("table")}
        >
          <Table2 /> Table
        </Button>
      </div>

      {view === "board" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-3">
            {PIPELINE_COLUMNS.map((status) => (
              <Column
                key={status}
                status={status}
                bookings={byStatus.get(status) ?? []}
                activeStatus={activeStatus}
                onOpen={setDrawer}
              />
            ))}
          </div>
          <DragOverlay>
            {activeBooking ? <Card booking={activeBooking} onOpen={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No bookings yet.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => setDrawer(b)}>
                    <TableCell className="font-medium">{bookingTitle(b)}</TableCell>
                    <TableCell>{b.profiles?.full_name ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {b.slot_start
                        ? formatInTimeZone(new Date(b.slot_start), BUSINESS_TIME_ZONE, "d MMM, HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell>{bookingAmount(b)}</TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <BookingDrawer
        booking={drawer}
        onClose={() => setDrawer(null)}
        onStatusChange={(id, status) =>
          setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)))
        }
      />
    </div>
  );
}
