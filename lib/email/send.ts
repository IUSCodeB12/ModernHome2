/**
 * Transactional email. Currently a stub that logs the payload.
 *
 * TODO(resend): Phase 4 — wire up Resend. Instantiate
 * `new Resend(process.env.RESEND_API_KEY)` and render templates with
 * @react-email/components, e.g.:
 *
 *   await resend.emails.send({
 *     from: "ModernHome <bookings@modernhome.com.au>",
 *     to, subject, react: <QuoteReadyEmail ... />,
 *   });
 */

export type EmailTemplate =
  | "quote_ready"
  | "quote_adjusted"
  | "quote_rejected"
  | "booking_confirmed"
  | "payment_due"
  | "receipt_ready"
  | "reschedule_requested"
  | "reschedule_confirmed";

export type SendEmailInput = {
  to: string;
  template: EmailTemplate;
  subject: string;
  data: Record<string, unknown>;
};

export type SendEmailResult = { ok: boolean; id?: string; skipped?: boolean };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  // TODO(resend): replace this stub with a real Resend call.
  if (!process.env.RESEND_API_KEY) {
    console.info(
      `[email:stub] would send "${input.template}" to ${input.to} — subject: ${input.subject}`,
      input.data
    );
    return { ok: true, skipped: true };
  }

  // Even with a key present, sending is deferred to Phase 4.
  console.info(
    `[email:stub] RESEND_API_KEY set but sending not yet implemented (Phase 4) — "${input.template}" to ${input.to}`
  );
  return { ok: true, skipped: true };
}
