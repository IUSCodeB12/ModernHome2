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
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-background/70 backdrop-blur-md backdrop-saturate-150 transition-shadow duration-300 supports-[backdrop-filter]:bg-background/55",
        scrolled ? "shadow-[var(--shadow-elev-1)]" : ""
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        {/* Editorial grid rails + corner plus marks */}
        <div className="relative border-x border-border/70">
          <PlusMark className="-left-[5px] -top-[5px]" />
          <PlusMark className="-right-[5px] -top-[5px]" />
          <PlusMark className="-left-[5px] -bottom-[5px]" />
          <PlusMark className="-right-[5px] -bottom-[5px]" />

          <div className="flex h-16 items-center justify-between border-y border-border/70 px-4">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform duration-300 ease-[var(--ease-spring)] group-hover:rotate-3 group-hover:scale-105">
                MH
              </span>
              <span className="font-display text-lg tracking-tight">ModernHome</span>
            </Link>

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
                      active
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
              <Button asChild size="sm" className="ml-1 rounded-full">
                <Link href="/quote">
                  Get a quote
                  <ArrowRight />
                </Link>
              </Button>
            </nav>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => {
                setEverOpened(true);
                setOpen((o) => !o);
              }}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-accent md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile disclosure menu — mounted (and framer-motion loaded) only
          after the first tap. */}
      {everOpened && <MobileMenu open={open} links={navLinks} />}
    </header>
  );
}
