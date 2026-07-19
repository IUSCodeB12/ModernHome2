"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSceneMode } from "@/hooks/use-scene-mode";
import { TOUR_STOPS } from "@/lib/three/tour";
import { cn } from "@/lib/utils";

const RoomTourCanvas = dynamic(
  () => import("@/components/three/room-tour-canvas"),
  { ssr: false }
);

const SERVICE_STOPS = TOUR_STOPS.filter((s) => s.slug);

function quoteHref(slug: string | null): string {
  return slug ? `/quote?service=${slug}` : "/quote";
}

/** The scroll-scrubbed 3D tour (capable devices). */
function InteractiveTour() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mount the canvas as the section approaches; only render frames while
  // it's actually on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
        setActive(entry.isIntersecting);
      },
      { rootMargin: "40% 0px 40% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Map scroll position across the tall container to progress 0..1.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const p = scrollable > 0 ? -rect.top / scrollable : 0;
      const clamped = Math.min(Math.max(p, 0), 1);
      progressRef.current = clamped;
      setProgress(clamped);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const segments = TOUR_STOPS.length - 1;

  return (
    <div
      ref={sectionRef}
      style={{ height: `${TOUR_STOPS.length * 100}vh` }}
      className="relative"
      aria-label="Interactive room tour"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#171513]">
        {mounted && <RoomTourCanvas progressRef={progressRef} active={active} />}

        {/* Copy cards — cross-fade as the camera reaches each stop. */}
        <div className="pointer-events-none absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl items-center px-4">
            <div className="relative w-full">
              {TOUR_STOPS.map((stop, i) => {
                const center = i / segments;
                const dist = Math.abs(progress - center);
                const opacity = Math.max(0, 1 - dist * segments * 1.35);
                const alignRight = i % 2 === 1;
                if (opacity <= 0.01) return null;
                return (
                  <div
                    key={stop.id}
                    style={{
                      opacity,
                      transform: `translateY(${(1 - opacity) * 18}px)`,
                    }}
                    className={cn(
                      "absolute top-1/2 max-w-sm -translate-y-1/2 rounded-2xl bg-black/40 p-6 backdrop-blur-sm",
                      alignRight ? "right-0 text-right" : "left-0"
                    )}
                  >
                    {stop.eyebrow && (
                      <p className="text-xs font-medium uppercase tracking-widest text-white/60">
                        {stop.eyebrow}
                      </p>
                    )}
                    <h3 className="font-display mt-2 text-3xl text-white drop-shadow sm:text-5xl">
                      {stop.title}
                    </h3>
                    <p className="mt-3 text-white/75">{stop.body}</p>
                    {stop.slug && (
                      <div
                        className={cn(
                          "pointer-events-auto mt-4 flex items-center gap-3",
                          alignRight && "justify-end"
                        )}
                      >
                        <Button asChild className="bg-white text-neutral-900 hover:bg-white/90">
                          <Link href={quoteHref(stop.slug)}>
                            Get this quoted <ArrowRight />
                          </Link>
                        </Button>
                        <span className="text-sm font-medium text-white/70">
                          {stop.priceHint}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress dots */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {TOUR_STOPS.map((stop, i) => {
              const center = i / segments;
              const on = Math.abs(progress - center) < 0.5 / segments;
              return (
                <span
                  key={stop.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    on ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reduced-motion / low-end fallback: stacked cards, no scroll scrubbing. */
function StaticTour() {
  return (
    <section className="bg-[#171513] py-20">
      <div className="mx-auto max-w-5xl px-4">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-white/60">
          A room we built
        </p>
        <h2 className="mt-2 text-center text-3xl font-bold text-white sm:text-4xl">
          Everything in here, we install
        </h2>
        <div className="mt-12 space-y-4">
          {SERVICE_STOPS.map((stop) => (
            <div
              key={stop.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-white/60">
                  {stop.eyebrow}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">{stop.title}</h3>
                <p className="mt-1 max-w-md text-sm text-white/70">{stop.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium text-white/70">{stop.priceHint}</span>
                <Button asChild className="bg-white text-neutral-900 hover:bg-white/90">
                  <Link href={quoteHref(stop.slug)}>
                    Quote <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RoomTour() {
  const mode = useSceneMode();
  // Render the lightweight static tour until we know the device is capable,
  // so first paint and low-end devices never pay for the canvas.
  if (mode === "3d") return <InteractiveTour />;
  return <StaticTour />;
}
