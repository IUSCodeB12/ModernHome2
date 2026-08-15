import { describe, expect, it } from "vitest";
import { countdownTo } from "@/lib/bookings/countdown";

const MIN = 60_000;
const HR = 60 * MIN;
const DAY = 24 * HR;

/** Arbitrary fixed clock — the logic is a subtraction, the epoch is irrelevant. */
const NOW = new Date("2026-08-15T09:00:00+10:00").getTime();

function label(msAhead: number, windowMs = 2 * HR) {
  const start = NOW + msAhead;
  return countdownTo(NOW, start, start + windowMs);
}

describe("countdownTo", () => {
  it("counts whole days with the remaining hours", () => {
    expect(label(2 * DAY + 4 * HR)).toEqual({
      phase: "future",
      label: "in 2 days 4 hr",
    });
  });

  it("drops the hours when the day lands exactly", () => {
    expect(label(3 * DAY).label).toBe("in 3 days");
  });

  it("singularises one day", () => {
    expect(label(DAY + 30 * MIN).label).toBe("in 1 day");
  });

  it("switches to hours and minutes inside a day", () => {
    expect(label(5 * HR + 20 * MIN).label).toBe("in 5 hr 20 min");
  });

  it("drops the minutes on a whole hour", () => {
    expect(label(2 * HR).label).toBe("in 2 hr");
  });

  it("counts minutes in the last hour", () => {
    expect(label(12 * MIN).label).toBe("in 12 mins");
    expect(label(MIN).label).toBe("in 1 min");
  });

  it("never rounds up into a promise it can't keep", () => {
    // 2 days 23 hrs 59 mins is "2 days 23 hr", never "3 days".
    expect(label(2 * DAY + 23 * HR + 59 * MIN).label).toBe("in 2 days 23 hr");
  });

  it("says something human under a minute", () => {
    expect(label(30_000).label).toBe("in under a minute");
  });

  it("reads as arriving from the start of the window to its end", () => {
    expect(label(0)).toEqual({ phase: "arriving", label: "Arriving now" });
    expect(label(-90 * MIN).phase).toBe("arriving");
    expect(label(-2 * HR).phase).toBe("arriving");
  });

  it("elapses once the window closes", () => {
    expect(label(-2 * HR - MIN)).toEqual({ phase: "elapsed", label: "" });
  });

  it("assumes a two-hour window when no end time is stored", () => {
    expect(countdownTo(NOW, NOW - 30 * MIN, null).phase).toBe("arriving");
    expect(countdownTo(NOW, NOW - 3 * HR, null).phase).toBe("elapsed");
  });
});
