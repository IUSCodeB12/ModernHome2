import { FROM, REPLY_TO, signature } from "@/lib/email/config";
import { renderHtml, renderText } from "@/lib/email/render";
import {
  TEMPLATES,
  type EmailTemplate,
  type TemplatePayloads,
} from "@/lib/email/templates";

/**
 * Transactional email transport (Resend).
 *
 * Sends real branded mail when `RESEND_API_KEY` is set; otherwise logs the
 * payload and reports `skipped` — that's how local dev and preview deploys
 * avoid emailing real customers. To go live, see `docs/domain-email-setup.md`.
 *
 * This module knows nothing about *what* an email says (see `templates.ts`) or
 * *who* receives it (see `notify.ts`).
 */

export type { EmailTemplate, TemplatePayloads };

export type SendEmailResult =
  | { ok: true; id?: string; skipped?: boolean }
  | { ok: false; error: string };

/**
 * Render a template to its subject + both MIME parts.
 *
 * Exported so tests can assert on output without touching the network, and so
 * a future preview route can show the tradie exactly what a customer receives.
 */
export function buildEmail<K extends EmailTemplate>(
  template: K,
  data: TemplatePayloads[K]
): { subject: string; html: string; text: string } {
  const def = TEMPLATES[template];
  const blocks = def.blocks(data);
  // Customer mail signs off from a named team with a phone number; admin
  // alerts go to the tradie's own inbox, where signing off to himself would
  // just be noise.
  const sig = def.audience === "customer" ? signature() : undefined;
  return {
    subject: def.subject(data),
    html: renderHtml(blocks, {
      preheader: def.preheader(data),
      cta: def.cta,
      signature: sig,
    }),
    text: renderText(blocks, { cta: def.cta, signature: sig }),
  };
}

export async function sendEmail<K extends EmailTemplate>(input: {
  to: string;
  template: K;
  data: TemplatePayloads[K];
}): Promise<SendEmailResult> {
  const { to, template, data } = input;

  let email: ReturnType<typeof buildEmail>;
  try {
    email = buildEmail(template, data);
  } catch (err) {
    // A template that throws would otherwise fail silently inside the send
    // path and look like a delivery problem. Name it as a rendering problem.
    console.error(`[email] failed to render "${template}"`, err);
    return { ok: false, error: "render_failed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[email:stub] would send "${template}" to ${to} — subject: ${email.subject}`,
      data
    );
    return { ok: true, skipped: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: email.subject,
      html: email.html,
      // A plain-text part is not optional in practice: HTML-only mail is a
      // spam signal, and this domain publishes DMARC p=quarantine.
      text: email.text,
      // Omitted entirely when no mailbox exists — a Reply-To that bounces is
      // worse than none. See `config.ts`.
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    });
    if (error) {
      console.error(`[email] send failed (${template} → ${to})`, error);
      return { ok: false, error: error.message ?? "send_failed" };
    }
    return { ok: true, id: sent?.id };
  } catch (err) {
    console.error("[email] Resend threw", err);
    return { ok: false, error: "transport_threw" };
  }
}
