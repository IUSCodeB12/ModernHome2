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
import { HeroPull } from "@/components/home/hero-pull";
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
      <HeroPull>
      <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        {/* Stage — behind the panel on mobile, beside it from lg. */}
        <div className="absolute inset-0 lg:relative lg:order-2 lg:inset-auto">
          <HeroStage slides={slides} />
        </div>

        {/* Content panel — bottom-anchored below lg so the photograph gets the
            top of the fold and the copy lands on the dense end of the stage's
            scrim. Centred in its own column from lg, as before. */}
        <div className="hero-pull-copy relative z-10 flex flex-col justify-end px-6 pb-24 pt-16 sm:px-10 lg:order-1 lg:justify-center lg:pb-20 lg:pt-20 lg:px-14 xl:px-20">
          {/*
           * The halo is the mobile safety net. Below lg this copy sits directly
           * on an editable photograph, and gold-on-gold (an eyebrow over a brass
           * pendant) or dark-on-dark is one slide upload away. A glow in the
           * *background* token reads correctly in both themes — a pale halo
           * around dark text with the lights on, a dark one around pale text
           * with them off — so it holds whatever gets curated. Off from lg,
           * where the panel has its own solid background.
           */}
          <p className="flex items-center gap-4 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-brand [text-shadow:0_0_16px_var(--background),0_0_5px_var(--background)] lg:[text-shadow:none]">
            <span aria-hidden className="h-px w-10 bg-brand/70" />
            Luxury interior design
          </p>

          <h1
            className="mt-7 max-w-[13ch] text-balance text-[2.75rem] leading-[1.04] tracking-[-0.02em] [text-shadow:0_1px_28px_var(--background)] sm:text-6xl lg:[text-shadow:none] xl:text-[4.25rem]"
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

          {/* Desktop only. Six labels cost ~140px of a 748px mobile fold to
              restate a menu that `services-grid.tsx` already renders further
              down the page — the hero's job on a phone is one promise and one
              action. */}
          <ul className="mt-10 hidden max-w-lg grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-2.5">
                <feature.icon className="size-[1.15rem] shrink-0 text-brand" strokeWidth={1.5} />
                <span className="text-[0.9rem] text-foreground/85">{feature.label}</span>
              </li>
            ))}
          </ul>

          {/* One button, one link. Two stacked outlined boxes on a phone is
              where this stops reading as a studio and starts reading as a SaaS
              signup. The secondary keeps a 44px target despite being text. */}
          <div className="mt-9 flex flex-col items-start gap-4 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/quote"
              className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-sm bg-brand px-8 text-[0.95rem] font-medium text-brand-foreground transition-colors hover:bg-brand/90 sm:w-auto sm:justify-start"
            >
              Get free quote
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex h-11 items-center text-[0.95rem] font-medium text-foreground underline decoration-foreground/30 underline-offset-[7px] transition-colors hover:decoration-foreground sm:h-14 sm:rounded-sm sm:border sm:border-foreground/25 sm:px-8 sm:no-underline sm:hover:border-foreground/50 sm:hover:bg-foreground/5"
            >
              View projects
            </Link>
          </div>

          {/* A wrapping inline row below lg, the original 4-up grid from sm.
              No separator characters: the row wraps to two lines at 375px and
              a `::before` dot has no way to know it has become the first item
              on a line, so it strands one at the start of the second row. The
              leading icons already do the separating. */}
          <ul className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:mt-14 sm:grid sm:grid-cols-4 sm:gap-x-6 sm:gap-y-6">
            {TRUST.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-1.5 sm:flex-col sm:items-start sm:gap-2 sm:text-left"
              >
                {item.stars ? (
                  <span className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-brand text-brand" />
                    ))}
                  </span>
                ) : (
                  <item.icon className="size-[1.15rem] text-brand" strokeWidth={1.5} />
                )}
                <span className="text-[0.68rem] leading-tight text-muted-foreground sm:text-[0.72rem]">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Scroll cue — sits over the photograph on desktop, centred on mobile. */}
      <div className="hero-pull-copy pointer-events-none absolute inset-x-0 bottom-7 z-10 flex flex-col items-center gap-2.5 lg:left-auto lg:right-0 lg:w-[58%]">
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
      </HeroPull>
    </section>
  );
}
