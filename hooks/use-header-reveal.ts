"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-direction visibility for the site header.
 *
 * Reads *intent*, not direction. Flipping on the sign of each scroll event is
 * what makes most auto-hiding headers feel cheap: a trackpad's momentum tail
 * and iOS rubber-banding both emit stray deltas in the opposite direction, so
 * the bar twitches while you're reading. Here the deltas accumulate and only a
 * committed run in one direction moves it.
 *
 * The two thresholds are deliberately lopsided. Hiding costs you the nav, so it
 * has to be asked for clearly; revealing is what you want the instant you
 * change your mind, so it barely has to be asked for at all. Reluctant to
 * leave, eager to come back.
 */

/** A committed downward run — roughly one header height — before it tucks. */
const HIDE_INTENT_PX = 64;
/** Barely a flick. The reveal should feel like it anticipated you. */
const SHOW_INTENT_PX = 10;
/** Default floor: above this the header is the top of the page, not an obstacle. */
const DEFAULT_ARM_AT_PX = 220;

type Options = {
  /**
   * Hold the header open regardless of scrolling — currently just the open
   * mobile menu, whose close button lives inside the header.
   */
  pinned: boolean;
  /**
   * Scroll offset past which hiding is allowed, resolved per measurement so it
   * can depend on viewport height without needing a resize listener.
   *
   * This is a *threshold*, not a boolean, and that matters. It was originally
   * folded into `pinned` as the homepage's `overHero` flag, which flips at
   * `innerHeight * 0.72` — and because `pinned` is a dependency, every flip
   * tore the listener down, re-ran the effect and forced the header open.
   * Scrolling anywhere near that line made it flap. A monotonic threshold has
   * no such edge: crossing it changes what's allowed, not what's mounted.
   */
  armAt?: () => number;
};

export function useHeaderReveal({ pinned, armAt }: Options): boolean {
  const [hidden, setHidden] = useState(false);
  const [animate, setAnimate] = useState(true);
  const lastY = useRef(0);
  const intent = useRef(0);
  const pinnedRef = useRef(pinned);
  const armAtRef = useRef(armAt);

  armAtRef.current = armAt;

  useEffect(() => {
    pinnedRef.current = pinned;
    if (pinned) setHidden(false);
  }, [pinned]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAnimate(!media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    // Someone who asked for less motion did not ask for the nav to disappear.
    if (!animate) {
      setHidden(false);
      return;
    }

    lastY.current = window.scrollY;
    intent.current = 0;
    let frame = 0;

    const measure = () => {
      frame = 0;
      /*
       * Clamped: iOS reports scrollY past both ends during the rubber-band, and
       * those phantom deltas would otherwise register as a direction change and
       * flap the header at the top and bottom of every page.
       */
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      const y = Math.min(Math.max(window.scrollY, 0), max);
      const delta = y - lastY.current;
      lastY.current = y;

      const arm = armAtRef.current?.() ?? DEFAULT_ARM_AT_PX;
      if (pinnedRef.current || y <= arm) {
        intent.current = 0;
        setHidden(false);
        return;
      }

      /*
       * Nobody flicks a whole viewport in one event. A jump this size is an
       * anchor link, a restored scroll position, or `scroll-behavior: smooth`
       * resolving — none of them a statement about where the nav should be.
       * `lastY` is already updated, so the next delta measures from here.
       */
      if (Math.abs(delta) > window.innerHeight) return;

      // Turning around discards whatever was banked in the other direction.
      if (delta > 0 !== intent.current > 0) intent.current = 0;
      intent.current += delta;

      if (intent.current > HIDE_INTENT_PX) setHidden(true);
      else if (intent.current < -SHOW_INTENT_PX) setHidden(false);
    };

    /*
     * Coalesced to one decision per frame. Scroll fires faster than paint on
     * plenty of hardware, and each surplus event was another chance to toggle
     * the class mid-transition — which is what made the slide look stuttery
     * rather than the transform itself being slow.
     */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [animate]);

  return hidden;
}
