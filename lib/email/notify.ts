import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { runAfterResponse } from "@/lib/email/background";
import { claimSend, recordResult } from "@/lib/email/log";
import { sendEmail } from "@/lib/email/send";
import type { EmailTemplate, TemplatePayloads } from "@/lib/email/templates";

type Admin = SupabaseClient<Database>;

/**
 * Recipient resolution and dispatch: turns "tell the customer" or "tell the
 * tradie" into addresses, reserves the send, and hands off to `sendEmail`.
 *
 * **Nothing here throws, and nothing here blocks.** These run inside server
 * actions after the database write has already succeeded, so a mail failure
 * must not roll back — or appear to roll back — a booking that really
 * happened. The work is scheduled with `after()` (see `background.ts`), which
 * is why callers get a `void` back: the outcome isn't known yet by design.
 * Results land in `email_log`, not in the return value.
 */

/**
 * Admin-facing templates are identified by their `admin_` prefix, which makes
 * the naming convention load-bearing: `notifyCustomer` cannot be handed an
 * internal alert, and `notifyAdmin` cannot be handed customer copy.
 */
export type AdminTemplate = Extract<EmailTemplate, `admin_${string}`>;
export type CustomerTemplate = Exclude<EmailTemplate, AdminTemplate>;

export type NotifyOptions = {
  /**
   * Opt in to once-only delivery. Include whatever makes a resend legitimate —
   * `booking_confirmed:<booking>:<slot>` suppresses re-confirming the same
   * window while still allowing a new one through. Omit when a template may
   * fire repeatedly by design.
   */
  dedupeKey?: string | null;
  /** Ties the log row to the job, so delivery history is answerable per booking. */
  bookingId?: string | null;
  quoteRequestId?: string | null;
};

/** Look up a user's sign-in address. Customers have no email column on `profiles`. */
async function emailForUser(admin: Admin, userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    console.error(`[email] could not resolve address for user ${userId}`, error);
    return null;
  }
  return data?.user?.email ?? null;
}

/**
 * Where internal alerts go.
 *
 * `ADMIN_EMAIL` (comma-separated) wins, so alerts can be routed somewhere
 * other than the tradie's sign-in address. With it unset we fall back to
 * whoever actually holds the admin role, which means alerts work with no
 * configuration and follow the role if it moves.
 */
async function adminRecipients(admin: Admin): Promise<string[]> {
  const configured = process.env.ADMIN_EMAIL?.split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  if (configured?.length) return [...new Set(configured)];

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (error) {
    console.error("[email] could not list admin profiles", error);
    return [];
  }

  const addresses = await Promise.all(
    (profiles ?? []).map((p) => emailForUser(admin, p.id))
  );
  return [...new Set(addresses.filter((a): a is string => Boolean(a)))];
}

/** Reserve, send, record. The only path that actually talks to the provider. */
async function deliver<K extends EmailTemplate>(
  admin: Admin,
  to: string,
  template: K,
  data: TemplatePayloads[K],
  options: NotifyOptions
): Promise<void> {
  const claim = await claimSend(admin, {
    template,
    recipient: to,
    dedupeKey: options.dedupeKey,
    bookingId: options.bookingId,
    quoteRequestId: options.quoteRequestId,
  });
  if (!claim.proceed) return;

  const result = await sendEmail({ to, template, data });
  await recordResult(admin, claim.logId, result);
}

/** Send a customer-facing template to the customer who owns a job. */
export async function notifyCustomer<K extends CustomerTemplate>(
  admin: Admin,
  customerId: string,
  template: K,
  data: TemplatePayloads[K],
  options: NotifyOptions = {}
): Promise<void> {
  await runAfterResponse(async () => {
    const to = await emailForUser(admin, customerId);
    if (!to) {
      // Worth logging: a customer with no address silently receives nothing.
      console.warn(`[email] no address for customer ${customerId}; "${template}" not sent`);
      return;
    }
    await deliver(admin, to, template, data, options);
  });
}

/** Alert the tradie. Fans out to every admin address we can resolve. */
export async function notifyAdmin<K extends AdminTemplate>(
  admin: Admin,
  template: K,
  data: TemplatePayloads[K],
  options: NotifyOptions = {}
): Promise<void> {
  await runAfterResponse(async () => {
    const recipients = await adminRecipients(admin);
    if (!recipients.length) {
      console.warn(`[email] no admin recipients; "${template}" not sent`);
      return;
    }
    await Promise.all(
      recipients.map((to) =>
        deliver(admin, to, template, data, {
          ...options,
          // One key per recipient, or the first address would consume the
          // reservation and the rest would be dropped as duplicates.
          dedupeKey: options.dedupeKey ? `${options.dedupeKey}:${to}` : null,
        })
      )
    );
  });
}
