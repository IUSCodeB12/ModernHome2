"use client";

import { useEffect, useRef, useState } from "react";
import { formatAud } from "@/lib/quote/estimate";

const DURATION_MS = 450;

/** Ease-out cubic — fast off the mark, settles gently on the final figure. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A dollar figure that counts up (or down) to its new value instead of
 * snapping. Watching the number move is the point — it's the feedback that
 * makes answering the next question feel worthwhile.
 */
export function AnimatedPrice({ cents }: { cents: number }) {
  const [display, setDisplay] = useState(cents);
  const fromRef = useRef(cents);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === cents) return;

    if (prefersReducedMotion()) {
      fromRef.current = cents;
      setDisplay(cents);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1);
      const value = Math.round(from + (cents - from) * easeOut(t));
      setDisplay(value);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = cents;
        frameRef.current = null;
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // Mid-flight interruption: continue from wherever the tween got to, so a
      // fast tapper never sees the figure jump back to the old value.
      fromRef.current = display;
    };
    // `display` is the tween's own output — depending on it would restart the
    // animation on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cents]);

  return <span className="tabular-nums">{formatAud(display)}</span>;
}
