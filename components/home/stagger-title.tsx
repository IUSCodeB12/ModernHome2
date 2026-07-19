"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Word-by-word rise reveal for display headlines. Each word slides up from
 * behind a clip as the title scrolls into view — the editorial version of
 * a fade-in. Reduced-motion renders instantly.
 */
export function StaggerTitle({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <span ref={ref} className={cn("inline", className)}>
      {words.map((word, i) => (
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span
              className="inline-block transition-transform duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none"
              style={{
                transform: shown ? "translateY(0)" : "translateY(110%)",
                transitionDelay: `${i * 70}ms`,
              }}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
