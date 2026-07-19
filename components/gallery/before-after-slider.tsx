"use client";

/* eslint-disable @next/next/no-img-element -- gallery uses public bucket URLs */

import { useCallback, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/** One half of the reveal — real image, or a labelled gradient placeholder. */
function Layer({
  url,
  label,
  placeholderClass,
}: {
  url: string;
  label: string;
  placeholderClass: string;
}) {
  return (
    <div className="absolute inset-0">
      {url ? (
        <img src={url} alt={label} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center", placeholderClass)}>
          <span className="text-sm font-medium text-white/70">{label}</span>
        </div>
      )}
    </div>
  );
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: {
  beforeUrl: string;
  afterUrl: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // % revealed of the "after" layer
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, pct)));
  }, []);

  // Single-image item (no "after" recorded): show the one image, no slider.
  // Note: null means "no after"; an empty string is a placeholder-backed pair.
  if (afterUrl === null) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        <Layer url={beforeUrl} label="Completed" placeholderClass="bg-gradient-to-br from-neutral-700 to-neutral-900" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] touch-none select-none overflow-hidden rounded-t-2xl"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) setFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    >
      {/* After (full) underneath */}
      <Layer url={afterUrl} label="After" placeholderClass="bg-gradient-to-br from-amber-700 to-neutral-900" />

      {/* Before (clipped to the slider position) on top */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Layer url={beforeUrl} label="Before" placeholderClass="bg-gradient-to-br from-neutral-500 to-neutral-700" />
      </div>

      {/* Corner labels */}
      <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
        Before
      </span>
      <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
        After
      </span>

      {/* Handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Reveal before and after"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
          if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
        }}
        className="absolute inset-y-0 z-10 -ml-5 flex w-10 cursor-ew-resize items-center justify-center outline-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/90" />
        <div className="flex size-8 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg ring-2 ring-black/5">
          <MoveHorizontal className="size-4" />
        </div>
      </div>
    </div>
  );
}
