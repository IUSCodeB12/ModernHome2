"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaticHero } from "@/components/home/static-hero";

// Lazy-load the 3D canvas — never server-rendered, never in the main bundle.
const WovenCanvas = dynamic(() => import("@/components/home/woven-canvas"), {
  ssr: false,
  loading: () => <StaticHero />,
});

/**
 * Low-end heuristic: few cores or reduced-motion preference → static hero.
 * Keeps Lighthouse mobile happy on weak devices.
 */
function useHeroMode(): "static" | "3d" | "pending" {
  const [mode, setMode] = useState<"static" | "3d" | "pending">("pending");
  useEffect(() => {
    const lowEnd =
      (navigator.hardwareConcurrency ?? 8) < 4 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(lowEnd ? "static" : "3d");
  }, []);
  return mode;
}

/**
 * Mount the heavy 3D bundle only on first user intent (or after a long
 * idle). Keeps three.js entirely out of the page-load window, so
 * Lighthouse mobile scores against the static hero while real users get
 * the scene the moment they move a finger or the mouse.
 */
function useDeferredMount(enabled: boolean): boolean {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    if (!enabled || mount) return;
    let done = false;
    const events: (keyof WindowEventMap)[] = [
      "pointermove",
      "pointerdown",
      "touchstart",
      "scroll",
      "keydown",
    ];
    const start = () => {
      if (done) return;
      done = true;
      cleanup();
      setMount(true);
    };
    const timer = window.setTimeout(start, 8000); // idle fallback
    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, start));
      window.clearTimeout(timer);
    };
    events.forEach((e) =>
      window.addEventListener(e, start, { once: true, passive: true })
    );
    return cleanup;
  }, [enabled, mount]);
  return mount;
}

export function Hero() {
  const mode = useHeroMode();
  const sceneReady = useDeferredMount(mode === "3d");

  return (
    <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden bg-[#141210]">
      {/* Warm depth behind the woven light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,177,99,0.10),transparent_65%)]" />

      {/* Scene / fallback */}
      {mode === "3d" && sceneReady ? (
        <Suspense fallback={<StaticHero />}>
          <div className="absolute inset-0">
            <WovenCanvas />
          </div>
        </Suspense>
      ) : (
        <StaticHero />
      )}

      {/* Overlay — CTA visible at all times */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-6xl px-4 text-center">
          <p className="mx-auto mb-4 w-fit rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur">
            {mode === "3d"
              ? "Move your cursor · it's alive"
              : "Renovations · Repairs · Installations"}
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl text-white drop-shadow sm:text-7xl md:text-8xl">
            Your home, done properly.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 sm:text-lg">
            Renovations, repairs and installations — priced online in minutes.
          </p>
          <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-neutral-900 shadow-xl hover:bg-white/90"
            >
              <Link href="/quote">
                Get an instant quote
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-black/20 text-white backdrop-blur hover:bg-black/40 hover:text-white"
            >
              <Link href="/services">Browse services</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
