import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Flame,
  Lightbulb,
  PanelsTopLeft,
  Ruler,
  ShieldCheck,
  Sofa,
  Star,
  Tv,
  UserRound,
} from "lucide-react";
import { HeroStage } from "@/components/home/hero-stage";
import type { HeroSlide } from "@/lib/home/data";

/**
 * Split-screen cinematic hero: content panel left, the work right.
 *
 * Replaces an editorial hero that sat inside the page container with heavy
 * vertical padding, so the fold opened with whitespace and the photograph read
 * as a slide in a gallery. This one goes edge to edge, fills the viewport
 * below the header, and drops every control — see `hero-stage.tsx` for why.
 *
 * Follows the light switch. Everything here reads from tokens rather than the
 * hardcoded near-black it was built with, so turning the lights on brightens
 * the fold too — otherwise the one screen everybody sees would be the one
 * screen the switch didn't touch.
 */

/**
 * Marketing copy, not the bookable catalogue.
 *
 * NOTE: `Electric Fireplaces`, `Bespoke Joinery` and `Premium Fit-outs` do not
 * exist as services in the quote wizard — someone who arrives for a fireplace
 * reaches a wizard that can't quote one. Either add the services or change
 * these labels; don't leave the hero promising work the funnel can't take.
 */
const FEATURES = [
  { icon: Tv, label: "TV Feature Walls" },
  { icon: Flame, label: "Electric Fireplaces" },
  { icon: PanelsTopLeft, label: "Custom Cabinetry" },
  { icon: Lightbulb, label: "LED Lighting" },
  { icon: Ruler, label: "Bespoke Joinery" },
  { icon: Sofa, label: "Premium Fit-outs" },
] as const;

/**
 * NOTE: "100+ Happy Clients" has no data source behind it, and "5 Year
 * Warranty" contradicts /legal/warranty, where the period is still marked
 * to-be-confirmed. Both are claims a customer can hold you to.
 */
type TrustItem = {
  icon: typeof Star;
  label: string;
  /** Renders five filled stars in place of the icon. */
  stars?: boolean;
};

const TRUST: TrustItem[] = [
  { icon: Star, label: "100+ Happy Clients", stars: true },
  { icon: ShieldCheck, label: "5 Year Warranty" },
  { icon: BadgeCheck, label: "Australian Made" },
  { icon: UserRound, label: "Free Consultation" },
];

export function Hero({ slides = [] }: { slides?: HeroSlide[] }) {
  return (
    <section className="relative isolate w-full bg-background text-foreground">
      <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        {/* Stage — behind the panel on mobile, beside it from lg. */}
        <div className="absolute inset-0 lg:relative lg:order-2 lg:inset-auto">
          <HeroStage slides={slides} />
        </div>

        {/* Content panel */}
        <div className="relative z-10 flex flex-col justify-center bg-gradient-to-b from-background/92 via-background/[0.88] to-background/92 px-6 py-16 sm:px-10 lg:order-1 lg:bg-none lg:px-14 lg:py-20 xl:px-20">
          <p className="flex items-center gap-4 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-brand">
            <span aria-hidden className="h-px w-10 bg-brand/70" />
            Luxury interior design
          </p>

          <h1
            className="mt-7 max-w-[13ch] text-balance text-[2.75rem] leading-[1.04] tracking-[-0.02em] sm:text-6xl xl:text-[4.25rem]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 400 }}
          >
            Crafted spaces.
            <br />
            Timeless living.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            We design and build premium interiors that reflect your lifestyle
            and elevate everyday living.
          </p>

          <ul className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-2.5">
                <feature.icon className="size-[1.15rem] shrink-0 text-brand" strokeWidth={1.5} />
                <span className="text-[0.9rem] text-foreground/85">{feature.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-11 flex flex-wrap items-center gap-4">
            <Link
              href="/quote"
              className="group inline-flex h-14 items-center gap-3 rounded-sm bg-brand px-8 text-[0.95rem] font-medium text-brand-foreground transition-colors hover:bg-brand/90"
            >
              Get free quote
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex h-14 items-center rounded-sm border border-foreground/25 px-8 text-[0.95rem] font-medium text-foreground transition-colors hover:border-foreground/50 hover:bg-foreground/5"
            >
              View projects
            </Link>
          </div>

          <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            {TRUST.map((item) => (
              <li key={item.label} className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                {item.stars ? (
                  <span className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-brand text-brand" />
                    ))}
                  </span>
                ) : (
                  <item.icon className="size-[1.15rem] text-brand" strokeWidth={1.5} />
                )}
                <span className="text-[0.72rem] leading-tight text-muted-foreground">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Scroll cue — sits over the photograph on desktop, centred on mobile. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-2.5 lg:left-auto lg:right-0 lg:w-[58%]">
        <span
          aria-hidden
          className="flex h-7 w-[1.1rem] items-start justify-center rounded-full border border-foreground/35 pt-1.5 lg:border-white/35"
        >
          <span className="h-1.5 w-px animate-bounce bg-foreground/70 lg:bg-white/70" />
        </span>
        <span className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-foreground/50 lg:text-white/50">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
