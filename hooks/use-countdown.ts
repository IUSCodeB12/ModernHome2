"use client";

import { useEffect, useState } from "react";
import { countdownTo, type Countdown } from "@/lib/bookings/countdown";

/**
 * Live arrival countdown.
 *
 * Returns `null` on the server and on the first client render, so the markup
 * matches on both sides — the server has no business guessing what "in 3 hrs"
 * says by the time it reaches the browser. Callers render a static fallback
 * (the formatted date) until this fills in, which lands one paint later.
 *
 * Ticks once a minute: the label's finest grain is minutes, so a faster timer
 * would wake the tab for nothing.
 */
export function useCountdown(
  startMs: number | null,
  endMs: number | null
): Countdown | null {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    if (startMs === null) {
      setCountdown(null);
      return;
    }
    const tick = () => setCountdown(countdownTo(Date.now(), startMs, endMs));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [startMs, endMs]);

  return countdown;
}
