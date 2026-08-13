import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { SendEmailResult } from "@/lib/email/send";
import type { EmailTemplate } from "@/lib/email/templates";

type Admin = SupabaseClient<Database>;

/**
 * Delivery log + send reservation.
 *
 * **Everything here fails open.** A send is worth more than its audit row, so
 * any problem writing the log — including the table not existing yet, before
 * the migration is pushed — lets the email through and logs a warning. The one
 * exception is a duplicate, which is the whole point of the mechanism.
 */

export type EmailClaim = {
  /** False only when this exact send has already been reserved. */
  proceed: boolean;
  /** Null when logging is unavailable; the send still goes ahead. */
  logId: string | null;
};

const PROCEED_UNLOGGED: EmailClaim = { proceed: true, logId: null };

/** unique_violation — someone already reserved this dedupe_key. */
const DUPLICATE = "23505";
/** undefined_table — the migration hasn't been pushed yet. */
const NO_TABLE = "42P01";

export type ClaimInput = {
  template: EmailTemplate;
  recipient: string;
  /** Null opts out of deduping: this send may legitimately repeat. */
  dedupeKey?: string | null;
  bookingId?: string | null;
  quoteRequestId?: string | null;
};

/**
 * Reserve the right to send, by inserting a `pending` row.
 *
 * The insert *is* the lock. A read-then-write ("have we sent this?") would let
 * two concurrent callers — an admin double-clicking a status button — both see
 * "no" and both send. Here the second insert loses to the partial unique index
 * and gets `proceed: false`.
 */
export async function claimSend(
  admin: Admin,
  input: ClaimInput
): Promise<EmailClaim> {
  try {
    const { data, error } = await admin
      .from("email_log")
      .insert({
        template: input.template,
        recipient: input.recipient,
        status: "pending",
        dedupe_key: input.dedupeKey ?? null,
        booking_id: input.bookingId ?? null,
        quote_request_id: input.quoteRequestId ?? null,
      })
      .select("id")
      .single();

    if (error?.code === DUPLICATE) {
      console.info(
        `[email] "${input.template}" already sent for ${input.dedupeKey} — suppressed`
      );
      return { proceed: false, logId: null };
    }
    if (error?.code === NO_TABLE) {
      console.warn(
        "[email] email_log table missing — sending unlogged. Push supabase/migrations."
      );
      return PROCEED_UNLOGGED;
    }
    if (error) {
      console.error("[email] could not write email_log; sending anyway", error);
      return PROCEED_UNLOGGED;
    }
    return { proceed: true, logId: data.id };
  } catch (err) {
    console.error("[email] claimSend threw; sending anyway", err);
    return PROCEED_UNLOGGED;
  }
}

/**
 * Close out a reservation with what actually happened.
 *
 * Anything other than a real send releases the dedupe key. A failed attempt
 * must not permanently block the retry, and a stubbed send (no RESEND_API_KEY,
 * i.e. local dev) must not consume the key that the first real send will need.
 */
export async function recordResult(
  admin: Admin,
  logId: string | null,
  result: SendEmailResult
): Promise<void> {
  if (!logId) return;

  const sent = result.ok && !result.skipped;
  const status = result.ok ? (result.skipped ? "skipped" : "sent") : "failed";

  try {
    const { error } = await admin
      .from("email_log")
      .update({
        status,
        provider_id: result.ok ? (result.id ?? null) : null,
        error: result.ok ? null : result.error.slice(0, 500),
        ...(sent ? {} : { dedupe_key: null }),
      })
      .eq("id", logId);
    if (error) console.error("[email] could not finalise email_log row", error);
  } catch (err) {
    console.error("[email] recordResult threw", err);
  }
}
