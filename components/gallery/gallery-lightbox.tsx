"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { BeforeAfterSlider } from "@/components/gallery/before-after-slider";
import type { GalleryItem } from "@/lib/gallery/data";

/**
 * Full-size viewer for one project, with the filtered set behind it so the
 * arrows walk the same list the visitor is looking at.
 *
 * `index === null` closes it. Keeping the index (rather than the item) as the
 * state means prev/next is arithmetic, and a filter change that shortens the
 * list is handled by the caller closing the dialog.
 *
 * Radix owns the focus trap, scroll lock and Escape; only the arrow keys are
 * ours. They are bound on the content rather than the window so they can never
 * fire while the dialog is closed.
 */
export function GalleryLightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: GalleryItem[];
  index: number | null;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const item = index === null ? null : items[index];
  if (!item || index === null) return null;

  const go = (delta: number) =>
    onIndexChange((index + delta + items.length) % items.length);

  // A pair is only a pair when both halves exist. `after_image_url` is null for
  // single-image projects, which is the common case here.
  const isPair = item.after_image_url !== null && item.before_image_url !== "";
  const display = item.after_image_url || item.before_image_url;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        className="max-w-[calc(100%-1rem)] gap-0 overflow-hidden border-white/10 bg-neutral-950 p-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Project {index + 1} of {items.length}. Use the left and right arrow
          keys to move between projects.
        </DialogDescription>

        {/*
         * Ratio-driven rather than a fixed viewport height. The photographs are
         * mostly 3:2, so a tall `vh` box left them stranded in a field of black;
         * a 3:2 stage fits them edge to edge and letterboxes only the odd
         * portrait shot. Mobile gets 4:3 because 3:2 across a phone's width is
         * barely 200px of picture. `max-h` keeps the footer on screen either way.
         */}
        <div className="relative aspect-[4/3] max-h-[70vh] w-full bg-black sm:aspect-[3/2]">
          {isPair ? (
            <BeforeAfterSlider
              beforeUrl={item.before_image_url}
              afterUrl={item.after_image_url}
              className="h-full rounded-none"
            />
          ) : display ? (
            <Image
              /*
               * Keyed so paging remounts the element instead of swapping `src`
               * on it. Reusing one <img> let the incoming photo decode over the
               * outgoing one, and a progressive JPEG made that visible as a
               * torn frame — half of one project above half of the next. A
               * remount shows the black stage for a beat instead.
               */
              key={display}
              src={display}
              alt={item.title}
              fill
              // Letterboxed rather than cropped: this is the view that exists
              // to show the whole photograph.
              className="object-contain"
              sizes="(min-width: 640px) 896px, 100vw"
              loading="eager"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900" />
          )}

          {items.length > 1 && (
            <>
              <ArrowButton side="left" onClick={() => go(-1)} />
              <ArrowButton side="right" onClick={() => go(1)} />
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 px-5 py-4">
          <div className="min-w-0">
            {item.services && (
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brand">
                {item.services.name}
              </p>
            )}
            <p className="mt-1 font-display text-lg text-white sm:text-xl">
              {item.title}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <span className="text-xs tabular-nums text-white/45">
              {index + 1} / {items.length}
            </span>
            <Link
              href={item.services?.slug ? `/services/${item.services.slug}` : "/quote"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-brand"
            >
              Get a price for this
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous project" : "Next project"}
      className={`absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon className="size-5" />
    </button>
  );
}
