/**
 * "When are you coming?" as a running clock.
 *
 * The arrival window is the one thing a customer opens the portal to check, so
 * it gets a live countdown rather than a date they have to subtract from today.
 *
 * Pure and now-injected: the caller passes the clock, so this is testable and
 * the client hook can re-render it on a timer without the formatting logic
 * knowing anything about React.
 */

export type CountdownPhase =
  /** The visit is still ahead. */
  | "future"
  /** We're inside the arrival window right now. */
  | "arriving"
  /** The window has closed. */
  | "elapsed";

export type Countdown = {
  phase: CountdownPhase;
  /** Customer-facing label, e.g. "in 2 days 4 hrs". Empty once elapsed. */
  label: string;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Rounds *down* throughout. "in 2 days" that silently means 2.9 days sets a
 * customer up to be surprised; a countdown that under-promises never does.
 */
function distance(ms: number): string {
  if (ms >= DAY) {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / HOUR);
    return hours ? `${plural(days, "day")} ${hours} hr` : plural(days, "day");
  }
  if (ms >= HOUR) {
    const hours = Math.floor(ms / HOUR);
    const mins = Math.floor((ms % HOUR) / MINUTE);
    return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
  }
  const mins = Math.floor(ms / MINUTE);
  // Sub-minute reads as "any second now" rather than "in 0 min".
  return mins < 1 ? "under a minute" : plural(mins, "min");
}

export function countdownTo(
  nowMs: number,
  startMs: number,
  endMs: number | null
): Countdown {
  if (nowMs < startMs) {
    return { phase: "future", label: `in ${distance(startMs - nowMs)}` };
  }
  // No end time still deserves a window — treat the slot as the standard two
  // hours rather than flipping straight to "elapsed" the moment it starts.
  const closes = endMs ?? startMs + 2 * HOUR;
  if (nowMs <= closes) return { phase: "arriving", label: "Arriving now" };
  return { phase: "elapsed", label: "" };
}
