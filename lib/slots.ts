import { addDays, addMinutes, isBefore } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const BUSINESS_TIME_ZONE = "Australia/Melbourne";

export type AvailabilityRule = {
  day_of_week: number; // 0 = Sunday … 6 = Saturday
  start_time: string; // "HH:mm" or "HH:mm:ss"
  end_time: string;
  active: boolean;
};

export type BlockedDate = {
  date: string; // "yyyy-MM-dd" (business-local date)
};

export type BusyInterval = {
  slot_start: string | null; // ISO timestamp
  slot_end: string | null;
  status?: string;
};

export type OpenSlot = {
  /** UTC instant the arrival window starts. */
  start: Date;
  /** UTC instant the arrival window ends. */
  end: Date;
  /** Business-local date, "yyyy-MM-dd". */
  localDate: string;
  /** Business-local label, e.g. "09:00 – 11:00". */
  label: string;
};

export type GetOpenSlotsOptions = {
  /** First day of the range (any instant within that local day). */
  from: Date;
  /** Number of local days to include. */
  days: number;
  rules: AvailabilityRule[];
  blockedDates: BlockedDate[];
  /** Existing bookings; cancelled ones are ignored. */
  bookings: BusyInterval[];
  /** "Now" for lead-time purposes (defaults to real now). */
  now?: Date;
  /** Minimum lead time before a slot can start. Default 24h. */
  leadTimeHours?: number;
  /** Arrival window length. Default 120 minutes. */
  slotMinutes?: number;
  timeZone?: string;
};

function parseTime(value: string): { hours: number; minutes: number } {
  const [h = "0", m = "0"] = value.split(":");
  return { hours: Number(h), minutes: Number(m) };
}

function toMinutes(value: string): number {
  const { hours, minutes } = parseTime(value);
  return hours * 60 + minutes;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

/**
 * Returns open arrival windows between `from` and `from + days`, computed in
 * the business time zone (Australia/Melbourne by default), honouring
 * availability rules, blocked dates, existing bookings and a minimum lead
 * time. Slot boundaries are generated on the local wall clock, so windows
 * stay aligned (e.g. 09:00–11:00) across DST transitions.
 */
export function getOpenSlots(options: GetOpenSlotsOptions): OpenSlot[] {
  const {
    from,
    days,
    rules,
    blockedDates,
    bookings,
    now = new Date(),
    leadTimeHours = 24,
    slotMinutes = 120,
    timeZone = BUSINESS_TIME_ZONE,
  } = options;

  const activeRules = rules.filter((r) => r.active);
  if (activeRules.length === 0 || days <= 0) return [];

  const blocked = new Set(blockedDates.map((b) => b.date));
  const busy = bookings
    .filter((b) => b.status !== "cancelled" && b.slot_start && b.slot_end)
    .map((b) => ({ start: new Date(b.slot_start!), end: new Date(b.slot_end!) }));

  const earliestStart = addMinutes(now, leadTimeHours * 60);
  const slots: OpenSlot[] = [];

  for (let i = 0; i < days; i++) {
    // The local calendar date for this offset. Using noon avoids edge cases
    // where midnight arithmetic lands on the previous/next local day.
    const localDate = formatInTimeZone(addDays(from, i), timeZone, "yyyy-MM-dd");
    if (blocked.has(localDate)) continue;

    const dayOfWeek = Number(
      formatInTimeZone(fromZonedTime(`${localDate}T12:00:00`, timeZone), timeZone, "i")
    );
    // date-fns "i" is ISO (1 = Monday … 7 = Sunday); rules use 0 = Sunday.
    const ruleDay = dayOfWeek === 7 ? 0 : dayOfWeek;

    for (const rule of activeRules) {
      if (rule.day_of_week !== ruleDay) continue;

      const startMin = toMinutes(rule.start_time);
      const endMin = toMinutes(rule.end_time);

      for (let m = startMin; m + slotMinutes <= endMin; m += slotMinutes) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const start = fromZonedTime(`${localDate}T${hh}:${mm}:00`, timeZone);
        const end = addMinutes(start, slotMinutes);

        if (isBefore(start, earliestStart)) continue;
        if (busy.some((b) => overlaps(start, end, b.start, b.end))) continue;

        slots.push({
          start,
          end,
          localDate,
          label: `${formatInTimeZone(start, timeZone, "HH:mm")} – ${formatInTimeZone(end, timeZone, "HH:mm")}`,
        });
      }
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
