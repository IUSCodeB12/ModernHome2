"use client";

/* eslint-disable @next/next/no-img-element -- public bucket URLs, no next/image domain config */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/home/section-header";
import type { ShowcasePanel } from "@/lib/home/data";

/**
 * Scroll-driven service showcase — the photographic successor to the 3D room
 * tour. A pinned photo column crossfades to whichever panel is currently
 * centred in the viewport, so real job photography carries the pitch instead
 * of a stylised render.
 *
 * Driven by IntersectionObserver rather than a scroll handler: no per-frame
 * work, and it degrades to a plain stacked list when the layout is single
 * column (mobile), where each panel simply carries its own photo.
 */
export function ServiceShowcase({ panels }: { panels: ShowcasePanel[] }) {
  const [active, setActive] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (panels.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Whichever tracked panel is most visible wins.
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const i = panelRefs.current.indexOf(best.target as HTMLDivElement);
        if (i >= 0) setActive(i);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] }
    );
    panelRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [panels.length]);

  if (panels.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 lg:py-28">
      <SectionHeader
        number="02"
        eyebrow="What we install"
        title="Five ways to finish a room"
      />

      <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-14">
        {/* Pinned photo column — desktop only */}
        <div className="hidden md:block">
          <div className="sticky top-28">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-[#1a1714] shadow-elev-3">
              {panels.map((panel, i) => (
                <div
                  key={panel.id}
                  className="absolute inset-0 transition-opacity duration-700 ease-out"
                  style={{ opacity: i === active ? 1 : 0 }}
                  aria-hidden
                >
                  {panel.image_url ? (
                    <img
                      src={panel.image_url}
                      alt=""
                      className="size-full object-cover"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <PhotoPlaceholder />
                  )}
                </div>
              ))}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(20,18,16,0.45))]" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[#c9a24b]/20" />

              {/* Position marker, mirroring the hero's index */}
              <p className="absolute bottom-5 right-5 font-mono text-xs tabular-nums text-white/70">
                <span className="text-white">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <span className="mx-1 text-white/40">/</span>
                {String(panels.length).padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>

        {/* Copy column */}
        <div className="flex flex-col gap-16 md:gap-0">
          {panels.map((panel, i) => (
            <div
              key={panel.id}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className="md:flex md:min-h-[70vh] md:flex-col md:justify-center"
            >
              {/* Mobile carries its own photo — there's no room to pin one */}
              <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-[#1a1714] md:hidden">
                {panel.image_url ? (
                  <img
                    src={panel.image_url}
                    alt={panel.title}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <PhotoPlaceholder />
                )}
              </div>

              {panel.eyebrow && (
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-brand">
                  {panel.eyebrow}
                </p>
              )}
              <h3 className="mt-3 font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
                {panel.title}
              </h3>
              {panel.body && (
                <p className="mt-4 max-w-md text-base text-muted-foreground">
                  {panel.body}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {panel.slug && (
                  <Button asChild>
                    <Link href={`/quote?service=${panel.slug}`}>
                      Get this quoted <ArrowRight />
                    </Link>
                  </Button>
                )}
                {panel.price_hint && (
                  <span className="text-sm text-muted-foreground">
                    {panel.price_hint}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Warm gradient stand-in for a panel that has copy but no photo yet. */
function PhotoPlaceholder() {
  return (
    <div className="absolute inset-0 bg-[#1a1714]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_35%,rgba(255,177,99,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(201,162,75,0.12),transparent_55%)]" />
    </div>
  );
}
