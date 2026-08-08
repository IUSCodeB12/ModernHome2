"use client";

import { useEffect, useRef } from "react";

/**
 * Pull-to-reveal for the hero, touch only.
 *
 * Dragging down at the very top of the page clears everything off the
 * photograph — scrim, copy, scroll cue — and eases it all back on release.
 *
 * Driven by touch deltas rather than scroll position because scroll position
 * cannot see this gesture: Android Chrome clamps `scrollY` at 0, so an
 * overscroll pull emits no scroll event at all. The progress is written to a
 * `--hero-pull` custom property and every visual response is derived from it in
 * CSS, so a drag costs one property write per frame and no React render.
 */

/** Finger travel for a full reveal. */
const PULL_MAX = 180;
/** Ignore the first few pixels so a tap or a horizontal swipe does nothing. */
const DEAD_ZONE = 8;
/** Must outlast the release transition in globals.css. */
const RELEASE_MS = 560;

export function HeroPull({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
     * Android's pull-to-refresh owns this gesture by default and would reload
     * the page mid-reveal. `contain` stops that without taking iOS's rubber
     * band with it — `none` would, and the bounce is half of why the pull feels
     * physical. Scoped to the homepage by this component's own lifetime: the
     * hero unmounts on navigation and the previous value goes back.
     */
    const root = document.documentElement;
    const previousOverscroll = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = "contain";

    let startY = 0;
    let active = false;
    let progress = 0;
    let frame = 0;

    const flush = () => {
      frame = 0;
      el.style.setProperty("--hero-pull", progress.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onStart = (e: TouchEvent) => {
      // Only from a genuine resting position at the top, one finger.
      if (e.touches.length !== 1 || window.scrollY > 0) {
        active = false;
        return;
      }
      startY = e.touches[0].clientY;
      active = true;
      el.classList.remove("is-releasing");
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      if (e.touches.length !== 1) {
        active = false;
        return;
      }
      const dy = e.touches[0].clientY - startY;
      // Dragging up is ordinary scrolling — surrender the gesture.
      const next = dy < DEAD_ZONE ? 0 : Math.min(1, (dy - DEAD_ZONE) / PULL_MAX);
      if (next !== progress) {
        progress = next;
        schedule();
      }
    };

    const onEnd = () => {
      active = false;
      if (progress === 0) return;
      /*
       * Custom properties do not transition, so the class puts a transition on
       * the *derived* opacity and transform instead. Setting the property to 0
       * in the same tick changes their computed values, which is what actually
       * animates.
       */
      el.classList.add("is-releasing");
      progress = 0;
      el.style.setProperty("--hero-pull", "0");
      window.setTimeout(() => el.classList.remove("is-releasing"), RELEASE_MS);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      root.style.overscrollBehaviorY = previousOverscroll;
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="hero-pull">
      {children}
    </div>
  );
}
