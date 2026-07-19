"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slim floating "Get an instant quote" pill that appears once the visitor
 * scrolls past the hero — conversion is always one tap away. Hidden on the
 * quote wizard itself.
 */
export function FloatingCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/quote")) return null;

  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-40 transition-all duration-500 ease-[var(--ease-out-soft)]",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <Link
        href="/quote"
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elev-3)] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
      >
        Get an instant quote
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
