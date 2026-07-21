"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeforeAfterSlider } from "@/components/gallery/before-after-slider";
import { cn } from "@/lib/utils";
import type { GalleryFilter, GalleryItem } from "@/lib/gallery/data";

export function GalleryGrid({
  items,
  filters,
}: {
  items: GalleryItem[];
  filters: GalleryFilter[];
}) {
  const [active, setActive] = useState<string>("all");

  const shown = useMemo(
    () => (active === "all" ? items : items.filter((i) => i.services?.slug === active)),
    [items, active]
  );

  return (
    <div>
      {/* Filter chips */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip label="All work" active={active === "all"} onClick={() => setActive("all")} />
          {filters.map((f) => (
            <FilterChip
              key={f.slug}
              label={f.name}
              active={active === f.slug}
              onClick={() => setActive(f.slug)}
            />
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No projects in this category yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item) => (
            <div key={item.id} className="card-lift overflow-hidden rounded-2xl border bg-card">
              <BeforeAfterSlider
                beforeUrl={item.before_image_url}
                afterUrl={item.after_image_url}
              />
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  {item.services && (
                    <p className="text-sm text-muted-foreground">{item.services.name}</p>
                  )}
                </div>
                {item.services?.slug && (
                  <Link
                    href={`/services/${item.services.slug}`}
                    className="flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                  >
                    Quote <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
