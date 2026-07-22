"use server";

import { z } from "zod";
import { addMinutes, isBefore } from "date-fns";
import { calculateDepositCents, calculateEstimate, type Answers } from "@/lib/quote/estimate";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

const answerValue = z.union([
  z.string(),
  z.array(z.string()),
  z.number(),
  z.boolean(),
  z.null(),
]);

const submitSchema = z.object({
  draftId: z.uuid(),
  serviceId: z.uuid(),
  answers: z.record(z.string(), answerValue),
  photoPaths: z.record(z.string(), z.array(z.string())),
  contact: z.object({
    fullName: z.string().min(2).max(120),
    phone: z.string().min(8).max(20),
    addressLine1: z.string().min(3).max(200),
    suburb: z.string().min(2).max(80),
    postcode: z.string().regex(/^\d{4}$/),
    accessNotes: z.string().max(1000).optional().default(""),
  }),
  slot: z.object({
    start: z.iso.datetime(),
    end: z.iso.datetime(),
  }),
});

export type SubmitQuoteInput = z.input<typeof submitSchema>;

export type SubmitQuoteResult =
  | { ok: true; quoteRequestId: string; bookingId: string | null; demo?: boolean }
  | { ok: false; error: string };

/**
 * Creates the quote_request (pending) + booking (enquiry) pair.
 *
 * TODO(stripe): Phase 4 — instead of finishing here, create a Stripe
 * Checkout Session for the deposit (20% of midpoint, min $50), return its
 * URL, and only flip the booking to 'booked' in the webhook once the
 * deposit is paid. deposit_cents is already persisted below.
 */
export async function submitQuoteRequest(
  input: SubmitQuoteInput
): Promise<SubmitQuoteResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some details look invalid — please go back and check." };
  }
  const payload = parsed.data;

  // Demo mode: no Supabase configured — simulate success so the wizard can
  // be exercised end-to-end locally.
  if (!isSupabaseConfigured()) {
    return { ok: true, quoteRequestId: payload.draftId, bookingId: null, demo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to submit a quote." };
  }

  // Recompute the estimate server-side — never trust client pricing.
  const { data: service } = await supabase
    .from("services")
    .select("*, service_questions(*)")
    .eq("id", payload.serviceId)
    .eq("active", true)
    .single();
  if (!service) {
    return { ok: false, error: "That service is no longer available." };
  }

  const estimate = calculateEstimate(
    service,
    service.service_questions,
    payload.answers as Answers
  );
  const depositCents = calculateDepositCents(estimate);

  const slotStart = new Date(payload.slot.start);
  const slotEnd = new Date(payload.slot.end);
  if (isBefore(slotStart, addMinutes(new Date(), 24 * 60))) {
    return { ok: false, error: "That time slot is too soon — please pick another." };
  }

  const admin = createAdminClient();

  // Slot still free? (non-cancelled bookings overlapping the window)
  const { data: clash } = await admin
    .from("bookings")
    .select("id")
    .neq("status", "cancelled")
    .lt("slot_start", slotEnd.toISOString())
    .gt("slot_end", slotStart.toISOString())
    .limit(1);
  if (clash && clash.length > 0) {
    return { ok: false, error: "Sorry — that slot was just taken. Please pick another." };
  }

  const photoUrls = Object.values(payload.photoPaths).flat();

  const { data: quoteRequest, error: quoteError } = await admin
    .from("quote_requests")
    .insert({
      id: payload.draftId,
      customer_id: user.id,
      service_id: payload.serviceId,
      answers: payload.answers,
      photo_urls: photoUrls,
      estimate_low_cents: estimate.low_cents,
      estimate_high_cents: estimate.high_cents,
      status: "pending",
    })
    .select("id")
    .single();
  if (quoteError || !quoteRequest) {
    console.error("[quote] quote_request insert failed", quoteError);
    return { ok: false, error: "Something went wrong saving your quote. Please try again." };
  }

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      quote_request_id: quoteRequest.id,
      customer_id: user.id,
      slot_start: slotStart.toISOString(),
      slot_end: slotEnd.toISOString(),
      status: "enquiry",
      deposit_cents: depositCents,
      address_line1: payload.contact.addressLine1,
      suburb: payload.contact.suburb,
      postcode: payload.contact.postcode,
      access_notes: payload.contact.accessNotes || null,
    })
    .select("id")
    .single();
  if (bookingError || !booking) {
    console.error("[quote] booking insert failed", bookingError);
    // Roll back the orphaned quote request so retries start clean.
    await admin.from("quote_requests").delete().eq("id", quoteRequest.id);
    // 23P01 = exclusion_violation: the slot was taken between our pre-check and
    // insert. The DB constraint is the real guard against the race.
    if (bookingError?.code === "23P01") {
      return { ok: false, error: "Sorry — that slot was just taken. Please pick another." };
    }
    return { ok: false, error: "Something went wrong saving your booking. Please try again." };
  }

  // Keep the profile up to date with the details provided.
  await admin
    .from("profiles")
    .update({
      full_name: payload.contact.fullName,
      phone: payload.contact.phone,
      suburb: payload.contact.suburb,
      postcode: payload.contact.postcode,
    })
    .eq("id", user.id);

  return { ok: true, quoteRequestId: quoteRequest.id, bookingId: booking.id };
}
