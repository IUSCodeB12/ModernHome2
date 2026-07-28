import { describe, expect, it } from "vitest";
import { BOOKING_STATUSES } from "@/lib/bookings/status";
import {
  JOURNEY_STEPS,
  attentionRank,
  journeyFor,
  journeyHeadline,
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

describe("headline / amount redundancy", () => {
  it("flags the states whose title already carries the money", () => {
    expect(journeyHeadline({ status: "quoted", amount: "$581" }).showsAmount).toBe(true);
    expect(journeyHeadline({ status: "invoiced", amount: "$581" }).showsAmount).toBe(
      true
    );
  });

  it("does not flag it when there is no amount to show", () => {
    expect(journeyHeadline({ status: "quoted" }).showsAmount).toBe(false);
    expect(journeyHeadline({ status: "booked", arrival: "Thu" }).showsAmount).toBe(
      false
    );
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
  it("leads with the arrival window once booked", () => {
    const { title, body } = journeyHeadline({
      status: "booked",
      arrival: "Thu 14 Aug, 8:00am – 10:00am",
      relative: "in 2 days",
      installer: "Tom",
    });
    expect(title).toBe("We arrive Thu 14 Aug, 8:00am – 10:00am");
    expect(body).toContain("in 2 days");
    expect(body).toContain("Tom");
  });

  it("falls back when the slot or installer is missing", () => {
    const { title, body } = journeyHeadline({ status: "booked" });
    expect(title).toBe("You're booked in");
    expect(body).not.toContain("undefined");
    expect(body).not.toContain("null");
  });

  it("puts the amount in the headline when money is owed", () => {
    expect(journeyHeadline({ status: "quoted", amount: "$836.00" }).title).toBe(
      "Your quote is ready — $836.00"
    );
    expect(journeyHeadline({ status: "invoiced", amount: "$836.00" }).title).toBe(
      "Payment due — $836.00"
    );
  });

  it("drops the dash when there is no amount to show", () => {
    expect(journeyHeadline({ status: "quoted" }).title).toBe("Your quote is ready");
    expect(journeyHeadline({ status: "invoiced" }).title).toBe("Payment due");
  });

  it("gives every status a non-empty headline", () => {
    for (const status of BOOKING_STATUSES) {
      const { title, body } = journeyHeadline({ status });
      expect(title.length, status).toBeGreaterThan(0);
      expect(body.length, status).toBeGreaterThan(0);
    }
  });
});
