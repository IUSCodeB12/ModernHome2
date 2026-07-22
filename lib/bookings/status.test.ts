import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUSES,
  allowedTransitions,
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
