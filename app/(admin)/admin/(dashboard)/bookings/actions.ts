"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { canTransition, type BookingStatus } from "@/lib/bookings/status";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { notifyCustomer } from "@/lib/email/notify";
import {
  ensureInvoiceForBooking,
  markInvoicePaidForBooking,
} from "@/lib/invoice/create";
import type { TablesUpdate } from "@/lib/database.types";

const schema = z.object({
  bookingId: z.string().min(1),
  toStatus: z.enum([
    "enquiry", "quoted", "approved", "booked", "in_progress",
    "completed", "invoiced", "paid", "cancelled",
  ]),
});

export async function updateBookingStatus(
  input: z.input<typeof schema>
): Promise<ActionResult<{ status: BookingStatus }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { bookingId, toStatus } = parsed.data;

  if (!isSupabaseConfigured()) {
    return { ok: true, data: { status: toStatus } } as ActionResult<{ status: BookingStatus }>;
  }

  return adminAction(async ({ admin }) => {
    const { data: booking } = await admin
      .from("bookings")
      .select(
        "id, status, customer_id, deposit_paid_at, slot_start, quote_requests(services(name))"
      )
      .eq("id", bookingId)
      .single();
    if (!booking) throw new Error("Booking not found.");

    const from = booking.status as BookingStatus;
    if (!canTransition(from, toStatus)) {
      throw new Error(`Can't move a ${from} job straight to ${toStatus}.`);
    }

    const patch: TablesUpdate<"bookings"> = { status: toStatus };
    // Moving into 'booked' means the deposit is in and the job is locked —
    // stamp the deposit time (if not already) and confirm with the customer.
    if (toStatus === "booked" && !booking.deposit_paid_at) {
      patch.deposit_paid_at = new Date().toISOString();
    }

    const { error } = await admin.from("bookings").update(patch).eq("id", bookingId);
    if (error) throw new Error(error.message);

    const serviceName =
      booking.quote_requests?.services?.name ?? "your job";
    if (toStatus === "booked") {
      await notifyCustomer(admin, booking.customer_id, "booking_confirmed", {
        service: serviceName,
        slotStart: booking.slot_start,
      });
    } else if (toStatus === "completed") {
      await notifyCustomer(admin, booking.customer_id, "payment_due", {
        service: serviceName,
      });
    } else if (toStatus === "invoiced") {
      // Auto-create the invoice from the accepted quote line items.
      await ensureInvoiceForBooking(admin, bookingId);
    } else if (toStatus === "paid") {
      await markInvoicePaidForBooking(admin, bookingId);
      await notifyCustomer(admin, booking.customer_id, "receipt_ready", {
        service: serviceName,
      });
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin");
    revalidatePath("/admin/invoices");
    revalidatePath(`/portal`);
    return { status: toStatus };
  });
}

const rescheduleSchema = z.object({
  bookingId: z.string().min(1),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
});

/** Admin sets a new arrival window for a booking (e.g. after a reschedule request). */
export async function rescheduleBooking(
  input: z.input<typeof rescheduleSchema>
): Promise<ActionResult<{ slotStart: string }>> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid times." };
  const { bookingId, slotStart, slotEnd } = parsed.data;

  if (new Date(slotEnd) <= new Date(slotStart)) {
    return { ok: false, error: "End time must be after the start." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: true, data: { slotStart } };
  }

  return adminAction(async ({ admin }) => {
    const { data: booking } = await admin
      .from("bookings")
      .select("id, customer_id, quote_requests(services(name))")
      .eq("id", bookingId)
      .single();
    if (!booking) throw new Error("Booking not found.");

    const { error } = await admin
      .from("bookings")
      .update({
        slot_start: slotStart,
        slot_end: slotEnd,
        reschedule_requested_at: null,
        reschedule_note: null,
      })
      .eq("id", bookingId);
    // 23P01 = the new window overlaps another active booking.
    if (error?.code === "23P01") {
      throw new Error("That window clashes with another booking.");
    }
    if (error) throw new Error(error.message);

    await notifyCustomer(admin, booking.customer_id, "reschedule_confirmed", {
      service: booking.quote_requests?.services?.name ?? "your job",
      slotStart,
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/calendar");
    revalidatePath("/portal");
    return { slotStart };
  });
}
