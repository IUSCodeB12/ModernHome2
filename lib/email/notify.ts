import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail, type EmailTemplate } from "@/lib/email/send";

type Admin = SupabaseClient<Database>;

/** Default subject line per transactional template. */
const SUBJECTS: Record<EmailTemplate, string> = {
  quote_ready: "Your ModernHome quote is ready",
  quote_adjusted: "Your ModernHome quote has been updated",
  quote_rejected: "An update on your ModernHome quote",
  booking_confirmed: "You're booked in with ModernHome",
  payment_due: "Payment for your ModernHome job",
  receipt_ready: "Your ModernHome receipt",
};

/**
 * Look up a customer's email (service-role) and send them a transactional
 * template. Shared by quote and booking actions. sendEmail is a stub until
 * Resend is live — this wiring activates automatically once it is.
 */
export async function notifyCustomer(
  admin: Admin,
  customerId: string,
  template: EmailTemplate,
  data: Record<string, unknown> = {},
  subject = SUBJECTS[template]
) {
  const { data: authUser } = await admin.auth.admin.getUserById(customerId);
  const to = authUser?.user?.email;
  if (!to) return;
  await sendEmail({ to, template, subject, data });
}
