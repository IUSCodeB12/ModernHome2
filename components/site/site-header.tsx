"use client";

/*
 * Modern editorial header — design language adapted from eldoraui's
 * "Header Navbar" on 21st.dev (@karthikmudunuri): the PlusGrid corner
 * framing + animated mobile disclosure. Rebuilt with our existing stack
 * (framer-motion + lucide, no headlessui/heroicons) and brand styling.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/site/user-menu";
import { Logo } from "@/components/site/logo";
import { LightSwitch } from "@/components/site/light-switch";
import { useSessionEmail } from "@/hooks/use-session-email";
import { cn } from "@/lib/utils";

// Lazy — framer-motion loads only on the first mobile-menu tap.
const MobileMenu = dynamic(() => import("@/components/site/mobile-menu"), {
  ssr: false,
});

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/portal", label: "My Bookings" },
];

/**
 * The fixture. A hairline of light across the top of the header, brightest at
 * centre, with a soft wash spilling down over the page beneath it — so the
 * light in "lights on" has a visible source rather than the palette simply
 * changing. Hidden entirely in the dark, and inert to pointers.
 */
function LightBar() {
  return (
    /*
     * Always mounted, revealed by opacity rather than `display`, so it can
     * transition — and delayed ~180ms behind the switch so the sequence reads
     * lamp first, then fixture. Toggling `display` made both snap at once,
     * which lost the cause and effect the whole idea depends on.
     */
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 opacity-100 transition-opacity duration-[900ms] ease-[var(--ease-out-soft)] delay-[180ms] dark:opacity-0 dark:delay-0 dark:duration-300 motion-reduce:transition-none"
    >
      <div className="h-px w-full bg-[linear-gradient(90deg,transparent,var(--brand)_35%,oklch(0.97_0.06_92)_50%,var(--brand)_65%,transparent)] opacity-80" />
      <div className="mx-auto h-24 w-[70%] bg-[radial-gradient(ellipse_at_top,oklch(0.92_0.08_88/0.28),transparent_70%)]" />
    </div>
  );
}

/** Small "+" mark that sits on the grid rails' corners (Radiant-style). */
function PlusMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute z-10 text-brand/60", className)}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
}

export function SiteHeader() {
  // Read in the browser, not passed from the layout — see the hook for why.
  const email = useSessionEmail();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  /**
   * True while the header sits over the homepage's dark hero. The hero fills
   * the viewport below the header, so leaving the ivory glass in place put a
   * white bar across the top of a near-black image.
   */
  const [overHero, setOverHero] = useState(false);
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      // Hand back to the glass treatment before the hero has fully left, so
      // the swap happens against dark pixels rather than mid-air.
      setOverHero(onHome && window.scrollY < window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onHome]);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,color] duration-500",
        overHero
          ? "bg-transparent"
          : "bg-background/70 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-background/55",
        scrolled && !overHero ? "shadow-[var(--shadow-elev-1)]" : ""
      )}
    >
      <LightBar />

      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Editorial grid rails + corner plus marks */}
        <div className={cn("relative border-x", overHero ? "border-foreground/12 dark:border-white/15" : "border-border/70")}>
          <PlusMark className="-left-[5px] -top-[5px]" />
          <PlusMark className="-right-[5px] -top-[5px]" />
          <PlusMark className="-left-[5px] -bottom-[5px]" />
          <PlusMark className="-right-[5px] -bottom-[5px]" />

          <div className={cn("flex h-16 items-center justify-between border-y px-4", overHero ? "border-foreground/12 dark:border-white/15" : "border-border/70")}>
            <Logo href="/" priority tone={overHero ? "onHero" : "default"} />

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200",
                      overHero
                        ? active
                          ? "text-foreground dark:text-white"
                          : "text-muted-foreground hover:text-foreground dark:text-white/65 dark:hover:text-white"
                        : active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand transition-all duration-300 ease-[var(--ease-out-soft)]",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </Link>
                );
              })}
              {/* `undefined` means we don't know yet — don't flash "Sign in"
                  at someone who turns out to be signed in. */}
              {email === null && (
                <Link
                  href="/login"
                  className={cn("rounded-full px-3 py-2 text-sm font-medium transition-colors", overHero ? "text-muted-foreground hover:text-foreground dark:text-white/65 dark:hover:text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  Sign in
                </Link>
              )}
              <Button
                asChild
                size="sm"
                variant={overHero ? "outline" : "default"}
                className={cn(
                  "ml-1 rounded-full",
                  // Over the hero the solid dark pill disappears into the
                  // photograph, so it becomes an outline in white.
                  overHero &&
                    "border-foreground/30 bg-transparent text-foreground hover:bg-foreground/5 hover:text-foreground dark:border-white/40 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                <Link href="/quote">
                  Get a quote
                  <ArrowRight />
                </Link>
              </Button>
              <LightSwitch className="ml-3" />
              {email && (
                <div className="ml-2">
                  <UserMenu email={email} />
                </div>
              )}
            </nav>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 md:hidden">
              <LightSwitch />
              <button
              type="button"
              onClick={() => {
                setEverOpened(true);
                setOpen((o) => !o);
              }}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className={cn("flex size-10 items-center justify-center rounded-lg transition-colors md:hidden", overHero ? "text-foreground hover:bg-foreground/10 dark:text-white dark:hover:bg-white/10" : "text-foreground hover:bg-accent")}
            >
                {/* 1.5 to match the lamp and the feature icons — lucide defaults to 2,
                    which left the menu heavier than everything around it. */}
                {open ? (
                  <X className="size-5" strokeWidth={1.5} />
                ) : (
                  <Menu className="size-5" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile disclosure menu — mounted (and framer-motion loaded) only
          after the first tap. */}
      {everOpened && <MobileMenu open={open} links={navLinks} email={email ?? null} />}
    </header>
  );
}
