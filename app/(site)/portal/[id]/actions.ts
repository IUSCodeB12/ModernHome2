"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { canTransition, type BookingStatus } from "@/lib/bookings/status";

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
    .select("id, bookings(id, status, customer_id)")
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
    .select("id, bookings(id, status, customer_id)")
    .eq("id", quoteId)
    .maybeSingle();

  const booking = quote?.bookings;
  if (!quote || !booking) return { error: "We couldn't find that booking." };
  if (booking.customer_id !== user.id) return { error: "Not authorised." };

  const status = booking.status as BookingStatus;
  if (!["approved", "booked"].includes(status)) {
    return { error: "This booking can't be rescheduled here — please contact us." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("bookings")
    .update({
      reschedule_requested_at: new Date().toISOString(),
      reschedule_note: note.trim().slice(0, 500) || null,
    })
    .eq("id", booking.id);
  if (error) return { error: "Something went wrong — please try again." };

  revalidatePath(`/portal/${quoteId}`);
  revalidatePath("/portal");
  return { ok: "Thanks — we'll be in touch to arrange a new time." };
}
