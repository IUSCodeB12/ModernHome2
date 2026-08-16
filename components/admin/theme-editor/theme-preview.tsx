"use client";

import { ArrowRight, Check, Star } from "lucide-react";
import { themeToStyle } from "@/lib/theme/css";
import type { DerivedTheme } from "@/lib/theme/tokens";

/**
 * The live preview. Not an iframe.
 *
 * CSS custom properties cascade to a subtree, so setting the derived tokens on
 * one wrapper gives these components exactly the isolation a separate document
 * would — the admin chrome outside keeps its own palette, because it reads the
 * same variable names from `:root`. What an iframe would add is a real viewport
 * for responsive testing and the ability to render actual site routes; what it
 * costs is a second document to keep in sync and a postMessage bridge between
 * every keystroke and the repaint. For a component sample, the wrapper wins on
 * every axis, and updates land in the same frame as the input.
 *
 * Everything below is styled with the same semantic utilities the real site
 * uses — `bg-card`, `text-muted-foreground`, `rounded-lg` — which is what makes
 * this a preview rather than an illustration. No `dark:` variants: dark is a
 * parallel token set, so the same markup renders both modes.
 */
export function ThemePreview({
  theme,
  mode,
}: {
  theme: DerivedTheme;
  mode: "light" | "dark";
}) {
  const style = themeToStyle(theme[mode], {
    radius: theme.radius,
    fonts: theme.fonts,
  });

  return (
    <div
      style={{ ...style, fontFamily: "var(--theme-font-body)" }}
      className="min-h-full bg-background text-foreground transition-colors duration-300"
    >
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span
          className="text-base font-semibold tracking-tight"
          style={{ fontFamily: "var(--theme-font-display)" }}
        >
          AceStudio55
        </span>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <span>Services</span>
          <span>Gallery</span>
          <span className="text-foreground">My bookings</span>
        </nav>
        <button className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground">
          Get a quote
        </button>
      </header>

      <div className="space-y-8 px-6 py-8">
        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">
            Luxury interior design
          </p>
          <h1
            className="max-w-[18ch] text-4xl leading-[1.05] tracking-[-0.02em]"
            style={{ fontFamily: "var(--theme-font-display)" }}
          >
            Crafted spaces. Timeless living.
          </h1>
          <p className="max-w-[46ch] text-sm text-muted-foreground">
            Fixed-price quotes online in minutes. Pick a two-hour arrival
            window and track the job from your portal.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Get free quote <ArrowRight className="size-4" />
            </button>
            <button className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium">
              View projects
            </button>
            <button className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground">
              Learn more
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold">TV Wall Mounting</h3>
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[0.7rem] font-medium text-brand">
                Popular
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Any wall type, with optional in-wall cable concealment.
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums">$149</p>
          </article>

          <article className="space-y-3 rounded-xl border border-border bg-muted p-4">
            <label className="block text-xs font-medium">Your suburb</label>
            <input
              readOnly
              value="Brunswick VIC 3056"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-[3px]"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="size-3.5 text-brand" />
              No callout fee inside 20km
            </div>
            <div className="flex items-center gap-1 pt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-brand text-brand" />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">
                100+ happy clients
              </span>
            </div>
          </article>
        </section>

        <section className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
          <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            Secondary
          </span>
          <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
            Accent
          </span>
          <span className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-white">
            Cancel booking
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            Muted caption text
          </span>
        </section>
      </div>
    </div>
  );
}
