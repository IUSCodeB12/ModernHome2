import { BRAND } from "@/lib/brand";
import { BUSINESS } from "@/lib/business";

/**
 * Sender/reply addressing for transactional email.
 *
 * **Sending and receiving are separate problems.** `BRAND.email` is a Resend
 * *sender* — Resend signs mail as that address but does not host a mailbox for
 * it, so a customer replying to it gets a bounce until inbound routing exists
 * (`docs/domain-email-setup.md` §3).
 *
 * That's why `replyTo` is derived, not assumed. Templates ask
 * `canReceiveReplies()` before writing "just reply to this email" — a promise
 * we can't keep is worse than no promise, because the customer thinks they've
 * responded and then hears nothing.
 *
 * To turn replies on: set `EMAIL_REPLY_TO`, or fill in `BUSINESS.email` once
 * the mailbox is live. Both the header and the copy follow automatically.
 */

/** Verified-domain sender. `EMAIL_FROM` overrides at runtime. */
export const FROM = process.env.EMAIL_FROM ?? `${BRAND.name} <${BRAND.email}>`;

/**
 * A monitored address, or null while there's no inbox.
 *
 * `BUSINESS.email` is null until a real mailbox exists — see the
 * null-means-omit rule in `lib/business.ts`. We honour that here rather than
 * falling back to `BRAND.email`, which would point replies straight at the
 * un-routed sender.
 */
export const REPLY_TO: string | null =
  process.env.EMAIL_REPLY_TO?.trim() || BUSINESS.email || null;

/** True when a customer's reply will actually reach a human. */
export function canReceiveReplies(): boolean {
  return REPLY_TO !== null;
}

/**
 * Where to tell a customer to reach us, given what's actually wired up.
 * Falls back to the portal, which always works because it's this same app.
 */
export function contactSentence(): string {
  return canReceiveReplies()
    ? "just reply to this email — we'll sort it out."
    : "get in touch through your portal and we'll sort it out.";
}
