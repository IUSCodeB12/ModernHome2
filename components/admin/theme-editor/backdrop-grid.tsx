"use client";

import { Check } from "lucide-react";
import {
  BACKDROPS,
  type BackdropId,
  backdropCss,
  backdropSize,
} from "@/lib/theme/backdrops";
import { formatOklch } from "@/lib/theme/oklch";
import type { DerivedPalette } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";

/**
 * Backdrop picker. Each tile paints the real recipe over the real palette, so
 * it is the design itself at thumbnail size rather than an icon standing in for
 * it — which matters here more than for colours, because these are the kind of
 * effect you cannot picture from a name.
 */
export function BackdropGrid({
  value,
  palette,
  onPick,
}: {
  value: BackdropId;
  /** The mode currently being previewed, so tiles match what's on screen. */
  palette: DerivedPalette;
  onPick: (id: BackdropId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {BACKDROPS.map((backdrop) => {
        const selected = value === backdrop.id;
        return (
          <button
            key={backdrop.id}
            type="button"
            onClick={() => onPick(backdrop.id)}
            aria-pressed={selected}
            title={backdrop.description}
            className={cn(
              "group overflow-hidden rounded-lg border text-left transition-all duration-200 ease-[var(--ease-out-soft)] hover:border-foreground/25",
              selected
                ? "border-foreground/40 ring-1 ring-foreground/10"
                : "border-border"
            )}
          >
            <span
              aria-hidden
              className="relative block h-14 w-full"
              style={{
                background: formatOklch(palette.background),
                backgroundImage: backdropCss(palette, backdrop.id),
                // Tiles are 56px tall, so a 140vh tile would show one sliver.
                // Scaled to the swatch instead: the composition, in miniature.
                backgroundSize:
                  backdropSize(backdrop.id) === "auto" ? "auto" : "100% 100%",
                backgroundRepeat: "repeat",
              }}
            >
              {selected && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="block px-2 py-1.5 text-xs font-medium">
              {backdrop.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
