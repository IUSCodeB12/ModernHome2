import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail, type EmailTemplate } from "@/lib/email/send";
import { BRAND } from "@/lib/brand";

type Admin = SupabaseClient<Database>;

/** Default subject line per transactional template. */
const SUBJECTS: Record<EmailTemplate, string> = {
  quote_ready: `Your ${BRAND.name} quote is ready`,
  quote_adjusted: `Your ${BRAND.name} quote has been updated`,
  quote_rejected: `An update on your ${BRAND.name} quote`,
  booking_confirmed: `You're booked in with ${BRAND.name}`,
  payment_due: `Payment for your ${BRAND.name} job`,
  receipt_ready: `Your ${BRAND.name} receipt`,
  reschedule_requested: "Reschedule request received",
  reschedule_confirmed: `Your ${BRAND.name} visit has been rescheduled`,
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
