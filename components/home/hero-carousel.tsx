"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HeroSlide } from "@/lib/home/data";

const INTERVAL = 6000;
const SWIPE_THRESHOLD = 40;

/**
 * Editorial hero slideshow: slow crossfade with a settling Ken Burns push,
 * numbered slide index, a timer bar that refills per slide, and hover-revealed
 * arrows. Advances on click, swipe, or arrow keys; pauses on hover/focus and
 * while the tab is hidden.
 *
 * Deliberately CSS-only (no framer-motion) — this is the LCP element, and the
 * hero must not pull an animation library into the initial bundle. Respects
 * prefers-reduced-motion: no auto-advance, no zoom, no caption movement.
 * Uses plain <img> against the public gallery bucket — no next/image domain
 * config needed.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (delta: number) =>
      setIndex((i) => (i + delta + slides.length) % slides.length),
    [slides.length]
  );

  // Don't burn timers (or animation frames) on a tab nobody is looking at.
  useEffect(() => {
    const sync = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const t = setInterval(() => go(1), INTERVAL);
    return () => clearInterval(t);
  }, [paused, reduced, slides.length, go, index]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (slides.length < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  }

  const active = slides[index];

  return (
    <div
      className="group absolute inset-0 bg-[#1a1714]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start == null || end == null) return;
        const dx = end - start;
        if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Recent interior installs"
      tabIndex={0}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ opacity: i === index ? 1 : 0 }}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- public bucket URL, no next/image domain config */}
          <img
            src={slide.image_url}
            alt={slide.headline ?? "Interior install by ModernHome"}
            className="size-full object-cover motion-safe:animate-[hero-kenburns_14s_ease-out_infinite_alternate]"
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            draggable={false}
          />
        </div>
      ))}

      {/* Depth: warm vignette, bottom scrim, and a top fade so the frame edge reads */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(20,18,16,0.55))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(20,18,16,0.78),rgba(20,18,16,0.25)_45%,transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(to_bottom,rgba(20,18,16,0.35),transparent)]" />

      {/* Hover-revealed arrows — always focusable for keyboard users */}
      {slides.length > 1 && (
        <>
          <ArrowButton side="left" onClick={() => go(-1)} label="Previous slide" />
          <ArrowButton side="right" onClick={() => go(1)} label="Next slide" />
        </>
      )}

      {/* Editorial caption block */}
      <div className="pointer-events-none absolute inset-x-5 bottom-5 sm:inset-x-6 sm:bottom-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {active?.headline && (
              <p
                key={active.id}
                className="motion-safe:animate-[hero-caption-in_700ms_ease-out_both] truncate text-[0.95rem] font-medium text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] sm:text-base"
              >
                {active.headline}
              </p>
            )}
          </div>
          {slides.length > 1 && (
            <p className="shrink-0 font-mono text-xs tabular-nums text-white/70">
              <span className="text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mx-1 text-white/40">/</span>
              {String(slides.length).padStart(2, "0")}
            </p>
          )}
        </div>

        {/* Timer bar — refills each slide, holds while paused */}
        {slides.length > 1 && (
          <div className="mt-3 h-px w-full overflow-hidden bg-white/20">
            <div
              key={reduced ? "static" : index}
              className="h-full origin-left bg-[#c9a24b] motion-reduce:hidden"
              style={
                reduced
                  ? undefined
                  : {
                      animation: `hero-progress ${INTERVAL}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }
              }
            />
          </div>
        )}
      </div>

      {/* Screen readers get the slide change without the visual chrome */}
      <p className="sr-only" aria-live="polite">
        {active?.headline
          ? `Slide ${index + 1} of ${slides.length}: ${active.headline}`
          : `Slide ${index + 1} of ${slides.length}`}
      </p>
    </div>
  );
}

function ArrowButton({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  const Icon = side === "left" ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white opacity-0 shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/60 hover:bg-black/65 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group-hover:opacity-100 ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}
