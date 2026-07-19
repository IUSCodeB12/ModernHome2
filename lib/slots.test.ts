import { describe, expect, it } from "vitest";
import { formatInTimeZone } from "date-fns-tz";
import {
  getOpenSlots,
  type AvailabilityRule,
  type BusyInterval,
} from "@/lib/slots";

const TZ = "Australia/Melbourne";

// Mon–Fri 09:00–17:00
const weekdayRules: AvailabilityRule[] = [1, 2, 3, 4, 5].map((day) => ({
  day_of_week: day,
  start_time: "09:00",
  end_time: "17:00",
  active: true,
}));

// A Monday well in the future, outside DST edges (AEST, UTC+10).
// 2026-07-20 is a Monday.
const monday = new Date("2026-07-20T00:00:00+10:00");
const wellBefore = new Date("2026-07-01T00:00:00+10:00");

describe("getOpenSlots", () => {
  it("generates 2-hour windows inside availability rules", () => {
    const slots = getOpenSlots({
      from: monday,
      days: 1,
      rules: weekdayRules,
      blockedDates: [],
      bookings: [],
      now: wellBefore,
    });

    expect(slots.map((s) => s.label)).toEqual([
      "09:00 – 11:00",
      "11:00 – 13:00",
      "13:00 – 15:00",
      "15:00 – 17:00",
    ]);
    expect(slots.every((s) => s.localDate === "2026-07-20")).toBe(true);
  });

  it("returns nothing for days without an active rule (weekend)", () => {
    // 2026-07-25/26 are Sat/Sun.
    const slots = getOpenSlots({
      from: new Date("2026-07-25T00:00:00+10:00"),
      days: 2,
      rules: weekdayRules,
      blockedDates: [],
      bookings: [],
      now: wellBefore,
    });
    expect(slots).toEqual([]);
  });

  it("ignores inactive rules", () => {
    const slots = getOpenSlots({
      from: monday,
      days: 1,
      rules: weekdayRules.map((r) => ({ ...r, active: false })),
      blockedDates: [],
      bookings: [],
      now: wellBefore,
    });
    expect(slots).toEqual([]);
  });

  it("skips blocked dates", () => {
    const slots = getOpenSlots({
      from: monday,
      days: 2, // Mon + Tue
      rules: weekdayRules,
      blockedDates: [{ date: "2026-07-20" }],
      bookings: [],
      now: wellBefore,
    });
    expect(slots.every((s) => s.localDate === "2026-07-21")).toBe(true);
    expect(slots).toHaveLength(4);
  });

  it("enforces the 24h minimum lead time", () => {
    // "Now" is Monday 08:00 local → Tuesday slots before 08:00 excluded;
    // Monday entirely excluded, Tuesday 09:00 onwards fine.
    const slots = getOpenSlots({
      from: monday,
      days: 2,
      rules: weekdayRules,
      blockedDates: [],
      bookings: [],
      now: new Date("2026-07-20T08:00:00+10:00"),
    });
    expect(slots.every((s) => s.localDate === "2026-07-21")).toBe(true);
    expect(slots).toHaveLength(4);
  });

  it("excludes slots overlapping existing bookings, ignoring cancelled", () => {
    const bookings: BusyInterval[] = [
      {
        // 11:00–13:00 local on the Monday
        slot_start: "2026-07-20T01:00:00.000Z",
        slot_end: "2026-07-20T03:00:00.000Z",
        status: "booked",
      },
      {
        // 15:00–17:00 local but cancelled — should NOT block
        slot_start: "2026-07-20T05:00:00.000Z",
        slot_end: "2026-07-20T07:00:00.000Z",
        status: "cancelled",
      },
    ];

    const slots = getOpenSlots({
      from: monday,
      days: 1,
      rules: weekdayRules,
      blockedDates: [],
      bookings,
      now: wellBefore,
    });

    expect(slots.map((s) => s.label)).toEqual([
      "09:00 – 11:00",
      "13:00 – 15:00",
      "15:00 – 17:00",
    ]);
  });

  it("keeps a partial-overlap slot blocked", () => {
    const bookings: BusyInterval[] = [
      {
        // 10:00–12:00 local — overlaps both 09:00–11:00 and 11:00–13:00
        slot_start: "2026-07-20T00:00:00.000Z",
        slot_end: "2026-07-20T02:00:00.000Z",
        status: "booked",
      },
    ];

    const slots = getOpenSlots({
      from: monday,
      days: 1,
      rules: weekdayRules,
      blockedDates: [],
      bookings,
      now: wellBefore,
    });

    expect(slots.map((s) => s.label)).toEqual(["13:00 – 15:00", "15:00 – 17:00"]);
  });

  it("keeps local wall-clock alignment across the DST start (AEST→AEDT)", () => {
    // Melbourne DST starts Sunday 2026-10-04, 02:00 → 03:00.
    // Friday 2026-10-02 is AEST (UTC+10); Monday 2026-10-05 is AEDT (UTC+11).
    const slots = getOpenSlots({
      from: new Date("2026-10-02T00:00:00+10:00"),
      days: 4, // Fri, Sat, Sun, Mon
      rules: weekdayRules,
      blockedDates: [],
      bookings: [],
      now: new Date("2026-09-20T00:00:00+10:00"),
    });

    const friday = slots.filter((s) => s.localDate === "2026-10-02");
    const mondayAfter = slots.filter((s) => s.localDate === "2026-10-05");

    // Local labels identical either side of the transition…
    expect(friday.map((s) => s.label)).toEqual(mondayAfter.map((s) => s.label));
    // …but UTC offsets differ: 09:00 AEST = 23:00Z prev day, 09:00 AEDT = 22:00Z.
    expect(friday[0].start.toISOString()).toBe("2026-10-01T23:00:00.000Z");
    expect(mondayAfter[0].start.toISOString()).toBe("2026-10-04T22:00:00.000Z");
    // Local rendering confirms 09:00 both days.
    expect(formatInTimeZone(friday[0].start, TZ, "HH:mm")).toBe("09:00");
    expect(formatInTimeZone(mondayAfter[0].start, TZ, "HH:mm")).toBe("09:00");
  });

  it("does not emit a window that would spill past the rule end", () => {
    const slots = getOpenSlots({
      from: monday,
      days: 1,
      rules: [{ day_of_week: 1, start_time: "09:00", end_time: "12:00", active: true }],
      blockedDates: [],
      bookings: [],
      now: wellBefore,
    });
    // 09:00–11:00 fits; 11:00–13:00 would exceed 12:00.
    expect(slots.map((s) => s.label)).toEqual(["09:00 – 11:00"]);
  });
});
