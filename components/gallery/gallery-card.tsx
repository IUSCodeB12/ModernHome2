"use client";

import Image from "next/image";
import { Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/lib/gallery/data";

/**
 * One project in the mosaic. The whole tile is the control that opens the
 * lightbox — the photograph is the subject here, so it gets the click target
 * rather than a separate "view" affordance tucked into a corner.
 *
 * Deliberately holds no link to the service page. A card is already a button,
 * and an anchor nested inside one is invalid and unreachable by keyboard; the
 * quote link lives in the lightbox instead, where it has room to be a real CTA.
 */
export function GalleryCard({
  item,
  index,
  wide,
  onOpen,
}: {
  item: GalleryItem;
  /** Position in the filtered list — the handle the grid focuses on close. */
  index: number;
  /** Wide tiles set their row's height; narrow tiles stretch to match it. */
  wide: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-gallery-index={index}
      aria-label={`View ${item.title} full size`}
      className={cn(
        "card-lift group relative block w-full overflow-hidden rounded-2xl border bg-card text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Below lg the grid is 1- or 2-up with no wide/narrow pairing, so every
        // tile holds the same ratio — mixing them there just makes rows ragged.
        // The mosaic, and the stretch that lets a narrow tile match its wide
        // partner's height, both start at lg where the 6-column grid does.
        wide ? "aspect-[4/3] lg:aspect-[16/10]" : "aspect-[4/3] lg:aspect-auto lg:h-full"
      )}
    >
      {item.after_image_url || item.before_image_url ? (
        <Image
          src={item.after_image_url || item.before_image_url}
          alt={item.title}
          fill
          sizes={
            wide
              ? "(min-width: 1024px) 760px, (min-width: 640px) 50vw, 100vw"
              : "(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
          }
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900" />
      )}

      {/* Bottom-weighted scrim. Always painted rather than revealed on hover —
          the caption has to be readable on touch, where there is no hover. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 from-2% via-black/25 via-38% to-transparent to-62%" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
        {item.services && (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brand">
            {item.services.name}
          </p>
        )}
        <p
          className={cn(
            "font-display text-white",
            wide ? "mt-1.5 text-xl sm:text-2xl" : "mt-1 text-lg"
          )}
        >
          {item.title}
        </p>
      </div>

      {/* Expand cue: pointer-only, and only once the tile is hovered or focused. */}
      <span className="pointer-events-none absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <Expand className="size-4" />
      </span>
    </button>
  );
}
