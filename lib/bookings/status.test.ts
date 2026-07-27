import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUSES,
  allowedTransitions,
  canSendQuote,
  canTransition,
  type BookingStatus,
} from "@/lib/bookings/status";

describe("booking status machine", () => {
  it("permits the forward happy path", () => {
    const path: BookingStatus[] = [
      "enquiry",
      "quoted",
      "approved",
      "booked",
      "in_progress",
      "completed",
      "invoiced",
      "paid",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it("rejects self-transitions", () => {
    for (const s of BOOKING_STATUSES) {
      expect(canTransition(s, s)).toBe(false);
    }
  });

  it("rejects skipping stages", () => {
    expect(canTransition("enquiry", "booked")).toBe(false);
    expect(canTransition("quoted", "paid")).toBe(false);
    expect(canTransition("booked", "completed")).toBe(false);
  });

  it("allows cancelling from any active stage", () => {
    for (const s of BOOKING_STATUSES) {
      if (s === "cancelled" || s === "paid") continue;
      expect(allowedTransitions(s)).toContain("cancelled");
    }
  });

  it("treats the customer accept/decline transitions as valid", () => {
    // quoted -> approved (accept), quoted -> cancelled (decline)
    expect(canTransition("quoted", "approved")).toBe(true);
    expect(canTransition("quoted", "cancelled")).toBe(true);
  });

  it("does not let a paid job move forward", () => {
    const onward = allowedTransitions("paid").filter((s) => s !== "invoiced");
    expect(onward).toHaveLength(0);
  });
});

describe("canSendQuote", () => {
  it("lets a quote reach the customer before the job is locked in", () => {
    // The portal only renders accept/decline while the booking is 'quoted',
    // so these must be flippable back to 'quoted' when a quote is (re)built.
    expect(canSendQuote("enquiry")).toBe(true);
    expect(canSendQuote("quoted")).toBe(true);
    expect(canSendQuote("approved")).toBe(true);
  });

  it("refuses once the job is booked, underway, or money has moved", () => {
    // 'booked' has to be walked back through 'approved' deliberately.
    expect(canSendQuote("booked")).toBe(false);
    expect(canSendQuote("in_progress")).toBe(false);
    expect(canSendQuote("completed")).toBe(false);
    expect(canSendQuote("invoiced")).toBe(false);
    expect(canSendQuote("paid")).toBe(false);
    expect(canSendQuote("cancelled")).toBe(false);
  });

  it("only permits statuses that can actually reach 'quoted'", () => {
    for (const s of BOOKING_STATUSES) {
      if (!canSendQuote(s)) continue;
      // Either already quoted, or a legal transition into it.
      expect(s === "quoted" || canTransition(s, "quoted")).toBe(true);
    }
  });
});
