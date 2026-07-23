"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/lib/home/data";

const INTERVAL = 5500;

/**
 * Premium auto-advancing hero slideshow: slow crossfade + subtle Ken Burns
 * zoom, warm vignette, pause on hover, and progress dots. Respects
 * prefers-reduced-motion (no auto-advance, no zoom). Uses plain <img> against
 * the public gallery bucket — no next/image domain config needed.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduced.current || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <div
      className="group absolute inset-0 bg-[#1a1714]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Recent interior installs"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: i === index ? 1 : 0 }}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- public bucket URL, no next/image domain config */}
          <img
            src={slide.image_url}
            alt={slide.headline ?? "Interior install by ModernHome"}
            className="size-full object-cover motion-safe:animate-[hero-kenburns_12s_ease-in-out_infinite_alternate]"
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            draggable={false}
          />
        </div>
      ))}

      {/* Warm vignette + bottom scrim for depth and legibility */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(20,18,16,0.5))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(20,18,16,0.55),transparent)]" />

      {slides[index]?.headline && (
        <p className="absolute bottom-5 left-5 right-14 text-sm font-medium text-white/90 drop-shadow">
          {slides[index].headline}
        </p>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-5 right-5 flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
