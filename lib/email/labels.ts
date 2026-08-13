import type { EmailTemplate } from "@/lib/email/templates";

/**
 * Tradie-facing names for the templates, for the admin delivery panel.
 *
 * Separate from `templates.ts` so this can be imported by a client component
 * without dragging the renderer, date-fns-tz and the whole copy registry into
 * the browser bundle. The import above is type-only, so it erases at build.
 *
 * Named from the sender's point of view — "Quote sent", not "quote_ready" —
 * because the question being answered is "what have we told this customer?"
 */
export const TEMPLATE_LABELS: Record<EmailTemplate, string> = {
  quote_received: "Request received",
  quote_ready: "Quote sent",
  quote_adjusted: "Updated quote sent",
  quote_rejected: "Rejection sent",
  booking_confirmed: "Booking confirmed",
  booking_cancelled: "Cancellation sent",
  reschedule_requested: "Reschedule acknowledged",
  reschedule_confirmed: "New time confirmed",
  payment_due: "Invoice sent",
  receipt_ready: "Receipt sent",
  admin_new_quote: "Alert: new request",
  admin_quote_accepted: "Alert: quote accepted",
  admin_quote_declined: "Alert: quote declined",
  admin_reschedule_requested: "Alert: reschedule requested",
};

/**
 * `email_log.template` is a text column, not an enum — deliberately, so that
 * renaming or retiring a template can't orphan its history. That means rows
 * can hold names this map doesn't know, so fall back to something readable
 * rather than rendering a blank cell.
 */
export function labelForTemplate(template: string): string {
  const known = TEMPLATE_LABELS[template as EmailTemplate];
  if (known) return known;
  const words = template.replace(/^admin_/, "").replace(/_/g, " ");
  const readable = words.charAt(0).toUpperCase() + words.slice(1);
  return template.startsWith("admin_") ? `Alert: ${words}` : readable;
}
