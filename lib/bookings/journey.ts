import type { BookingStatus } from "@/lib/bookings/status";

/**
 * The customer-facing journey.
 *
 * The admin pipeline has eight statuses; a homeowner only needs to know which
 * of five stages their job sits in. The bookkeeping states fold into the stage
 * they belong to rather than taking a step of their own — `approved` and
 * `in_progress` are both "Booked", `invoiced` is the unpaid half of "Paid".
 *
 * Pure and data-free: callers pass pre-formatted dates and money so this stays
 * testable and free of timezone/locale concerns.
 */
export const JOURNEY_STEPS = [
  "Requested",
  "Quoted",
  "Booked",
  "Done",
  "Paid",
] as const;

export type JourneyStep = (typeof JOURNEY_STEPS)[number];

/** How much attention the stage wants from the customer. */
export type JourneyTone = "waiting" | "action" | "live" | "done" | "closed";

export type Journey = {
  /** Index into JOURNEY_STEPS of the stage the job currently sits in. */
  current: number;
  /** Short label for the status pill. */
  label: string;
  tone: JourneyTone;
  /** Every step is behind us — nothing left to do. */
  complete: boolean;
  cancelled: boolean;
};

const JOURNEY: Record<BookingStatus, Journey> = {
  enquiry: {
    current: 0,
    label: "Preparing your quote",
    tone: "waiting",
    complete: false,
    cancelled: false,
  },
  quoted: {
    current: 1,
    label: "Needs your approval",
    tone: "action",
    complete: false,
    cancelled: false,
  },
  approved: {
    current: 2,
    label: "Confirming your slot",
    tone: "waiting",
    complete: false,
    cancelled: false,
  },
  booked: {
    current: 2,
    label: "Booked",
    tone: "waiting",
    complete: false,
    cancelled: false,
  },
  in_progress: {
    current: 2,
    label: "In progress",
    tone: "live",
    complete: false,
    cancelled: false,
  },
  completed: {
    current: 3,
    label: "Job complete",
    tone: "done",
    complete: false,
    cancelled: false,
  },
  invoiced: {
    current: 4,
    label: "Payment due",
    tone: "action",
    complete: false,
    cancelled: false,
  },
  paid: {
    current: 4,
    label: "Paid",
    tone: "done",
    complete: true,
    cancelled: false,
  },
  cancelled: {
    current: 0,
    label: "Cancelled",
    tone: "closed",
    complete: false,
    cancelled: true,
  },
};

export function journeyFor(status: BookingStatus): Journey {
  return JOURNEY[status];
}

/**
 * The status to drive the customer view from.
 *
 * A quote with no booking row never got past the enquiry; a dead quote reads as
 * cancelled so the rail doesn't imply the job is still moving. Both pages go
 * through this so they can't drift apart.
 */
export function resolveStatus(
  bookingStatus: BookingStatus | null | undefined,
  quoteStatus: string | null | undefined
): BookingStatus {
  if (bookingStatus) return bookingStatus;
  return quoteStatus === "rejected" || quoteStatus === "expired"
    ? "cancelled"
    : "enquiry";
}

export type StepState = "done" | "active" | "upcoming";

export function stepState(journey: Journey, index: number): StepState {
  if (journey.cancelled) return "upcoming";
  if (journey.complete) return "done";
  if (index < journey.current) return "done";
  return index === journey.current ? "active" : "upcoming";
}

export type HeadlineInput = {
  status: BookingStatus;
  /** Pre-formatted arrival window, e.g. "Thu 14 Aug, 8:00am – 10:00am". */
  arrival?: string | null;
  /** Pre-formatted relative day, e.g. "in 2 days" / "today". */
  relative?: string | null;
  /** Pre-formatted money, e.g. "$836.00". */
  amount?: string | null;
  installer?: string | null;
};

export type Headline = {
  title: string;
  body: string;
  /** The title already states the money — don't repeat it alongside. */
  showsAmount: boolean;
};

/**
 * Sort key for a list of jobs: lower comes first. Whatever needs the customer
 * to do something outranks whatever is merely in flight.
 */
export function attentionRank(journey: Journey): number {
  switch (journey.tone) {
    case "action":
      return 0;
    case "live":
      return 1;
    case "waiting":
      return 2;
    case "done":
      return 3;
    case "closed":
      return 4;
  }
}

/**
 * The one sentence the page leads with. Every state gets its own — this is the
 * answer to "when are you coming / what do I owe", which is the only reason a
 * customer opens this page.
 */
export function journeyHeadline({
  status,
  arrival,
  relative,
  amount,
  installer,
}: HeadlineInput): Headline {
  switch (status) {
    case "enquiry":
      return {
        title: "We're putting your quote together",
        body: "We price every job by hand, so it's usually with you within one business day.",
        showsAmount: false,
      };

    case "quoted":
      return {
        title: amount ? `Your quote is ready — ${amount}` : "Your quote is ready",
        body: "Have a look at what's included, then let us know if you're happy to go ahead.",
        showsAmount: !!amount,
      };

    case "approved":
      return {
        title: "You're locked in",
        body: "We're confirming your arrival window now — you'll get an email as soon as it's set.",
        showsAmount: false,
      };

    case "booked": {
      const parts = [relative, installer ? `${installer} is on the job` : null].filter(
        Boolean
      );
      return {
        title: arrival ? `We arrive ${arrival}` : "You're booked in",
        body: parts.length
          ? parts.join(" · ")
          : "We'll be in touch the day before to confirm.",
        showsAmount: false,
      };
    }

    case "in_progress":
      return {
        title: "We're on site now",
        body: installer
          ? `${installer} is working on your job — we'll let you know the moment it's done.`
          : "We'll let you know the moment the job's done.",
        showsAmount: false,
      };

    case "completed":
      return {
        title: "Job's done",
        body: "Thanks for having us. Your invoice will land here shortly.",
        showsAmount: false,
      };

    case "invoiced":
      return {
        title: amount ? `Payment due — ${amount}` : "Payment due",
        body: "Pay the installer on site by card or cash, or by bank transfer. Any extra work agreed on the day is already in this total.",
        showsAmount: !!amount,
      };

    case "paid":
      return {
        title: "All paid — thank you",
        body: "Your receipt is here whenever you need it.",
        showsAmount: false,
      };

    case "cancelled":
      return {
        title: "This booking was cancelled",
        body: "Get in touch if that wasn't meant to happen, or start a new quote any time.",
        showsAmount: false,
      };
  }
}
