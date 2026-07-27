"use client";

/* eslint-disable @next/next/no-img-element -- public bucket URLs, no next/image domain config */

import {
  Boxes,
  Flame,
  GalleryVerticalEnd,
  Lightbulb,
  PencilRuler,
  Tv,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { formatAud } from "@/lib/quote/estimate";
import { CUSTOM_SERVICE_SLUG, isCustomService } from "@/lib/services/custom";
import type { ServiceWithQuestions } from "@/lib/quote/types";
import { cn } from "@/lib/utils";

/** A recognisable icon per service, so photo-less tiles aren't all identical. */
function iconForSlug(slug: string): LucideIcon {
  if (slug === CUSTOM_SERVICE_SLUG) return PencilRuler;
  if (slug.includes("tv-wall")) return Tv;
  if (slug.includes("floating")) return GalleryVerticalEnd;
  if (slug.includes("showcase")) return Boxes;
  if (slug.includes("led") || slug.includes("light")) return Lightbulb;
  if (slug.includes("heater") || slug.includes("heat")) return Flame;
  return Wrench;
}

function priceSuffix(unit: string): string {
  if (unit === "per_metre") return " / m";
  if (unit === "per_hour") return " / hr";
  return "";
}

export function StepService({
  services,
  photos,
  selectedId,
  onSelect,
}: {
  services: ServiceWithQuestions[];
  photos: Record<string, string>;
  selectedId: string | null;
  onSelect: (service: ServiceWithQuestions) => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-2xl tracking-tight">What do you need done?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a service to start — you can add more detail next.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const photo = photos[service.id] ?? service.hero_image_url ?? null;
          const Icon = iconForSlug(service.slug);
          const selected = selectedId === service.id;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card text-left transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-elev-2",
                selected
                  ? "border-brand ring-1 ring-brand"
                  : "border-border hover:border-brand/40"
              )}
            >
              {/* Photo / branded fallback */}
              <div className="relative h-32 overflow-hidden bg-[#1a1714]">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                ) : (
                  <>
                    <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_35%,rgba(255,177,99,0.20),transparent_60%)]" />
                    <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_20%,rgba(201,162,75,0.14),transparent_55%)]" />
                    <Icon
                      className="absolute inset-0 m-auto size-8 text-[#c9a24b]/80"
                      aria-hidden
                    />
                  </>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(20,18,16,0.5),transparent)]" />
              </div>

              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-serif text-lg leading-tight tracking-tight">
                    {service.name}
                  </p>
                  {isCustomService(service) ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Priced on review
                      </span>{" "}
                      — tell us what you need
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      from{" "}
                      <span className="font-medium text-foreground">
                        {formatAud(service.base_price_cents)}
                      </span>
                      {priceSuffix(service.price_unit)}
                    </p>
                  )}
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-300",
                    selected
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border text-transparent group-hover:border-brand/50"
                  )}
                >
                  ✓
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
