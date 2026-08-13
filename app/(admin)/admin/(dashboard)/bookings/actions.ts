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

type Admin = Awaited<ReturnType<typeof import("@/lib/admin/guard").assertAdmin>>["admin"];

/** "12 Smith St, Brunswick 3056" — omitted entirely if we don't hold one. */
function formatAddress(booking: {
  address_line1: string | null;
  suburb: string | null;
  postcode: string | null;
}): string | null {
  const locality = [booking.suburb, booking.postcode].filter(Boolean).join(" ");
  const parts = [booking.address_line1, locality].filter(
    (p): p is string => Boolean(p?.trim())
  );
  return parts.length ? parts.join(", ") : null;
}

/**
 * What the customer actually owes, straight from the invoice.
 *
 * Null when there's nothing to bill (`ensureInvoiceForBooking` returns null for
 * a job with no breakdown and no price). The templates drop the row rather than
 * printing a confident $0.00.
 */
async function invoiceTotalCents(
  admin: Admin,
  bookingId: string
): Promise<number | null> {
  const { data } = await admin
    .from("invoices")
    .select("total_cents")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return data?.total_cents ?? null;
}

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
        "id, status, customer_id, deposit_paid_at, slot_start, slot_end, address_line1, suburb, postcode, quote_requests(services(name))"
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
    // Keyed on the arrival window, not just the booking: bouncing a job
    // booked -> approved -> booked used to re-send the confirmation each time,
    // but re-confirming a window the customer already has is noise. Move the
    // window and the key changes, so a genuine re-confirmation still lands.
    if (toStatus === "booked") {
      await notifyCustomer(
        admin,
        booking.customer_id,
        "booking_confirmed",
        {
          service: serviceName,
          slotStart: booking.slot_start,
          slotEnd: booking.slot_end,
          address: formatAddress(booking),
        },
        {
          bookingId,
          dedupeKey: `booking_confirmed:${bookingId}:${booking.slot_start}`,
        }
      );
    } else if (toStatus === "invoiced") {
      // Auto-create the invoice from the accepted quote line items, *then*
      // ask for payment. This email used to fire on 'completed' — one step
      // earlier, before any invoice existed — so it asked a customer to pay
      // an amount it couldn't name, for a bill they couldn't yet open.
      await ensureInvoiceForBooking(admin, bookingId);
      // The amount is part of the key: re-issuing an invoice at a *different*
      // total is news the customer needs, re-issuing the same one isn't.
      const dueCents = await invoiceTotalCents(admin, bookingId);
      await notifyCustomer(
        admin,
        booking.customer_id,
        "payment_due",
        { service: serviceName, amountCents: dueCents },
        { bookingId, dedupeKey: `payment_due:${bookingId}:${dueCents}` }
      );
    } else if (toStatus === "paid") {
      // Read the total before marking paid — same figure either way, but it
      // keeps the receipt independent of that write succeeding.
      const amountCents = await invoiceTotalCents(admin, bookingId);
      await markInvoicePaidForBooking(admin, bookingId);
      await notifyCustomer(
        admin,
        booking.customer_id,
        "receipt_ready",
        { service: serviceName, amountCents },
        { bookingId, dedupeKey: `receipt_ready:${bookingId}:${amountCents}` }
      );
    } else if (toStatus === "cancelled" && from !== "enquiry") {
      // Cancelling is reachable from every state, and until now told the
      // customer nothing — including someone holding a confirmed arrival
      // window. Skipped only from 'enquiry', where the customer has had no
      // contact yet and the cancel is the tradie clearing a dead lead.
      // Quote rejection has its own email and updates bookings directly,
      // so it doesn't reach this branch and won't double up.
      await notifyCustomer(
        admin,
        booking.customer_id,
        "booking_cancelled",
        { service: serviceName, slotStart: booking.slot_start },
        { bookingId, dedupeKey: `booking_cancelled:${bookingId}` }
      );
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin");
    revalidatePath("/admin/invoices");
    revalidatePath(`/portal`);
    return { status: toStatus };
  });
}

/** Assign (or clear) the installer for a booking. */
export async function assignInstaller(
  input: { bookingId: string; installer: string }
): Promise<ActionResult<{ installer: string | null }>> {
  const bookingId = z.string().min(1).safeParse(input.bookingId);
  if (!bookingId.success) return { ok: false, error: "Invalid request." };
  const installer = input.installer.trim().slice(0, 120) || null;

  if (!isSupabaseConfigured()) return { ok: true, data: { installer } };

  return adminAction(async ({ admin }) => {
    const { error } = await admin
      .from("bookings")
      .update({ assigned_installer: installer })
      .eq("id", bookingId.data);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/bookings");
    return { installer };
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

    await notifyCustomer(
      admin,
      booking.customer_id,
      "reschedule_confirmed",
      {
        service: booking.quote_requests?.services?.name ?? "your job",
        slotStart,
        slotEnd,
      },
      { bookingId, dedupeKey: `reschedule_confirmed:${bookingId}:${slotStart}` }
    );

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/calendar");
    revalidatePath("/portal");
    return { slotStart };
  });
}
