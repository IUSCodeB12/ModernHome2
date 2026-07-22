"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy-load the 3D room canvas — never server-rendered, never in the main bundle.
const HeroRoomCanvas = dynamic(() => import("@/components/home/hero-room-canvas"), {
  ssr: false,
  loading: () => <RoomPoster />,
});

/** Warm dark placeholder the room canvas fades into (LCP-friendly, no image). */
function RoomPoster() {
  return (
    <div className="absolute inset-0 bg-[#1a1714]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_35%,rgba(255,177,99,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(201,162,75,0.12),transparent_55%)]" />
    </div>
  );
}

/** Low-end / reduced-motion → static poster, no 3D. */
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

/** Mount the heavy 3D bundle only on first intent / after idle — keeps three.js out of load. */
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
    const timer = window.setTimeout(start, 6000);
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
    <section className="relative w-full overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 md:grid-cols-2 md:gap-8 lg:py-24">
        {/* Editorial column */}
        <div className="order-2 md:order-1">
          <p className="w-fit text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand">
            Premium installs · Melbourne
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Your home,
            <br />
            done properly.
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            TV mounting, cabinets, LED lighting and heating — fixed-price,
            fully insured, and booked online in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/quote">
                Get an instant quote <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/services">Browse services</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-brand text-brand" /> 4.9 · 200+ jobs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand" /> Licensed &amp; insured
            </span>
            <span>No callout fees</span>
          </div>
        </div>

        {/* Room panel */}
        <div className="order-1 md:order-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-[#1a1714] shadow-elev-3 md:aspect-[5/6] lg:aspect-[4/3]">
            {mode === "3d" && sceneReady ? (
              <Suspense fallback={<RoomPoster />}>
                <div className="absolute inset-0">
                  <HeroRoomCanvas />
                </div>
              </Suspense>
            ) : (
              <RoomPoster />
            )}
            {/* Brass hairline accent */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#c9a24b]/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
