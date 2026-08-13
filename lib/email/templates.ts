import {
  dateTime,
  money,
  moneyRange,
  slotWindow,
  type Block,
  type Cta,
} from "@/lib/email/render";
import { contactSentence } from "@/lib/email/config";
import { BRAND } from "@/lib/brand";

/**
 * Every transactional email, as data.
 *
 * Each template declares the payload it needs, so passing data nothing renders
 * — or forgetting data something does — is a type error rather than a silently
 * wrong email. That's not hypothetical: `quote_rejected` used to be handed a
 * `reason` it never printed, while the admin dialog promised "the customer
 * will be notified with this reason".
 *
 * Copy lives here and nowhere else. Templates never emit markup; see
 * `render.ts` for why.
 */

export type TemplatePayloads = {
  // --- customer ------------------------------------------------------------
  /** Ack for a just-submitted request. Estimates are null for custom jobs. */
  quote_received: {
    service: string;
    estimateLowCents?: number | null;
    estimateHighCents?: number | null;
    slotStart?: string | null;
    slotEnd?: string | null;
  };
  quote_ready: { service: string; amountCents: number };
  quote_adjusted: { service: string; amountCents: number };
  quote_rejected: { service: string; reason?: string | null };
  booking_confirmed: {
    service: string;
    slotStart?: string | null;
    slotEnd?: string | null;
    address?: string | null;
  };
  booking_cancelled: { service: string; slotStart?: string | null };
  reschedule_requested: { service: string; slotStart?: string | null };
  reschedule_confirmed: {
    service: string;
    slotStart?: string | null;
    slotEnd?: string | null;
  };
  payment_due: { service: string; amountCents?: number | null };
  receipt_ready: { service: string; amountCents?: number | null };

  // --- admin ---------------------------------------------------------------
  admin_new_quote: {
    service: string;
    customerName?: string | null;
    suburb?: string | null;
    slotStart?: string | null;
    slotEnd?: string | null;
    estimateLowCents?: number | null;
    estimateHighCents?: number | null;
  };
  admin_quote_accepted: {
    service: string;
    customerName?: string | null;
    amountCents?: number | null;
    slotStart?: string | null;
    slotEnd?: string | null;
  };
  admin_quote_declined: {
    service: string;
    customerName?: string | null;
    amountCents?: number | null;
  };
  admin_reschedule_requested: {
    service: string;
    customerName?: string | null;
    slotStart?: string | null;
    note?: string | null;
  };
};

export type EmailTemplate = keyof TemplatePayloads;

export type Audience = "customer" | "admin";

type Definition<K extends EmailTemplate> = {
  audience: Audience;
  cta: Cta;
  subject: (d: TemplatePayloads[K]) => string;
  /** Inbox preview line. Should add information, not repeat the subject. */
  preheader: (d: TemplatePayloads[K]) => string;
  blocks: (d: TemplatePayloads[K]) => Block[];
};

const PORTAL: Cta = { label: "Open your portal", path: "/portal" };
const REVIEW_QUOTES: Cta = { label: "Review in dashboard", path: "/admin/quotes" };
const OPEN_BOOKINGS: Cta = { label: "Open bookings", path: "/admin/bookings" };
const OPEN_CALENDAR: Cta = { label: "Open calendar", path: "/admin/calendar" };

/** "Jo" where known, else a neutral stand-in — never an empty greeting. */
const who = (name?: string | null) => name?.trim() || "A customer";

export const TEMPLATES: { [K in EmailTemplate]: Definition<K> } = {
  quote_received: {
    audience: "customer",
    cta: PORTAL,
    subject: (d) => `We've got your ${d.service} request`,
    preheader: (d) =>
      moneyRange(d.estimateLowCents, d.estimateHighCents)
        ? "Here's your estimate and the window you picked."
        : "We'll price this one by hand and come back to you.",
    blocks: (d) => {
      const range = moneyRange(d.estimateLowCents, d.estimateHighCents);
      return [
        { kind: "heading", text: "Thanks — we've got your request" },
        {
          kind: "para",
          text: `We've received your ${d.service} request and we're reviewing it now. You'll get a fixed price from us shortly.`,
        },
        {
          kind: "facts",
          rows: [
            { label: "Job", value: d.service },
            { label: "Estimate", value: range },
            { label: "Preferred window", value: slotWindow(d.slotStart, d.slotEnd) },
          ],
        },
        range
          ? {
              kind: "note",
              text: "That estimate is indicative — the fixed price we send next is the one that counts.",
            }
          : {
              kind: "note",
              text: "This one needs a custom quote, so we'll price it by hand rather than give you an instant figure.",
            },
      ];
    },
  },

  quote_ready: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `Your ${BRAND.name} quote is ready`,
    preheader: (d) => `${money(d.amountCents) ?? "Your price"} for your ${d.service}.`,
    blocks: (d) => [
      { kind: "heading", text: "Your quote is ready" },
      { kind: "para", text: `We've reviewed your ${d.service} and set a fixed price.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Fixed price", value: money(d.amountCents) },
        ],
      },
      { kind: "para", text: "Accept it in your portal and we'll lock in your arrival window." },
    ],
  },

  quote_adjusted: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `Your ${BRAND.name} quote has been updated`,
    preheader: (d) => `Now ${money(d.amountCents) ?? "updated"}, with a full breakdown.`,
    blocks: (d) => [
      { kind: "heading", text: "Your quote has been updated" },
      { kind: "para", text: `We've adjusted the quote for your ${d.service}.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Updated price", value: money(d.amountCents) },
        ],
      },
      {
        kind: "para",
        text: "The itemised breakdown is in your portal, so you can see exactly what changed.",
      },
    ],
  },

  quote_rejected: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `An update on your ${BRAND.name} quote`,
    preheader: () => "We're not able to take this one on.",
    blocks: (d) => [
      { kind: "heading", text: "An update on your quote" },
      {
        kind: "para",
        text: `Unfortunately we're not able to take on your ${d.service} request.`,
      },
      ...(d.reason?.trim()
        ? ([{ kind: "note", text: `Reason: ${d.reason.trim()}` }] as Block[])
        : []),
      { kind: "para", text: `If you'd like to talk through the options, ${contactSentence()}` },
    ],
  },

  booking_confirmed: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `You're booked in with ${BRAND.name}`,
    preheader: (d) =>
      slotWindow(d.slotStart, d.slotEnd) ?? `Your ${d.service} is confirmed.`,
    blocks: (d) => [
      { kind: "heading", text: "You're booked in" },
      { kind: "para", text: `Your ${d.service} is confirmed. Here are the details:` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Arrival window", value: slotWindow(d.slotStart, d.slotEnd) },
          { label: "Address", value: d.address ?? null },
        ],
      },
      {
        kind: "para",
        text: "Please have any materials you're supplying ready to install. Otherwise, make sure someone's home who can show our installer what's needed.",
      },
    ],
  },

  booking_cancelled: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `Your ${BRAND.name} booking has been cancelled`,
    preheader: (d) =>
      dateTime(d.slotStart)
        ? `The ${dateTime(d.slotStart)} visit is no longer going ahead.`
        : "This visit is no longer going ahead.",
    // TODO(stripe): "you won't be charged" holds only while deposits are
    // stubbed. Once real deposits are taken this must become a refund
    // statement, or it's a false assurance about someone's money.
    // See docs/stripe-plan.md.
    blocks: (d) => [
      { kind: "heading", text: "Your booking has been cancelled" },
      { kind: "para", text: `We've cancelled your ${d.service}.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Was booked for", value: slotWindow(d.slotStart) },
        ],
      },
      {
        kind: "para",
        text: "You don't need to do anything, and you won't be charged.",
      },
      { kind: "para", text: `If this is a surprise, or you'd like to rebook, ${contactSentence()}` },
    ],
  },

  reschedule_requested: {
    audience: "customer",
    cta: PORTAL,
    subject: () => "We've got your reschedule request",
    preheader: () => "We'll be in touch with a new time shortly.",
    blocks: (d) => [
      { kind: "heading", text: "Reschedule request received" },
      {
        kind: "para",
        text: `Thanks — we've noted that you'd like a different time for your ${d.service}.`,
      },
      {
        kind: "facts",
        rows: [{ label: "Current window", value: slotWindow(d.slotStart) }],
      },
      {
        kind: "para",
        text: "We'll be in touch shortly to confirm a new slot. Your current window stays held until we do, so you won't lose it.",
      },
    ],
  },

  reschedule_confirmed: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `Your ${BRAND.name} visit has been rescheduled`,
    preheader: (d) => slotWindow(d.slotStart, d.slotEnd) ?? "Your new time is confirmed.",
    blocks: (d) => [
      { kind: "heading", text: "Your visit has been rescheduled" },
      { kind: "para", text: `Your ${d.service} has a new arrival window.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "New arrival window", value: slotWindow(d.slotStart, d.slotEnd) },
        ],
      },
      { kind: "para", text: "See you then." },
    ],
  },

  payment_due: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `Your ${BRAND.name} invoice`,
    preheader: (d) =>
      money(d.amountCents) ? `${money(d.amountCents)} due for your ${d.service}.` : "Your invoice is ready.",
    blocks: (d) => [
      { kind: "heading", text: "Your invoice is ready" },
      {
        kind: "para",
        text: `Thanks for choosing us for your ${d.service}. Your invoice is now in your portal.`,
      },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Total due", value: money(d.amountCents) },
        ],
      },
      {
        kind: "para",
        text: "Payment can be made to the installer on site or by bank transfer. Any extra work agreed on the day is already included in the total above.",
      },
    ],
  },

  receipt_ready: {
    audience: "customer",
    cta: PORTAL,
    subject: () => `Your ${BRAND.name} receipt`,
    preheader: (d) =>
      money(d.amountCents) ? `${money(d.amountCents)} received — thank you.` : "Payment received — thank you.",
    blocks: (d) => [
      { kind: "heading", text: "Payment received — thank you" },
      { kind: "para", text: `We've recorded payment for your ${d.service}.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Amount paid", value: money(d.amountCents) },
        ],
      },
      { kind: "para", text: "Your receipt is available to download from your portal any time." },
    ],
  },

  // --- admin ---------------------------------------------------------------

  admin_new_quote: {
    audience: "admin",
    cta: REVIEW_QUOTES,
    subject: (d) =>
      `New quote request — ${d.service}${d.suburb ? `, ${d.suburb}` : ""}`,
    preheader: (d) => `${who(d.customerName)} wants ${d.service}.`,
    blocks: (d) => [
      { kind: "heading", text: "New quote request" },
      { kind: "para", text: `${who(d.customerName)} has submitted a request.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Customer", value: d.customerName ?? null },
          { label: "Suburb", value: d.suburb ?? null },
          { label: "Requested window", value: slotWindow(d.slotStart, d.slotEnd) },
          {
            label: "Auto-estimate",
            value: moneyRange(d.estimateLowCents, d.estimateHighCents),
          },
        ],
      },
      {
        kind: "note",
        text: moneyRange(d.estimateLowCents, d.estimateHighCents)
          ? "Approve at the midpoint, or adjust with line items."
          : "No auto-estimate — this one needs pricing by hand with the line-item builder.",
      },
    ],
  },

  admin_quote_accepted: {
    audience: "admin",
    cta: OPEN_BOOKINGS,
    subject: (d) => `Quote accepted — ${d.service}`,
    preheader: (d) => `${who(d.customerName)} accepted. Confirm the booking to lock it in.`,
    blocks: (d) => [
      { kind: "heading", text: "Quote accepted" },
      { kind: "para", text: `${who(d.customerName)} has accepted their quote.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Customer", value: d.customerName ?? null },
          { label: "Agreed price", value: money(d.amountCents) },
          { label: "Requested window", value: slotWindow(d.slotStart, d.slotEnd) },
        ],
      },
      {
        kind: "note",
        text: "The job is sitting at Approved. Move it to Booked to confirm the window with the customer.",
      },
    ],
  },

  admin_quote_declined: {
    audience: "admin",
    cta: REVIEW_QUOTES,
    subject: (d) => `Quote declined — ${d.service}`,
    preheader: (d) => `${who(d.customerName)} declined. The slot is free again.`,
    blocks: (d) => [
      { kind: "heading", text: "Quote declined" },
      { kind: "para", text: `${who(d.customerName)} has declined their quote.` },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Customer", value: d.customerName ?? null },
          { label: "Quoted price", value: money(d.amountCents) },
        ],
      },
      { kind: "note", text: "The booking is cancelled and the arrival window is back in the pool." },
    ],
  },

  admin_reschedule_requested: {
    audience: "admin",
    cta: OPEN_CALENDAR,
    subject: (d) => `Reschedule requested — ${d.service}`,
    preheader: (d) => `${who(d.customerName)} wants a different time.`,
    blocks: (d) => [
      { kind: "heading", text: "Reschedule requested" },
      {
        kind: "para",
        text: `${who(d.customerName)} would like a different arrival window.`,
      },
      {
        kind: "facts",
        rows: [
          { label: "Job", value: d.service },
          { label: "Customer", value: d.customerName ?? null },
          { label: "Current window", value: slotWindow(d.slotStart) },
        ],
      },
      ...(d.note?.trim()
        ? ([{ kind: "note", text: `Their note: ${d.note.trim()}` }] as Block[])
        : []),
      { kind: "note", text: "Pick a new window in the calendar — that confirms it with them." },
    ],
  },
};

export const isAdminTemplate = (template: EmailTemplate): boolean =>
  TEMPLATES[template].audience === "admin";
