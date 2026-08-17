import { describe, expect, it } from "vitest";
import { BOOKING_STATUSES } from "@/lib/bookings/status";
import {
  JOURNEY_STEPS,
  attentionRank,
  journeyFor,
  journeyHeadline,
  jobGroup,
  JOB_GROUPS,
  JOB_GROUP_LABELS,
  resolveStatus,
  stepState,
} from "@/lib/bookings/journey";

describe("journeyFor", () => {
  it("maps every booking status to a stage", () => {
    for (const status of BOOKING_STATUSES) {
      const journey = journeyFor(status);
      expect(journey, status).toBeDefined();
      expect(journey.current).toBeGreaterThanOrEqual(0);
      expect(journey.current).toBeLessThan(JOURNEY_STEPS.length);
    }
  });

  it("folds the bookkeeping statuses into the stage they belong to", () => {
    // approved / in_progress are both "Booked" as far as the customer cares.
    expect(journeyFor("approved").current).toBe(journeyFor("booked").current);
    expect(journeyFor("in_progress").current).toBe(journeyFor("booked").current);
    // invoiced is the unpaid half of "Paid".
    expect(journeyFor("invoiced").current).toBe(journeyFor("paid").current);
  });

  it("only asks for action when the customer actually has to do something", () => {
    const action = BOOKING_STATUSES.filter((s) => journeyFor(s).tone === "action");
    expect(action).toEqual(["quoted", "invoiced"]);
  });

  it("never moves backwards as the pipeline advances", () => {
    const forward = BOOKING_STATUSES.filter((s) => s !== "cancelled");
    const stages = forward.map((s) => journeyFor(s).current);
    expect(stages).toEqual([...stages].sort((a, b) => a - b));
  });

  it("treats only paid as finished", () => {
    const complete = BOOKING_STATUSES.filter((s) => journeyFor(s).complete);
    expect(complete).toEqual(["paid"]);
  });
});

describe("attentionRank", () => {
  it("puts the jobs needing the customer ahead of the ones in flight", () => {
    const rank = (s: Parameters<typeof journeyFor>[0]) =>
      attentionRank(journeyFor(s));
    expect(rank("quoted")).toBeLessThan(rank("booked"));
    expect(rank("invoiced")).toBeLessThan(rank("in_progress"));
    expect(rank("in_progress")).toBeLessThan(rank("enquiry"));
    expect(rank("booked")).toBeLessThan(rank("paid"));
    expect(rank("paid")).toBeLessThan(rank("cancelled"));
  });
});

describe("resolveStatus", () => {
  it("prefers the booking status when there is one", () => {
    expect(resolveStatus("booked", "approved")).toBe("booked");
    expect(resolveStatus("paid", "pending")).toBe("paid");
  });

  it("treats a quote with no booking as an enquiry", () => {
    expect(resolveStatus(null, "pending")).toBe("enquiry");
    expect(resolveStatus(undefined, null)).toBe("enquiry");
  });

  it("reads a dead quote as cancelled rather than still moving", () => {
    expect(resolveStatus(null, "rejected")).toBe("cancelled");
    expect(resolveStatus(null, "expired")).toBe("cancelled");
  });
});

describe("stepState", () => {
  it("marks earlier steps done and later ones upcoming", () => {
    const booked = journeyFor("booked");
    expect(stepState(booked, 0)).toBe("done");
    expect(stepState(booked, 1)).toBe("done");
    expect(stepState(booked, 2)).toBe("active");
    expect(stepState(booked, 3)).toBe("upcoming");
  });

  it("marks every step done once paid", () => {
    const paid = journeyFor("paid");
    for (let i = 0; i < JOURNEY_STEPS.length; i++) {
      expect(stepState(paid, i)).toBe("done");
    }
  });

  it("leaves invoiced with the last step still active", () => {
    const invoiced = journeyFor("invoiced");
    expect(stepState(invoiced, 3)).toBe("done");
    expect(stepState(invoiced, 4)).toBe("active");
  });

  it("lights nothing up when cancelled", () => {
    const cancelled = journeyFor("cancelled");
    for (let i = 0; i < JOURNEY_STEPS.length; i++) {
      expect(stepState(cancelled, i)).toBe("upcoming");
    }
  });
});

describe("journeyHeadline", () => {
  it("names the day once booked, and leaves the clock to the ticket", () => {
    const { title, body } = journeyHeadline({
      status: "booked",
      arrivalDay: "Thursday",
      installer: "Tom",
    });
    expect(title).toBe("We're coming Thursday");
    expect(body).toContain("Tom");
  });

  it("falls back when the slot or installer is missing", () => {
    const { title, body } = journeyHeadline({ status: "booked" });
    expect(title).toBe("You're booked in");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("null");
  });

  // Guards the rule the whole portal layout rests on: the headline says what is
  // happening, and the objects under it — ticket, price, receipt — say the
  // numbers. A title that grows a "$" or a "8:00am" back is a duplicate on the
  // page, not just a longer sentence.
  it("never puts a figure or a clock time in the title", () => {
    for (const status of BOOKING_STATUSES) {
      const { title } = journeyHeadline({
        status,
        arrivalDay: "Thursday",
        installer: "Tom",
      });
      expect(title, status).not.toMatch(/[$\d]/);
    }
  });

  it("keeps money out of the title — the figure is its own object", () => {
    expect(journeyHeadline({ status: "quoted" }).title).toBe("Your quote is ready");
    expect(journeyHeadline({ status: "invoiced" }).title).toBe("Payment due");
  });

  it("does not promise a receipt that hasn't been raised", () => {
    // A job can reach 'paid' with no invoice row — the headline used to say the
    // receipt was "here whenever you need it" directly above a card saying it
    // wasn't.
    expect(journeyHeadline({ status: "paid", hasInvoice: false }).body).not.toContain(
      "here whenever you need it"
    );
    expect(journeyHeadline({ status: "paid", hasInvoice: true }).body).toContain(
      "here whenever you need it"
    );
  });

  it("gives every status a non-empty headline", () => {
    for (const status of BOOKING_STATUSES) {
      const { title, body } = journeyHeadline({ status });
      expect(title.length, status).toBeGreaterThan(0);
      expect(body.length, status).toBeGreaterThan(0);
    }
  });
});

describe("jobGroup", () => {
  const group = (s: Parameters<typeof journeyFor>[0], scheduled = false) =>
    jobGroup(journeyFor(s), scheduled);

  it("puts anything needing the customer in front", () => {
    expect(group("quoted")).toBe("action");
    expect(group("invoiced")).toBe("action");
  });

  it("separates a job with a date from one still being sorted", () => {
    expect(group("booked", true)).toBe("scheduled");
    expect(group("in_progress", true)).toBe("scheduled");
    // The commonest resting state: accepted, but no window locked in yet.
    expect(group("approved", false)).toBe("pending");
    expect(group("approved", true)).toBe("scheduled");
    expect(group("enquiry")).toBe("pending");
  });

  it("leaves a finished job awaiting its invoice in the works, not in the past", () => {
    expect(group("completed")).toBe("pending");
  });

  it("files settled and cancelled jobs under past", () => {
    expect(group("paid")).toBe("past");
    expect(group("cancelled")).toBe("past");
  });

  it("never lets an action job hide behind a date", () => {
    // An invoice is due whether or not the visit is still in the diary.
    expect(group("invoiced", true)).toBe("action");
  });

  it("labels every group", () => {
    for (const g of JOB_GROUPS) expect(JOB_GROUP_LABELS[g].length).toBeGreaterThan(0);
  });
});
