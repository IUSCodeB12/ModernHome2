import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail } from "@/lib/email/send";
import type { EmailTemplate, TemplatePayloads } from "@/lib/email/templates";

type Admin = SupabaseClient<Database>;

/**
 * Recipient resolution: turns "tell the customer" or "tell the tradie" into
 * actual addresses, then hands off to `sendEmail`.
 *
 * **Nothing here throws.** These are called from server actions after the
 * database write has already succeeded; letting a mail failure bubble would
 * roll back — or appear to roll back — a booking that genuinely happened.
 * Failures are logged loudly and reported in the return value instead.
 */

/**
 * Admin-facing templates are identified by their `admin_` prefix, which makes
 * the naming convention load-bearing: `notifyCustomer` cannot be handed an
 * internal alert, and `notifyAdmin` cannot be handed customer copy.
 */
export type AdminTemplate = Extract<EmailTemplate, `admin_${string}`>;
export type CustomerTemplate = Exclude<EmailTemplate, AdminTemplate>;

export type NotifyResult = { sent: number; failed: number };

const NOTHING: NotifyResult = { sent: 0, failed: 0 };

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

/** Send a customer-facing template to the customer who owns a job. */
export async function notifyCustomer<K extends CustomerTemplate>(
  admin: Admin,
  customerId: string,
  template: K,
  data: TemplatePayloads[K]
): Promise<NotifyResult> {
  try {
    const to = await emailForUser(admin, customerId);
    if (!to) {
      // Worth logging: a customer with no address silently receives nothing,
      // and the admin's UI would otherwise report success.
      console.warn(`[email] no address for customer ${customerId}; "${template}" not sent`);
      return NOTHING;
    }
    const result = await sendEmail({ to, template, data });
    return result.ok ? { sent: 1, failed: 0 } : { sent: 0, failed: 1 };
  } catch (err) {
    console.error(`[email] notifyCustomer("${template}") threw`, err);
    return { sent: 0, failed: 1 };
  }
}

/** Alert the tradie. Fans out to every admin address we can resolve. */
export async function notifyAdmin<K extends AdminTemplate>(
  admin: Admin,
  template: K,
  data: TemplatePayloads[K]
): Promise<NotifyResult> {
  try {
    const recipients = await adminRecipients(admin);
    if (!recipients.length) {
      console.warn(`[email] no admin recipients; "${template}" not sent`);
      return NOTHING;
    }
    const results = await Promise.all(
      recipients.map((to) => sendEmail({ to, template, data }))
    );
    return {
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    };
  } catch (err) {
    console.error(`[email] notifyAdmin("${template}") threw`, err);
    return { sent: 0, failed: 1 };
  }
}
