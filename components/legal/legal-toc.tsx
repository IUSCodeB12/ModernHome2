"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; label: string };

/**
 * Sticky contents rail with scroll-spy, desktop only.
 *
 * Uses one IntersectionObserver over the section elements rather than a scroll
 * handler, so there's no per-frame work. The bottom rootMargin means a section
 * only becomes "current" once it's genuinely in the reading area, otherwise the
 * highlight races ahead of the reader near the end of the document.
 */
export function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-88px 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Contents" className="flex flex-col">
      <p className="mb-4 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Contents
      </p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          aria-current={active === item.id ? "true" : undefined}
          className={cn(
            "border-r-2 py-2 pr-4 text-[0.8rem] leading-snug transition-colors",
            active === item.id
              ? "border-brand font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
