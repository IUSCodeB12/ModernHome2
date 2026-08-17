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
  /**
   * The weekday the visit falls on, e.g. "Thursday" — not the full window.
   * The ticket beneath the headline prints the date, the times and a live
   * countdown; a title repeating all three verbatim was the page saying the
   * same sentence twice in two typefaces.
   */
  arrivalDay?: string | null;
  installer?: string | null;
};

export type Headline = {
  title: string;
  body: string;
};

/**
 * Which list a job belongs in on the bookings index.
 *
 * A customer with one job doesn't need this. A customer with eleven — five of
 * them sitting in the same status, several sharing a service name — gets an
 * undifferentiated wall of rows, and the only way to find the one they came
 * for is to read every line. Three buckets answer the three questions people
 * actually arrive with: what needs me, when are you coming, what's still being
 * sorted out.
 */
export const JOB_GROUPS = ["action", "scheduled", "pending", "past"] as const;

export type JobGroup = (typeof JOB_GROUPS)[number];

export const JOB_GROUP_LABELS: Record<JobGroup, string> = {
  action: "Waiting on you",
  scheduled: "Booked in",
  pending: "In the works",
  past: "Earlier",
};

/**
 * `scheduled` means a visit date exists — the caller owns that, since it comes
 * from the booking row rather than from the status.
 */
export function jobGroup(journey: Journey, scheduled: boolean): JobGroup {
  if (journey.complete || journey.cancelled) return "past";
  if (journey.tone === "action") return "action";
  return scheduled ? "scheduled" : "pending";
}

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
 *
 * Deliberately free of money and of exact times. Both are rendered as their own
 * objects on every surface that has them, so a title carrying them too printed
 * the same value twice, inches apart, at two different sizes. This says what is
 * happening; the objects below say precisely when and how much.
 */
export function journeyHeadline({
  status,
  arrivalDay,
  installer,
}: HeadlineInput): Headline {
  switch (status) {
    case "enquiry":
      return {
        title: "We're putting your quote together",
        body: "We price every job by hand, so it's usually with you within one business day.",
      };

    case "quoted":
      return {
        title: "Your quote is ready",
        body: "Have a look at what's included, then let us know if you're happy to go ahead.",
      };

    case "approved":
      return {
        title: "You're locked in",
        // The ticket below is showing the requested window at this stage, so
        // "we're confirming your arrival window" read as though the ticket
        // were describing something else.
        body: arrivalDay
          ? "We're just confirming this window — you'll get an email the moment it's locked."
          : "We're confirming your arrival window now — you'll get an email as soon as it's set.",
      };

    case "booked":
      return {
        title: arrivalDay ? `We're coming ${arrivalDay}` : "You're booked in",
        body: installer
          ? `${installer} is on the job. We'll be in touch the day before to confirm.`
          : "We'll be in touch the day before to confirm.",
      };

    case "in_progress":
      return {
        title: "We're on site now",
        body: installer
          ? `${installer} is working on your job — we'll let you know the moment it's done.`
          : "We'll let you know the moment the job's done.",
      };

    case "completed":
      return {
        title: "Job's done",
        body: "Thanks for having us. Your invoice will land here shortly.",
      };

    case "invoiced":
      return {
        title: "Payment due",
        // "Balance" rather than "total": the figure beside this headline is what's
        // left after any deposit, so calling it the total contradicted the number.
        body: "Pay the installer on site by card or cash, or by bank transfer. This is your balance after any deposit, and it includes extra work agreed on the day.",
      };

    case "paid":
      return {
        title: "All paid — thank you",
        body: "Your receipt is here whenever you need it.",
      };

    case "cancelled":
      return {
        title: "This booking was cancelled",
        body: "Get in touch if that wasn't meant to happen, or start a new quote any time.",
      };
  }
}
