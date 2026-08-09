"use client";

import { useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/home/reveal";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { cn } from "@/lib/utils";
import type { GalleryFilter, GalleryItem } from "@/lib/gallery/data";

/**
 * Editorial rhythm on a 6-column grid: a wide plate beside a narrow one, then
 * mirrored — so the eye crosses the page rather than scanning a ledger of
 * identical thumbnails. The pattern repeats every four tiles and each pair sums
 * to 6, so rows always close.
 *
 * An odd tile count would strand the last tile at a third of the width, which
 * reads as a bug rather than a choice; it runs full-bleed instead.
 */
function spanFor(index: number, total: number): 2 | 4 | 6 {
  if (index === total - 1 && total % 2 === 1) return 6;
  const step = index % 4;
  return step === 0 || step === 3 ? 4 : 2;
}

const SPAN_CLASS = {
  2: "lg:col-span-2",
  4: "lg:col-span-4",
  6: "lg:col-span-6",
} as const;

export function GalleryGrid({
  items,
  filters,
}: {
  items: GalleryItem[];
  filters: GalleryFilter[];
}) {
  const [active, setActive] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /*
   * Radix restores focus to the element that opened a dialog — but only to a
   * `DialogTrigger`, and this one is opened from state, so there is nothing for
   * it to hand focus back to. Worse, dropping `index` to null unmounts the
   * dialog outright, so its close-focus hook never runs at all and a keyboard
   * user is dumped at the top of the document.
   *
   * So put them back on the tile they were last looking at — which after paging
   * with the arrow keys is not necessarily the one they opened. The frame's
   * delay lets the dialog finish tearing down first; focusing into a subtree
   * Radix is still unmounting does not stick.
   */
  const closeLightbox = () => {
    const landOn = openIndex;
    setOpenIndex(null);
    requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-gallery-index="${landOn}"]`)
        ?.focus();
    });
  };

  const shown = useMemo(
    () => (active === "all" ? items : items.filter((i) => i.services?.slug === active)),
    [items, active]
  );

  // The lightbox pages through `shown`, so a filter change would leave its
  // index pointing at a different project — or past the end. Close instead.
  const selectFilter = (slug: string) => {
    setOpenIndex(null);
    setActive(slug);
  };

  return (
    <div>
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All work"
            active={active === "all"}
            onClick={() => selectFilter("all")}
          />
          {filters.map((f) => (
            <FilterChip
              key={f.slug}
              label={f.name}
              active={active === f.slug}
              onClick={() => selectFilter(f.slug)}
            />
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No projects in this category yet.
        </p>
      ) : (
        <div
          ref={gridRef}
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-6 lg:gap-6",
            filters.length > 0 && "mt-8"
          )}
        >
          {shown.map((item, i) => {
            const span = spanFor(i, shown.length);
            return (
              <Reveal
                key={item.id}
                delay={Math.min(i, 5) * 80}
                className={cn("h-full", SPAN_CLASS[span])}
              >
                <GalleryCard
                  item={item}
                  index={i}
                  wide={span !== 2}
                  onOpen={() => setOpenIndex(i)}
                />
              </Reveal>
            );
          })}
        </div>
      )}

      <GalleryLightbox
        items={shown}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={closeLightbox}
      />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-4 text-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground/30"
      )}
    >
      {label}
    </button>
  );
}
