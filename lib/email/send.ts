import { formatInTimeZone } from "date-fns-tz";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";

/**
 * Transactional email via Resend.
 *
 * Sends real branded HTML when RESEND_API_KEY is set; otherwise logs the
 * payload (local dev / before the domain is verified). To go live: set
 * RESEND_API_KEY + EMAIL_FROM (a verified-domain sender) in the environment.
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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modern-home2.vercel.app";
const FROM = process.env.EMAIL_FROM ?? "ModernHome <onboarding@resend.dev>";

const aud = (cents: unknown) =>
  typeof cents === "number"
    ? `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "";

const slot = (iso: unknown) =>
  typeof iso === "string"
    ? formatInTimeZone(new Date(iso), BUSINESS_TIME_ZONE, "EEEE d MMM, h:mmaaa")
    : "";

/** Returns the inner HTML body (heading + paragraphs) for a template. */
function body(template: EmailTemplate, d: Record<string, unknown>): string {
  const service = String(d.service ?? "your job");
  switch (template) {
    case "quote_ready":
      return `<h1>Your quote is ready</h1><p>We've reviewed your ${service} — the price is <strong>${aud(d.amountCents)}</strong>.</p><p>Review and accept it in your portal.</p>`;
    case "quote_adjusted":
      return `<h1>Your quote has been updated</h1><p>We've adjusted the quote for your ${service} to <strong>${aud(d.amountCents)}</strong>, with an itemised breakdown you can see in your portal.</p>`;
    case "quote_rejected":
      return `<h1>An update on your quote</h1><p>Unfortunately we're unable to proceed with your ${service} request. Reply to this email if you'd like to discuss options.</p>`;
    case "booking_confirmed":
      return `<h1>You're booked in</h1><p>Your ${service} is confirmed for <strong>${slot(d.slotStart)}</strong>.</p><p>Please make sure any materials you're supplying are ready to install. Otherwise, have someone at home who can guide our installer on what needs doing.</p>`;
    case "reschedule_confirmed":
      return `<h1>Your visit has been rescheduled</h1><p>Your ${service} is now booked for <strong>${slot(d.slotStart)}</strong>. See you then!</p>`;
    case "reschedule_requested":
      return `<h1>Reschedule request received</h1><p>Thanks — we've noted that you'd like a different time for your ${service}. We'll be in touch shortly to confirm a new slot.</p>`;
    case "payment_due":
      return `<h1>Your job is complete</h1><p>Thanks for choosing us for your ${service}. Payment can be made to the installer on site or by bank transfer — any extra work agreed on the day is included in your final total, viewable in your portal.</p>`;
    case "receipt_ready":
      return `<h1>Payment received — thank you</h1><p>We've recorded payment for your ${service}. You can download your receipt any time from your portal.</p>`;
  }
}

function renderHtml(template: EmailTemplate, data: Record<string, unknown>): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
    <div style="max-width:520px;margin:0 auto;padding:32px 24px">
      <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em">ModernHome</div>
      <div style="background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:24px;margin-top:16px;line-height:1.5;font-size:15px">
        ${body(template, data)}
        <p style="margin-top:24px"><a href="${SITE_URL}/portal" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Open your portal</a></p>
      </div>
      <p style="color:#a8a29e;font-size:12px;margin-top:16px">ModernHome · Servicing Greater Melbourne</p>
    </div>
  </body></html>`;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[email:stub] would send "${input.template}" to ${input.to} — subject: ${input.subject}`,
      input.data
    );
    return { ok: true, skipped: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: renderHtml(input.template, input.data),
    });
    if (error) {
      console.error(`[email] send failed (${input.template} → ${input.to})`, error);
      return { ok: false };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[email] Resend threw", err);
    return { ok: false };
  }
}
