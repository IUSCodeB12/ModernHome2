"use client";

/* eslint-disable @next/next/no-img-element -- public bucket URLs, no next/image domain config */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/lib/home/data";

/**
 * Cinematic image stage for the hero.
 *
 * Deliberately has no arrows, dots or counter. Controls make a hero read as a
 * gallery — "here are some photos" — rather than as the studio's own work. The
 * images cross-fade on their own and each one slowly scales while it's on
 * screen, which is what makes a static photo feel expensive.
 *
 * Respects prefers-reduced-motion: the zoom and the auto-advance both stop,
 * leaving the first image static.
 */
const HOLD_MS = 7000;

export function HeroStage({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  /** The frame being faded out. Null on first paint, so nothing extra loads. */
  const [previous, setPrevious] = useState<number | null>(null);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAnimate(!media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!animate || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((i) => {
        setPrevious(i);
        return (i + 1) % slides.length;
      });
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [animate, slides.length]);

  if (slides.length === 0) return <HeroStagePoster />;

  /*
   * Only the outgoing and incoming frames are in the DOM. Rendering every
   * slide at once meant an eleven-slide gallery downloaded eleven full-width
   * photographs on first paint — and because they all sit stacked in the same
   * box, they're technically in-viewport, so `loading="lazy"` deferred none of
   * them.
   */
  const visible = [
    { slide: slides[index], key: `${slides[index].id}-${index}`, active: true },
    ...(previous !== null && previous !== index
      ? [{ slide: slides[previous], key: `${slides[previous].id}-${previous}`, active: false }]
      : []),
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {visible.map(({ slide, key, active }) => (
        <div
          key={key}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1600ms] ease-[var(--ease-out-soft)]",
            active ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!active}
        >
          <img
            src={slide.image_url}
            alt={slide.headline ?? ""}
            className={cn(
              "size-full object-cover transition-[filter] duration-700",
              // Lights on: lift the room rather than swap the photograph.
              "brightness-[1.09] saturate-[1.04] dark:brightness-100 dark:saturate-100",
              // 100% → 106% over the hold, so movement is felt but not seen.
              animate && active && "animate-hero-pan"
            )}
            fetchPriority={index === 0 && active ? "high" : "auto"}
          />
        </div>
      ))}

      {/* Seam gradient — lets the dark panel bleed into the photograph rather
          than butting against it with a hard edge. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent lg:from-background/95 lg:via-background/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/25" />
    </div>
  );
}

/** Warm stand-in before any slides are curated. Never blocks the LCP text. */
export function HeroStagePoster() {
  return (
    <div className="absolute inset-0 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_40%,rgba(214,168,95,0.20),transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(201,162,75,0.10),transparent_55%)]" />
    </div>
  );
}
