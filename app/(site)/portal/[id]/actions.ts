"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { canTransition, type BookingStatus } from "@/lib/bookings/status";
import { notifyAdmin, notifyCustomer } from "@/lib/email/notify";

export type QuoteResponseState = { ok?: string; error?: string } | null;

type Decision = "accept" | "decline";

/**
 * Customer response to a quoted job. Ownership is verified with the caller's
 * RLS-scoped session client, then the status transition is written with the
 * service-role client (customers have no UPDATE policy on bookings).
 */
export async function respondToQuote(
  quoteId: string,
  decision: Decision
): Promise<QuoteResponseState> {
  if (!isSupabaseConfigured()) {
    return { error: "Not available right now." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  // RLS scopes this to the customer's own rows.
  const { data: quote } = await supabase
    .from("quote_requests")
    .select(
      "id, final_quote_cents, services(name), profiles(full_name), bookings(id, status, customer_id, slot_start, slot_end)"
    )
    .eq("id", quoteId)
    .maybeSingle();

  const booking = quote?.bookings;
  if (!quote || !booking) return { error: "We couldn't find that quote." };
  if (booking.customer_id !== user.id) return { error: "Not authorised." };

  const current = booking.status as BookingStatus;
  const target: BookingStatus = decision === "accept" ? "approved" : "cancelled";

  if (current !== "quoted" || !canTransition(current, target)) {
    return { error: "This quote can no longer be changed here." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({ status: target })
    .eq("id", booking.id);

  if (error) return { error: "Something went wrong — please try again." };

  // The tradie's only signal that a job was won or lost used to be opening the
  // dashboard. Accepting is the moment a lead becomes work, so it's the one
  // alert that most needs to arrive on a phone.
  const service = quote.services?.name ?? "their job";
  const customerName = quote.profiles?.full_name ?? null;
  if (decision === "accept") {
    await notifyAdmin(admin, "admin_quote_accepted", {
      service,
      customerName,
      amountCents: quote.final_quote_cents,
      slotStart: booking.slot_start,
      slotEnd: booking.slot_end,
    });
  } else {
    await Promise.all([
      notifyAdmin(admin, "admin_quote_declined", {
        service,
        customerName,
        amountCents: quote.final_quote_cents,
      }),
      // Confirm the cancellation back to the customer too — it's their paper
      // trail, and it gives an accidental click a way back.
      notifyCustomer(admin, booking.customer_id, "booking_cancelled", {
        service,
        slotStart: booking.slot_start,
      }),
    ]);
  }

  revalidatePath(`/portal/${quoteId}`);
  revalidatePath("/portal");
  return {
    ok:
      decision === "accept"
        ? "Quote accepted — we'll confirm your booking shortly."
        : "Quote declined. No worries — reach out any time.",
  };
}

/**
 * Customer flags that they'd like a different arrival time. Records the request
 * (+ optional note) on their own booking; an admin picks a new slot.
 */
export async function requestReschedule(
  quoteId: string,
  note: string
): Promise<QuoteResponseState> {
  if (!isSupabaseConfigured()) return { error: "Not available right now." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { data: quote } = await supabase
    .from("quote_requests")
    .select(
      "id, services(name), profiles(full_name), bookings(id, status, customer_id, slot_start, slot_end)"
    )
    .eq("id", quoteId)
    .maybeSingle();

  const booking = quote?.bookings;
  if (!quote || !booking) return { error: "We couldn't find that booking." };
  if (booking.customer_id !== user.id) return { error: "Not authorised." };

  const status = booking.status as BookingStatus;
  if (!["approved", "booked"].includes(status)) {
    return { error: "This booking can't be rescheduled here — please contact us." };
  }

  const trimmedNote = note.trim().slice(0, 500) || null;

  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({
      reschedule_requested_at: new Date().toISOString(),
      reschedule_note: trimmedNote,
    })
    .eq("id", booking.id);
  if (error) return { error: "Something went wrong — please try again." };

  // Both halves of this were missing: the tradie was never told a reschedule
  // had been asked for (it only showed as a flag on the booking row), and the
  // `reschedule_requested` template existed but had no call site at all.
  const service = quote.services?.name ?? "your job";
  await Promise.all([
    notifyCustomer(admin, booking.customer_id, "reschedule_requested", {
      service,
      slotStart: booking.slot_start,
    }),
    notifyAdmin(admin, "admin_reschedule_requested", {
      service,
      customerName: quote.profiles?.full_name ?? null,
      slotStart: booking.slot_start,
      note: trimmedNote,
    }),
  ]);

  revalidatePath(`/portal/${quoteId}`);
  revalidatePath("/portal");
  return { ok: "Thanks — we'll be in touch to arrange a new time." };
}
